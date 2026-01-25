import cron from 'node-cron';
import prisma from '../db.js';
import { performDiscoverySweep } from './discovery.js';

/**
 * Initialize scheduled tasks
 */
export function initScheduler() {
  console.log('🕐 Initializing scheduled tasks...');

  // Daily summary at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('\n📊 Running daily summary...');
    await runDailySummary();
  });

  // Check for stale leads every day at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('\n⏰ Checking for stale applications...');
    await checkStaleApplications();
  });

  // Automated discovery sweep every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('\n🛰️ Running automated discovery sweep...');
    await performDiscoverySweep();
  });

  console.log('✅ Scheduled tasks initialized');
}

/**
 * Generate and log daily summary stats
 */
export async function runDailySummary() {
  try {
    const stats = await getStats();

    console.log('\n' + '='.repeat(50));
    console.log('🐸 FROGHUNTER DAILY SUMMARY');
    console.log('='.repeat(50));
    console.log(`📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log('');
    console.log('Pipeline Status:');
    console.log(`  • New leads:      ${stats.byStatus.RADAR_NEW}`);
    console.log(`  • Shortlisted:    ${stats.byStatus.SHORTLISTED}`);
    console.log(`  • Applied:        ${stats.byStatus.APPLIED}`);
    console.log(`  • Interviewing:   ${stats.byStatus.INTERVIEWING}`);
    console.log(`  • Archived:       ${stats.byStatus.ARCHIVED}`);
    console.log('');
    console.log('Activity (Last 7 Days):');
    console.log(`  • New leads added:    ${stats.recentActivity.newLeads}`);
    console.log(`  • Applications sent:  ${stats.recentActivity.applications}`);
    console.log('');
    console.log('By Source:');
    stats.bySource.forEach(s => {
      console.log(`  • ${s.source}: ${s._count.id} leads`);
    });
    console.log('='.repeat(50) + '\n');

    return stats;
  } catch (error) {
    console.error('Error running daily summary:', error);
  }
}

/**
 * Check for applications that haven't been updated in a while
 */
export async function checkStaleApplications() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleApplied = await prisma.jobLead.findMany({
      where: {
        status: 'APPLIED',
        updatedAt: { lt: sevenDaysAgo }
      }
    });

    const staleInterviewing = await prisma.jobLead.findMany({
      where: {
        status: 'INTERVIEWING',
        updatedAt: { lt: sevenDaysAgo }
      }
    });

    if (staleApplied.length > 0 || staleInterviewing.length > 0) {
      console.log('\n⚠️  STALE APPLICATIONS DETECTED:');

      if (staleApplied.length > 0) {
        console.log(`\nApplied (no update in 7+ days): ${staleApplied.length}`);
        staleApplied.forEach(lead => {
          console.log(`  • ${lead.title} at ${lead.companyName}`);
        });
      }

      if (staleInterviewing.length > 0) {
        console.log(`\nInterviewing (no update in 7+ days): ${staleInterviewing.length}`);
        staleInterviewing.forEach(lead => {
          console.log(`  • ${lead.title} at ${lead.companyName}`);
        });
      }
      console.log('');
    }

    return { staleApplied, staleInterviewing };
  } catch (error) {
    console.error('Error checking stale applications:', error);
  }
}

/**
 * Get comprehensive stats
 */
export async function getStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count by status
  const statusCounts = await prisma.jobLead.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const byStatus = {
    RADAR_NEW: 0,
    SHORTLISTED: 0,
    APPLIED: 0,
    INTERVIEWING: 0,
    ARCHIVED: 0,
  };
  statusCounts.forEach(s => {
    byStatus[s.status] = s._count.id;
  });

  // Count by source
  const bySource = await prisma.jobLead.groupBy({
    by: ['source'],
    _count: { id: true }
  });

  // Recent activity
  const newLeadsLast7Days = await prisma.jobLead.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  });

  const applicationsLast7Days = await prisma.jobLead.count({
    where: {
      status: { in: ['APPLIED', 'INTERVIEWING'] },
      updatedAt: { gte: sevenDaysAgo }
    }
  });

  // Daily counts for the last 30 days
  const dailyCounts = await prisma.$queryRaw`
    SELECT
      DATE(createdAt) as date,
      COUNT(*) as count
    FROM JobLead
    WHERE createdAt >= ${thirtyDaysAgo.toISOString()}
    GROUP BY DATE(createdAt)
    ORDER BY date
  `;

  // Average score
  const scoreStats = await prisma.jobLead.aggregate({
    _avg: { matchScore: true },
    _max: { matchScore: true },
    _min: { matchScore: true },
  });

  // Total counts
  const total = await prisma.jobLead.count();

  return {
    total,
    byStatus,
    bySource,
    scoreStats: {
      avg: Math.round(scoreStats._avg.matchScore || 0),
      max: scoreStats._max.matchScore || 0,
      min: scoreStats._min.matchScore || 0,
    },
    recentActivity: {
      newLeads: newLeadsLast7Days,
      applications: applicationsLast7Days,
    },
    dailyCounts,
    generatedAt: new Date().toISOString(),
  };
}

export default {
  initScheduler,
  runDailySummary,
  checkStaleApplications,
  getStats,
};
