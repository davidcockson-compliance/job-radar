/**
 * Shared parser utilities used across all job board parsers
 */

/**
 * Clean and normalize text by collapsing whitespace
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

/**
 * Remove duplicate jobs based on jobUrl
 * @param {Array} jobs
 * @returns {Array}
 */
export function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    if (!job.jobUrl || seen.has(job.jobUrl)) {
      return false;
    }
    seen.add(job.jobUrl);
    return true;
  });
}
