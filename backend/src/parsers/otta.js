import * as cheerio from 'cheerio';

/**
 * Parse Otta job search results HTML
 * @param {string} html - Raw HTML from Otta search results
 * @returns {Array} Array of parsed job objects
 */
export function parseOtta(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  // Otta uses a card-based layout
  const cardSelectors = [
    '[data-testid="job-card"]',
    '.job-card',
    'article',
    '[class*="JobCard"]',
  ];

  let cards = $();
  for (const selector of cardSelectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  // Fallback: look for links to job pages
  if (cards.length === 0) {
    const jobLinks = $('a[href*="/jobs/"]');
    jobLinks.each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      if (href && href.includes('/jobs/') && !href.includes('/jobs/search')) {
        const job = extractJobFromLink($, $link);
        if (job && job.title) {
          jobs.push(job);
        }
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
 * Extract job data from an Otta job card
 */
function extractJobFromCard($, $card) {
  // Find job URL
  let jobUrl = '';
  const jobLink = $card.find('a[href*="/jobs/"]').first();
  if (jobLink.length) {
    jobUrl = normalizeOttaUrl(jobLink.attr('href'));
  }

  // Extract title - usually in h2 or h3
  let title = '';
  const titleSelectors = ['h2', 'h3', '[class*="title"]', 'a[href*="/jobs/"]'];
  for (const sel of titleSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 2 && text.length < 200) {
      title = text;
      break;
    }
  }

  // Extract company name - Otta shows company prominently
  let companyName = '';
  const companySelectors = [
    '[class*="company"]',
    '[class*="Company"]',
    'a[href*="/companies/"]',
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
    '[class*="location"]',
    '[class*="Location"]',
  ];
  for (const sel of locationSelectors) {
    const el = $card.find(sel).first();
    const text = el.text().trim();
    if (text && text.length > 2 && text.length < 100) {
      location = text;
      break;
    }
  }

  // Extract salary - Otta often shows salary ranges
  let salary = '';
  const salaryMatch = $card.text().match(/[£$€]\s*[\d,]+(?:k)?(?:\s*[-–]\s*[£$€]?\s*[\d,]+(?:k)?)?/i);
  if (salaryMatch) {
    salary = salaryMatch[0].trim();
  }

  // Extract tags/skills
  let description = '';
  const tags = [];
  $card.find('[class*="tag"], [class*="Tag"], [class*="skill"], [class*="Skill"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 50) {
      tags.push(text);
    }
  });
  if (tags.length > 0) {
    description = 'Skills: ' + tags.join(', ');
  }

  return {
    title: cleanText(title),
    companyName: cleanText(companyName),
    location: cleanText(location),
    jobUrl,
    description: cleanText(description),
    salary,
    source: 'Otta',
  };
}

/**
 * Extract job from a link element
 */
function extractJobFromLink($, $link) {
  const jobUrl = normalizeOttaUrl($link.attr('href'));
  const title = cleanText($link.text());

  return {
    title,
    companyName: '',
    location: '',
    jobUrl,
    description: '',
    source: 'Otta',
  };
}

/**
 * Normalize Otta job URL
 */
function normalizeOttaUrl(url) {
  if (!url) return '';

  // Handle relative URLs
  if (url.startsWith('/')) {
    url = 'https://otta.com' + url;
  }

  return url;
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

export default parseOtta;
