import * as cheerio from 'cheerio';
import { cleanText, deduplicateJobs } from './utils.js';

/**
 * Parse Ashby job board HTML (fallback — Ashby is a React SPA with limited SSR)
 * @param {string} html - Raw HTML from an Ashby job board page
 * @returns {Array} Array of parsed job objects
 */
export function parseAshby(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  // Ashby renders job listings in various div structures
  const cardSelectors = [
    '[data-testid="job-posting"]',
    'a[href*="/jobs/"]',
    '[class*="posting"]',
    '[class*="job-listing"]',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // Fallback: any links containing job paths
  if (cards.length === 0) {
    $('a[href*="/jobs/"], a[href*="/posting/"]').each((_, link) => {
      const $link = $(link);
      const title = cleanText($link.text());
      let href = $link.attr('href') || '';
      if (href && !href.startsWith('http')) {
        href = `https://jobs.ashbyhq.com${href}`;
      }
      if (title && title.length > 2 && title.length < 200) {
        jobs.push({
          title,
          companyName: '',
          location: '',
          jobUrl: href,
          description: '',
          source: 'Ashby',
        });
      }
    });
    return deduplicateJobs(jobs);
  }

  cards.each((_, card) => {
    const $card = $(card);
    const isLink = $card.is('a');

    let title = '';
    let jobUrl = '';

    if (isLink) {
      title = cleanText($card.text());
      jobUrl = $card.attr('href') || '';
    } else {
      title = cleanText($card.find('h3, h4, [class*="title"]').first().text());
      const $link = $card.find('a').first();
      jobUrl = $link.attr('href') || '';
    }

    if (jobUrl && !jobUrl.startsWith('http')) {
      jobUrl = `https://jobs.ashbyhq.com${jobUrl}`;
    }

    const location = cleanText($card.find('[class*="location"], [class*="Location"]').first().text());
    const team = cleanText($card.find('[class*="team"], [class*="department"]').first().text());

    if (title) {
      jobs.push({
        title,
        companyName: '',
        location,
        jobUrl,
        description: team ? `Team: ${team}` : '',
        source: 'Ashby',
      });
    }
  });

  return deduplicateJobs(jobs);
}

/**
 * Parse Ashby public JSON API response
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{org}
 * @param {object} json - Parsed JSON from the API
 * @param {string} org - Organisation slug
 * @returns {Array} Array of parsed job objects
 */
export function parseAshbyApi(json, org) {
  const jobs = [];

  const jobList = json?.jobs || [];
  for (const entry of jobList) {
    const title = cleanText(entry.title);
    if (!title) continue;

    const location = cleanText(entry.location || entry.locationName || '');
    const team = cleanText(entry.departmentName || entry.team || '');
    const jobUrl = entry.jobUrl
      || entry.applyUrl
      || `https://jobs.ashbyhq.com/${org}/${entry.id}`;

    const descParts = [];
    if (team) descParts.push(`Team: ${team}`);
    if (entry.employmentType) descParts.push(entry.employmentType);

    jobs.push({
      title,
      companyName: org,
      location,
      jobUrl,
      description: descParts.join(' | '),
      source: 'Ashby',
    });
  }

  return deduplicateJobs(jobs);
}
