import * as cheerio from 'cheerio';
import { cleanText, deduplicateJobs } from './utils.js';

/**
 * Parse Lever job board HTML
 * Lever boards use `.posting` divs, `.posting-title h5`, `.sort-by-location`, `.sort-by-team`
 * @param {string} html - Raw HTML from a Lever job board page
 * @returns {Array} Array of parsed job objects
 */
export function parseLever(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  const cardSelectors = [
    '.posting',
    'div[class*="posting"]',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // Fallback: links to lever job pages
  if (cards.length === 0) {
    $('a[href*="jobs.lever.co"]').each((_, link) => {
      const $link = $(link);
      const title = cleanText($link.text());
      const href = $link.attr('href') || '';
      if (title && title.length > 2 && title.length < 200) {
        jobs.push({
          title,
          companyName: '',
          location: '',
          jobUrl: href,
          description: '',
          source: 'Lever',
        });
      }
    });
    return deduplicateJobs(jobs);
  }

  cards.each((_, card) => {
    const $card = $(card);

    const title = cleanText($card.find('.posting-title h5, h5').first().text());
    const $link = $card.find('a[href*="lever.co"]').first();
    const jobUrl = $link.attr('href') || '';

    const location = cleanText(
      $card.find('.sort-by-location, .posting-categories .location, [class*="location"]').first().text()
    );
    const team = cleanText(
      $card.find('.sort-by-team, .posting-categories .team, [class*="team"]').first().text()
    );

    if (title) {
      jobs.push({
        title,
        companyName: '',
        location,
        jobUrl,
        description: team ? `Team: ${team}` : '',
        source: 'Lever',
      });
    }
  });

  return deduplicateJobs(jobs);
}

/**
 * Parse Lever public JSON API response
 * API: GET https://api.lever.co/v0/postings/{org}
 * @param {Array|object} json - Parsed JSON from the API (array of postings)
 * @param {string} org - Organisation slug
 * @returns {Array} Array of parsed job objects
 */
export function parseLeverApi(json, org) {
  const jobs = [];

  const postings = Array.isArray(json) ? json : [];
  for (const entry of postings) {
    const title = cleanText(entry.text);
    if (!title) continue;

    const location = cleanText(entry.categories?.location || '');
    const team = cleanText(entry.categories?.team || '');
    const jobUrl = entry.hostedUrl || entry.applyUrl || `https://jobs.lever.co/${org}/${entry.id}`;

    const descParts = [];
    if (team) descParts.push(`Team: ${team}`);
    if (entry.categories?.commitment) descParts.push(entry.categories.commitment);

    jobs.push({
      title,
      companyName: org,
      location,
      jobUrl,
      description: descParts.join(' | '),
      source: 'Lever',
    });
  }

  return deduplicateJobs(jobs);
}
