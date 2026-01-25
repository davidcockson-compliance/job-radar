import { parseLinkedIn } from './linkedin.js';
import { parseIndeed } from './indeed.js';
import { parseOtta } from './otta.js';

/**
 * Parse HTML from various job board sources
 * @param {string} html - Raw HTML content
 * @param {string} source - Source identifier: 'LinkedIn', 'Indeed', 'Otta', or 'auto'
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
    default:
      // Try all parsers and return results from whichever finds jobs
      const linkedInJobs = parseLinkedIn(html);
      if (linkedInJobs.length > 0) return linkedInJobs;

      const indeedJobs = parseIndeed(html);
      if (indeedJobs.length > 0) return indeedJobs;

      const ottaJobs = parseOtta(html);
      if (ottaJobs.length > 0) return ottaJobs;

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

  return 'auto';
}

export { parseLinkedIn } from './linkedin.js';
export { parseIndeed } from './indeed.js';
export { parseOtta } from './otta.js';
