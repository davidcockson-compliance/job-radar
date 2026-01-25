import * as cheerio from 'cheerio';

/**
 * Parse Indeed job search results HTML
 * @param {string} html - Raw HTML from Indeed search results
 * @returns {Array} Array of parsed job objects
 */
export function parseIndeed(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  // Indeed job card selectors
  const cardSelectors = [
    '.job_seen_beacon',
    '.jobsearch-ResultsList > li',
    '[data-jk]',
    '.result',
    '.tapItem',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  cards.each((_, card) => {
    const $card = $(card);
    const job = extractJobFromCard($, $card);
    if (job && job.title) {
      jobs.push(job);
    }
  });

  return deduplicateJobs(jobs);
}

/**
 * Extract job data from an Indeed job card
 */
function extractJobFromCard($, $card) {
  // Extract job ID for URL construction
  let jobId = $card.attr('data-jk') || '';
  if (!jobId) {
    const link = $card.find('a[data-jk]').first();
    jobId = link.attr('data-jk') || '';
  }

  // Find job URL
  let jobUrl = '';
  const jobLink = $card.find('a[href*="/rc/clk"], a[href*="/viewjob"], a.jcs-JobTitle').first();
  if (jobLink.length) {
    jobUrl = normalizeIndeedUrl(jobLink.attr('href'), jobId);
  } else if (jobId) {
    jobUrl = `https://uk.indeed.com/viewjob?jk=${jobId}`;
  }

  // Extract title
  let title = '';
  const titleSelectors = [
    '.jobTitle span',
    '.jobTitle',
    'h2.jobTitle',
    '[class*="jobTitle"]',
    'a[data-jk]',
  ];
  for (const sel of titleSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 2 && text.length < 200) {
      title = text;
      break;
    }
  }

  // Extract company name
  let companyName = '';
  const companySelectors = [
    '[data-testid="company-name"]',
    '.companyName',
    '.company',
    '[class*="company"]',
  ];
  for (const sel of companySelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 1 && text.length < 100) {
      companyName = text;
      break;
    }
  }

  // Extract location
  let location = '';
  const locationSelectors = [
    '[data-testid="text-location"]',
    '.companyLocation',
    '.location',
    '[class*="location"]',
  ];
  for (const sel of locationSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 2 && text.length < 100) {
      location = text;
      break;
    }
  }

  // Extract salary if present
  let salary = '';
  const salarySelectors = [
    '[data-testid="attribute_snippet_testid"]',
    '.salary-snippet-container',
    '.salaryText',
    '[class*="salary"]',
  ];
  for (const sel of salarySelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.match(/[£$€\d]/)) {
      salary = text;
      break;
    }
  }

  // Extract job snippet/description
  let description = '';
  const descSelectors = [
    '.job-snippet',
    '[class*="snippet"]',
    '.summary',
  ];
  for (const sel of descSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 10) {
      description = text.substring(0, 500);
      break;
    }
  }

  // Check for job type badges (Remote, Full-time, etc.)
  let jobType = '';
  const metadataText = $card.find('[class*="metadata"], [class*="attribute"]').text();
  if (metadataText.toLowerCase().includes('remote')) {
    jobType = 'Remote';
  } else if (metadataText.toLowerCase().includes('hybrid')) {
    jobType = 'Hybrid';
  }

  return {
    title: cleanText(title),
    companyName: cleanText(companyName),
    location: cleanText(location) + (jobType ? ` (${jobType})` : ''),
    jobUrl,
    description: cleanText(description),
    salary: cleanText(salary),
    source: 'Indeed',
  };
}

/**
 * Normalize Indeed job URL
 */
function normalizeIndeedUrl(url, jobId) {
  if (!url) {
    return jobId ? `https://uk.indeed.com/viewjob?jk=${jobId}` : '';
  }

  // Handle relative URLs
  if (url.startsWith('/')) {
    url = 'https://uk.indeed.com' + url;
  }

  // Clean up tracking params but keep job ID
  try {
    const parsed = new URL(url);
    const jk = parsed.searchParams.get('jk') || jobId;
    if (jk) {
      return `https://uk.indeed.com/viewjob?jk=${jk}`;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

/**
 * Remove duplicate jobs based on URL
 */
function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    if (!job.jobUrl || seen.has(job.jobUrl)) {
      return false;
    }
    seen.add(job.jobUrl);
    return true;
  });
}

export default parseIndeed;
