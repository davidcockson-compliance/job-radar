import * as cheerio from 'cheerio';
import { cleanText, deduplicateJobs } from './utils.js';

/**
 * Parse Greenhouse job board HTML
 * Greenhouse boards use `.opening` divs with `<a>` links and `.location` spans
 * @param {string} html - Raw HTML from a Greenhouse job board page
 * @returns {Array} Array of parsed job objects
 */
export function parseGreenhouse(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  const cardSelectors = [
    '.opening',
    'div[class*="opening"]',
    'tr.job-post',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // Fallback: links containing /jobs/ on greenhouse domains
  if (cards.length === 0) {
    $('a[href*="/jobs/"]').each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href') || '';
      const title = cleanText($link.text());
      if (title && title.length > 2 && title.length < 200) {
        jobs.push({
          title,
          companyName: '',
          location: '',
          jobUrl: href.startsWith('http') ? href : `https://boards.greenhouse.io${href}`,
          description: '',
          source: 'Greenhouse',
        });
      }
    });
    return deduplicateJobs(jobs);
  }

  cards.each((_, card) => {
    const $card = $(card);

    const $link = $card.find('a').first();
    const title = cleanText($link.text());
    let jobUrl = $link.attr('href') || '';
    if (jobUrl && !jobUrl.startsWith('http')) {
      jobUrl = `https://boards.greenhouse.io${jobUrl}`;
    }

    const location = cleanText($card.find('.location, span[class*="location"]').text());

    if (title) {
      jobs.push({
        title,
        companyName: '',
        location,
        jobUrl,
        description: '',
        source: 'Greenhouse',
      });
    }
  });

  return deduplicateJobs(jobs);
}

/**
 * Parse Greenhouse public JSON API response
 * API: GET https://boards-api.greenhouse.io/v1/boards/{org}/jobs
 * @param {object} json - Parsed JSON from the API
 * @param {string} org - Organisation slug (used for URL construction)
 * @returns {Array} Array of parsed job objects
 */
export function parseGreenhouseApi(json, org) {
  const jobs = [];

  const jobList = json?.jobs || [];
  for (const entry of jobList) {
    const title = cleanText(entry.title);
    if (!title) continue;

    const location = cleanText(entry.location?.name || '');
    const jobUrl = entry.absolute_url || `https://boards.greenhouse.io/${org}/jobs/${entry.id}`;
    const description = cleanText(
      typeof entry.content === 'string'
        ? entry.content.replace(/<[^>]*>/g, ' ')
        : ''
    );

    jobs.push({
      title,
      companyName: org,
      location,
      jobUrl,
      description: description.substring(0, 500),
      source: 'Greenhouse',
    });
  }

  return deduplicateJobs(jobs);
}
