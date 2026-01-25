import * as cheerio from 'cheerio';

/**
 * Parse LinkedIn job search results HTML
 * Handles both logged-in and logged-out views
 * @param {string} html - Raw HTML from LinkedIn search results
 * @returns {Array} Array of parsed job objects
 */
export function parseLinkedIn(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  // LinkedIn uses various container patterns for job cards
  // Try multiple selectors to handle different page structures
  const cardSelectors = [
    // Logged-in job search results
    '.job-card-container',
    '.jobs-search-results__list-item',
    '[data-job-id]',
    // Logged-out/public job search
    '.base-card',
    '.job-search-card',
    // Generic fallback
    'li[class*="job"]',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // If no cards found, try to find any links with job URLs
  if (cards.length === 0) {
    const jobLinks = $('a[href*="/jobs/view/"], a[href*="/jobs/collections/"]');
    jobLinks.each((_, link) => {
      const job = extractJobFromLink($, $(link));
      if (job && job.title) {
        jobs.push(job);
      }
    });
    return deduplicateJobs(jobs);
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
 * Extract job data from a job card element
 */
function extractJobFromCard($, $card) {
  // Find job URL - look for links with job IDs
  let jobUrl = '';
  const jobLink = $card.find('a[href*="/jobs/view/"], a[href*="/jobs/collections/"]').first();
  if (jobLink.length) {
    jobUrl = normalizeLinkedInUrl(jobLink.attr('href'));
  }

  // Extract title - usually in the link or a heading
  let title = '';
  const titleSelectors = [
    '.job-card-list__title',
    '.base-search-card__title',
    'h3',
    'h4',
    '[class*="title"]',
    'a[href*="/jobs/"]',
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
    '.job-card-container__company-name',
    '.base-search-card__subtitle',
    '[class*="company"]',
    'h4',
    '.artdeco-entity-lockup__subtitle',
  ];
  for (const sel of companySelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text !== title && text.length > 1 && text.length < 100) {
      companyName = text;
      break;
    }
  }

  // Extract location
  let location = '';
  const locationSelectors = [
    '.job-card-container__metadata-item',
    '.job-search-card__location',
    '[class*="location"]',
    '.artdeco-entity-lockup__caption',
  ];
  for (const sel of locationSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 2 && text.length < 100) {
      location = text;
      break;
    }
  }

  // Extract description snippet if available
  let description = '';
  const descSelectors = [
    '.job-card-list__insight',
    '[class*="description"]',
    '[class*="snippet"]',
  ];
  for (const sel of descSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 10) {
      description = text.substring(0, 500);
      break;
    }
  }

  // Try to extract salary if present
  let salary = '';
  const salaryMatch = $card.text().match(/[£$€]\s*[\d,]+(?:\s*[-–]\s*[£$€]?\s*[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|annum|month|hour|hr|pa))?/i);
  if (salaryMatch) {
    salary = salaryMatch[0].trim();
  }

  return {
    title: cleanText(title),
    companyName: cleanText(companyName),
    location: cleanText(location),
    jobUrl,
    description: cleanText(description),
    salary,
    source: 'LinkedIn',
  };
}

/**
 * Extract job from a standalone link element
 */
function extractJobFromLink($, $link) {
  const jobUrl = normalizeLinkedInUrl($link.attr('href'));
  const title = cleanText($link.text());

  // Try to find company/location from surrounding elements
  const $parent = $link.parent();
  const siblingText = $parent.text().replace(title, '').trim();

  return {
    title,
    companyName: '',
    location: '',
    jobUrl,
    description: siblingText.substring(0, 200),
    source: 'LinkedIn',
  };
}

/**
 * Normalize LinkedIn job URL to a consistent format
 */
function normalizeLinkedInUrl(url) {
  if (!url) return '';

  // Handle relative URLs
  if (url.startsWith('/')) {
    url = 'https://www.linkedin.com' + url;
  }

  // Extract just the job view URL, removing tracking params
  const match = url.match(/(https:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/\d+)/);
  if (match) {
    return match[1];
  }

  // Return cleaned URL
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
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

export default parseLinkedIn;
