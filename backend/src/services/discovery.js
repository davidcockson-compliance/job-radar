import prisma from '../db.js';
import { parseJobHtml } from '../parsers/index.js';
import { scoreJobs } from './scoring.js';
import puppeteer from 'puppeteer';

/**
 * Generate search URLs for different job boards
 */
function generateSearchUrls(title, location) {
    const encodedTitle = encodeURIComponent(title);
    const encodedLocation = encodeURIComponent(location);

    return [
        {
            source: 'LinkedIn',
            url: `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}&location=${encodedLocation}&f_TPR=r604800` // Past week
        },
        {
            source: 'Indeed',
            url: `https://uk.indeed.com/jobs?q=${encodedTitle}&l=${encodedLocation}&fromage=7` // Past week
        }
    ];
}

/**
 * Fetch HTML using Puppeteer to handle JS and bot detection
 */
async function fetchHtmlWithPuppeteer(url) {
    let browser = null;
    try {
        console.log(`Launching browser for ${url}...`);
        // Launch headless browser with args to fix Windows crash
        // Try to use system Chrome to avoid bundled Chromium issues
        // Launch settings tailored for environment
        const launchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        };

        // Use system Chrome on Windows to avoid bundled Chromium issues
        if (process.platform === 'win32') {
            launchOptions.channel = 'chrome';
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Basic scroll to trigger lazy loading
        await page.evaluate(async () => {
            window.scrollBy(0, window.innerHeight);
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        // Get the full HTML
        const html = await page.content();
        console.log(`Fetched ${html.length} chars via Puppeteer`);

        return html;
    } catch (error) {
        console.error(`Error fetching ${url} with Puppeteer:`, error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Perform a discovery sweep for all active radar zones
 */
export async function performDiscoverySweep() {
    console.log('Starting automated discovery sweep (Puppeteer)...');

    const activeZones = await prisma.radarZone.findMany({
        where: { active: true }
    });

    let totalProcessed = 0;
    let totalNew = 0;

    for (const zone of activeZones) {
        if (!zone.searchTitle || !zone.searchLocation) {
            console.log(`Skipping zone "${zone.name}": searchTitle or searchLocation missing.`);
            continue;
        }

        console.log(`Sweeping for zone: ${zone.name} (${zone.searchTitle} in ${zone.searchLocation})`);

        const searchTasks = generateSearchUrls(zone.searchTitle, zone.searchLocation);

        for (const task of searchTasks) {
            // Use Puppeteer instead of fetch
            const html = await fetchHtmlWithPuppeteer(task.url);

            if (!html) {
                console.log(`Failed to fetch HTML from ${task.source} for zone ${zone.name}`);
                continue;
            }

            const parsedJobs = parseJobHtml(html, task.source);
            console.log(`Parsed ${parsedJobs.length} jobs from ${task.source}`);

            if (parsedJobs.length === 0) continue;

            const scoredJobs = await scoreJobs(parsedJobs);

            for (const job of scoredJobs) {
                totalProcessed++;
                try {
                    // Check if job already exists
                    const existing = await prisma.jobLead.findUnique({
                        where: { jobUrl: job.jobUrl }
                    });

                    if (existing) continue;

                    // Create new job lead
                    await prisma.jobLead.create({
                        data: {
                            title: job.title,
                            companyName: job.companyName,
                            location: job.location || null,
                            jobUrl: job.jobUrl,
                            description: job.description || null,
                            source: job.source,
                            matchScore: job.matchScore,
                            status: 'RADAR_NEW',
                        }
                    });
                    totalNew++;
                } catch (err) {
                    if (err.code !== 'P2002') {
                        console.error('Error saving lead:', err);
                    }
                }
            }
        }
    }

    console.log(`Discovery sweep complete. Processed ${totalProcessed} jobs, found ${totalNew} new leads.`);
    return { processed: totalProcessed, new: totalNew };
}
