import prisma from '../db.js';

/**
 * Default scoring weights
 */
const WEIGHTS = {
  GREEN_FLAG_TITLE: 25,      // Green flag found in job title
  GREEN_FLAG_COMPANY: 15,    // Green flag found in company name
  GREEN_FLAG_LOCATION: 10,   // Green flag found in location
  GREEN_FLAG_DESCRIPTION: 5, // Green flag found in description
  RED_FLAG_TITLE: -30,       // Red flag found in job title
  RED_FLAG_COMPANY: -20,     // Red flag found in company name
  RED_FLAG_LOCATION: -50,    // Red flag found in location (e.g., "On-site" when remote preferred)
  RED_FLAG_DESCRIPTION: -10, // Red flag found in description
};

/**
 * Calculate match score for a job against active radar zones
 * @param {Object} job - Job object with title, companyName, location, description
 * @returns {Promise<{score: number, matches: Object}>}
 */
export async function calculateScore(job) {
  // Get all active radar zones
  const zones = await prisma.radarZone.findMany({
    where: { active: true }
  });

  if (zones.length === 0) {
    return { score: 0, matches: { greenFlags: [], redFlags: [] } };
  }

  let totalScore = 0;
  const matchedGreenFlags = [];
  const matchedRedFlags = [];

  // Prepare searchable text fields
  const titleLower = (job.title || '').toLowerCase();
  const companyLower = (job.companyName || '').toLowerCase();
  const locationLower = (job.location || '').toLowerCase();
  const descriptionLower = (job.description || '').toLowerCase();

  for (const zone of zones) {
    const greenFlags = JSON.parse(zone.greenFlags || '[]');
    const redFlags = JSON.parse(zone.redFlags || '[]');

    // Check green flags
    for (const flag of greenFlags) {
      const flagLower = flag.toLowerCase();

      if (titleLower.includes(flagLower)) {
        totalScore += WEIGHTS.GREEN_FLAG_TITLE;
        matchedGreenFlags.push({ flag, field: 'title', points: WEIGHTS.GREEN_FLAG_TITLE });
      }
      if (companyLower.includes(flagLower)) {
        totalScore += WEIGHTS.GREEN_FLAG_COMPANY;
        matchedGreenFlags.push({ flag, field: 'company', points: WEIGHTS.GREEN_FLAG_COMPANY });
      }
      if (locationLower.includes(flagLower)) {
        totalScore += WEIGHTS.GREEN_FLAG_LOCATION;
        matchedGreenFlags.push({ flag, field: 'location', points: WEIGHTS.GREEN_FLAG_LOCATION });
      }
      if (descriptionLower.includes(flagLower)) {
        totalScore += WEIGHTS.GREEN_FLAG_DESCRIPTION;
        matchedGreenFlags.push({ flag, field: 'description', points: WEIGHTS.GREEN_FLAG_DESCRIPTION });
      }
    }

    // Check red flags
    for (const flag of redFlags) {
      const flagLower = flag.toLowerCase();

      if (titleLower.includes(flagLower)) {
        totalScore += WEIGHTS.RED_FLAG_TITLE;
        matchedRedFlags.push({ flag, field: 'title', points: WEIGHTS.RED_FLAG_TITLE });
      }
      if (companyLower.includes(flagLower)) {
        totalScore += WEIGHTS.RED_FLAG_COMPANY;
        matchedRedFlags.push({ flag, field: 'company', points: WEIGHTS.RED_FLAG_COMPANY });
      }
      if (locationLower.includes(flagLower)) {
        totalScore += WEIGHTS.RED_FLAG_LOCATION;
        matchedRedFlags.push({ flag, field: 'location', points: WEIGHTS.RED_FLAG_LOCATION });
      }
      if (descriptionLower.includes(flagLower)) {
        totalScore += WEIGHTS.RED_FLAG_DESCRIPTION;
        matchedRedFlags.push({ flag, field: 'description', points: WEIGHTS.RED_FLAG_DESCRIPTION });
      }
    }
  }

  return {
    score: totalScore,
    matches: {
      greenFlags: matchedGreenFlags,
      redFlags: matchedRedFlags,
    }
  };
}

/**
 * Score multiple jobs at once
 * @param {Array} jobs - Array of job objects
 * @returns {Promise<Array>} Jobs with matchScore added
 */
export async function scoreJobs(jobs) {
  const scoredJobs = [];

  for (const job of jobs) {
    const { score, matches } = await calculateScore(job);
    scoredJobs.push({
      ...job,
      matchScore: score,
      scoreMatches: matches,
    });
  }

  // Sort by score descending
  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  return scoredJobs;
}

/**
 * Re-score all existing leads based on current radar zones
 * Useful after updating radar zone keywords
 */
export async function rescoreAllLeads() {
  const leads = await prisma.jobLead.findMany();

  for (const lead of leads) {
    const { score } = await calculateScore(lead);
    await prisma.jobLead.update({
      where: { id: lead.id },
      data: { matchScore: score }
    });
  }

  return leads.length;
}

export default {
  calculateScore,
  scoreJobs,
  rescoreAllLeads,
};
