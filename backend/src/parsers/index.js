import { parseLinkedIn } from './linkedin.js';
import { parseIndeed } from './indeed.js';
import { parseOtta } from './otta.js';
import { parseGreenhouse, parseGreenhouseApi } from './greenhouse.js';
import { parseLever, parseLeverApi } from './lever.js';
import { parseAshby, parseAshbyApi } from './ashby.js';
import { parseRippling, parseRipplingApi } from './rippling.js';

/**
 * Parse HTML from various job board sources
 * @param {string} html - Raw HTML content
 * @param {string} source - Source identifier: 'LinkedIn', 'Indeed', 'Otta', 'Greenhouse', 'Lever', 'Ashby', 'Rippling', or 'auto'
 * @returns {Array} Array of parsed job objects
 */
export function parseJobHtml(html, source = 'auto') {
  if (!html || typeof html !== 'string') {
    return [];
  }

  // Auto-detect source from HTML content
  if (source === 'auto') {
    source = detectSource(html);
  }

  switch (source.toLowerCase()) {
    case 'linkedin':
      return parseLinkedIn(html);
    case 'indeed':
      return parseIndeed(html);
    case 'otta':
      return parseOtta(html);
    case 'greenhouse':
      return parseGreenhouse(html);
    case 'lever':
      return parseLever(html);
    case 'ashby':
      return parseAshby(html);
    case 'rippling':
      return parseRippling(html);
    default:
      // Try all parsers and return results from whichever finds jobs
      const linkedInJobs = parseLinkedIn(html);
      if (linkedInJobs.length > 0) return linkedInJobs;

      const indeedJobs = parseIndeed(html);
      if (indeedJobs.length > 0) return indeedJobs;

      const ottaJobs = parseOtta(html);
      if (ottaJobs.length > 0) return ottaJobs;

      const greenhouseJobs = parseGreenhouse(html);
      if (greenhouseJobs.length > 0) return greenhouseJobs;

      const leverJobs = parseLever(html);
      if (leverJobs.length > 0) return leverJobs;

      const ashbyJobs = parseAshby(html);
      if (ashbyJobs.length > 0) return ashbyJobs;

      const ripplingJobs = parseRippling(html);
      if (ripplingJobs.length > 0) return ripplingJobs;

      return [];
  }
}

/**
 * Parse JSON API response from ATS platforms
 * @param {object|Array} json - Parsed JSON from the API
 * @param {string} source - Source identifier: 'Greenhouse', 'Lever', 'Ashby', 'Rippling'
 * @param {string} org - Organisation slug used in the API URL
 * @returns {Array} Array of parsed job objects
 */
export function parseJobJson(json, source, org) {
  if (!json) return [];

  switch (source.toLowerCase()) {
    case 'greenhouse':
      return parseGreenhouseApi(json, org);
    case 'lever':
      return parseLeverApi(json, org);
    case 'ashby':
      return parseAshbyApi(json, org);
    case 'rippling':
      return parseRipplingApi(json, org);
    default:
      return [];
  }
}

/**
 * Detect the source job board from HTML content
 */
function detectSource(html) {
  const lowerHtml = html.toLowerCase();

  if (lowerHtml.includes('linkedin.com') || lowerHtml.includes('job-card-container')) {
    return 'LinkedIn';
  }

  if (lowerHtml.includes('indeed.com') || lowerHtml.includes('jobsearch-resultsList')) {
    return 'Indeed';
  }

  if (lowerHtml.includes('otta.com') || lowerHtml.includes('otta')) {
    return 'Otta';
  }

  if (lowerHtml.includes('boards.greenhouse.io') || lowerHtml.includes('greenhouse')) {
    return 'Greenhouse';
  }

  if (lowerHtml.includes('jobs.lever.co') || lowerHtml.includes('lever.co')) {
    return 'Lever';
  }

  if (lowerHtml.includes('jobs.ashbyhq.com') || lowerHtml.includes('ashbyhq')) {
    return 'Ashby';
  }

  if (lowerHtml.includes('ats.rippling.com') || lowerHtml.includes('rippling.com')) {
    return 'Rippling';
  }

  return 'auto';
}

export { parseLinkedIn } from './linkedin.js';
export { parseIndeed } from './indeed.js';
export { parseOtta } from './otta.js';
export { parseGreenhouse, parseGreenhouseApi } from './greenhouse.js';
export { parseLever, parseLeverApi } from './lever.js';
export { parseAshby, parseAshbyApi } from './ashby.js';
export { parseRippling, parseRipplingApi } from './rippling.js';
