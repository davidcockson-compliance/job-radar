/**
 * Companies House API Integration
 *
 * Note: Requires API key from https://developer.company-information.service.gov.uk/
 * Set COMPANIES_HOUSE_API_KEY environment variable
 */

const API_BASE = 'https://api.company-information.service.gov.uk';

/**
 * Search for companies by name
 * @param {string} query - Company name to search
 * @returns {Promise<Array>} Array of matching companies
 */
export async function searchCompanies(query) {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    console.warn('COMPANIES_HOUSE_API_KEY not set - using mock data');
    return getMockSearchResults(query);
  }

  try {
    const response = await fetch(
      `${API_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=5`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Companies House API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Companies House search failed:', error);
    return [];
  }
}

/**
 * Get company profile by company number
 * @param {string} companyNumber - Companies House company number
 * @returns {Promise<Object|null>} Company profile data
 */
export async function getCompanyProfile(companyNumber) {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    console.warn('COMPANIES_HOUSE_API_KEY not set - using mock data');
    return getMockProfile(companyNumber);
  }

  try {
    const response = await fetch(
      `${API_BASE}/company/${companyNumber}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Companies House API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Companies House profile fetch failed:', error);
    return null;
  }
}

/**
 * Enrich company data from Companies House
 * @param {string} companyName - Name to search for
 * @returns {Promise<Object>} Enriched company data
 */
export async function enrichCompany(companyName) {
  // Search for the company
  const searchResults = await searchCompanies(companyName);

  if (searchResults.length === 0) {
    return {
      found: false,
      companyName,
      message: 'No matching company found'
    };
  }

  // Get the first (best) match
  const match = searchResults[0];
  const profile = await getCompanyProfile(match.company_number);

  if (!profile) {
    return {
      found: true,
      companyName: match.title,
      companiesHouseId: match.company_number,
      address: match.address_snippet,
    };
  }

  // Map SIC codes to industry descriptions
  const sicCodes = profile.sic_codes || [];
  const industry = mapSicCodesToIndustry(sicCodes);

  // Determine company size from accounts if available
  const size = determineCompanySize(profile);

  return {
    found: true,
    companyName: profile.company_name,
    companiesHouseId: profile.company_number,
    industry,
    size,
    status: profile.company_status,
    incorporatedDate: profile.date_of_creation,
    address: profile.registered_office_address
      ? formatAddress(profile.registered_office_address)
      : null,
    website: null, // Not provided by Companies House API
    sicCodes,
  };
}

/**
 * Map SIC codes to human-readable industry
 */
function mapSicCodesToIndustry(sicCodes) {
  const sicMapping = {
    '62': 'Technology / Software',
    '63': 'Technology / Data Services',
    '64': 'Financial Services',
    '65': 'Insurance',
    '66': 'Financial Services',
    '70': 'Management Consultancy',
    '72': 'Scientific R&D',
    '73': 'Advertising / Marketing',
    '74': 'Professional Services',
    '82': 'Business Support Services',
  };

  for (const code of sicCodes) {
    const prefix = code.substring(0, 2);
    if (sicMapping[prefix]) {
      return sicMapping[prefix];
    }
  }

  return sicCodes.length > 0 ? `SIC: ${sicCodes[0]}` : 'Unknown';
}

/**
 * Determine company size from available data
 */
function determineCompanySize(profile) {
  // This is a simplified heuristic
  // In reality, would need accounts data
  if (profile.accounts?.accounting_reference_date) {
    // Has accounts - likely established
    return 'Established';
  }
  return 'Unknown';
}

/**
 * Format address object to string
 */
function formatAddress(addr) {
  const parts = [
    addr.address_line_1,
    addr.address_line_2,
    addr.locality,
    addr.region,
    addr.postal_code,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Mock search results for development without API key
 */
function getMockSearchResults(query) {
  return [
    {
      title: query.toUpperCase() + ' LTD',
      company_number: '12345678',
      address_snippet: 'London, United Kingdom',
      company_status: 'active',
    }
  ];
}

/**
 * Mock profile for development without API key
 */
function getMockProfile(companyNumber) {
  return {
    company_name: 'EXAMPLE COMPANY LTD',
    company_number: companyNumber,
    company_status: 'active',
    date_of_creation: '2020-01-01',
    sic_codes: ['62020'],
    registered_office_address: {
      address_line_1: '123 Example Street',
      locality: 'London',
      postal_code: 'EC1A 1BB',
    }
  };
}

export default {
  searchCompanies,
  getCompanyProfile,
  enrichCompany,
};
