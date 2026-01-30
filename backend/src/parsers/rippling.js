import * as cheerio from 'cheerio';
import { cleanText, deduplicateJobs } from './utils.js';

/**
 * Parse Rippling job board HTML (fallback — Rippling is JS-rendered)
 * @param {string} html - Raw HTML from a Rippling ATS board page
 * @returns {Array} Array of parsed job objects
 */
export function parseRippling(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  const cardSelectors = [
    '[data-testid="job-posting"]',
    'a[href*="/jobs/"]',
    '[class*="job-card"]',
    '[class*="posting"]',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // Fallback: any links to job pages
  if (cards.length === 0) {
    $('a[href*="/jobs/"], a[href*="/job/"]').each((_, link) => {
      const $link = $(link);
      const title = cleanText($link.text());
      let href = $link.attr('href') || '';
      if (href && !href.startsWith('http')) {
        href = `https://ats.rippling.com${href}`;
      }
      if (title && title.length > 2 && title.length < 200) {
        jobs.push({
          title,
          companyName: '',
          location: '',
          jobUrl: href,
          description: '',
          source: 'Rippling',
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
      jobUrl = `https://ats.rippling.com${jobUrl}`;
    }

    const location = cleanText($card.find('[class*="location"], [class*="Location"]').first().text());
    const department = cleanText($card.find('[class*="department"], [class*="team"]').first().text());

    if (title) {
      jobs.push({
        title,
        companyName: '',
        location,
        jobUrl,
        description: department ? `Department: ${department}` : '',
        source: 'Rippling',
      });
    }
  });

  return deduplicateJobs(jobs);
}

/**
 * Parse Rippling public JSON API response
 * API: GET https://ats.rippling.com/api/public/board/{org}/jobs
 * @param {object} json - Parsed JSON from the API
 * @param {string} org - Organisation slug
 * @returns {Array} Array of parsed job objects
 */
export function parseRipplingApi(json, org) {
  const jobs = [];

  // Rippling API may return jobs at top level or nested
  const jobList = Array.isArray(json) ? json : (json?.jobs || json?.data || []);
  for (const entry of jobList) {
    const title = cleanText(entry.title || entry.name);
    if (!title) continue;

    const location = cleanText(
      entry.location?.name || entry.location || entry.locationName || ''
    );
    const department = cleanText(entry.department?.name || entry.department || '');
    const jobUrl = entry.url
      || entry.applyUrl
      || `https://ats.rippling.com/${org}/jobs/${entry.id}`;

    const descParts = [];
    if (department) descParts.push(`Department: ${department}`);
    if (entry.employmentType) descParts.push(entry.employmentType);

    jobs.push({
      title,
      companyName: org,
      location,
      jobUrl,
      description: descParts.join(' | '),
      source: 'Rippling',
    });
  }

  return deduplicateJobs(jobs);
}
