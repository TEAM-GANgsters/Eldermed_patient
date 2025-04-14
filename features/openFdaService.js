const axios = require('axios');

const OPENFDA_API_BASE = 'https://api.fda.gov';

// OpenFDA often doesn't require an API key for basic use,
// but check their documentation if you need higher rate limits.
// const API_KEY = process.env.OPENFDA_API_KEY; // Uncomment if you get a key

/**
 * Searches the OpenFDA drug label endpoint for a given drug name.
 * @param {string} drugName - The name of the drug to search for.
 * @returns {Promise<object|null>} - A promise that resolves with the first matching drug result or null if not found/error.
 */
exports.findDrugByName = async (drugName) => {
    if (!drugName || typeof drugName !== 'string') {
        return null;
    }

    // Construct the query URL
    // Search in brand_name and generic_name fields. Limit to 1 result for simple validation.
    // Using exact match for simplicity here, might need fuzzy matching for real use cases.
    const query = `(openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}")`;
    const url = `${OPENFDA_API_BASE}/drug/label.json?search=${encodeURIComponent(query)}&limit=1`;

    // Add API key if available
    // if (API_KEY) {
    //     url += `&api_key=${API_KEY}`;
    // }

    console.log(`Querying OpenFDA for drug: ${drugName}`);
    console.log(`OpenFDA URL: ${url}`);

    try {
        const response = await axios.get(url);

        if (response.status === 200 && response.data.results && response.data.results.length > 0) {
            console.log(`Found match for ${drugName} in OpenFDA.`);
            // Return the first result - contains label info, openfda section with identifiers
            const result = response.data.results[0];
            const openfdaData = result.openfda || {};
            return {
                found: true,
                nameUsed: drugName,
                brandNames: openfdaData.brand_name || [],
                genericNames: openfdaData.generic_name || [],
                manufacturerNames: openfdaData.manufacturer_name || [],
                ndc: openfdaData.ndc || [], // National Drug Code
                splId: openfdaData.spl_id || [], // Structured Product Labeling ID
                // Add other relevant fields from the result if needed
            };
        } else {
            console.log(`No exact match found for ${drugName} in OpenFDA.`);
            return {
                found: false,
                nameUsed: drugName
            };
        }
    } catch (error) {
        // Handle potential 404 Not Found specifically
        if (error.response && error.response.status === 404) {
             console.log(`No results found (404) for ${drugName} in OpenFDA.`);
             return {
                found: false,
                nameUsed: drugName
            };
        }
        // Log other errors
        console.error(`Error querying OpenFDA for ${drugName}:`, error.message);
        // Depending on policy, might want to return null or a specific error object
        return null; // Indicates an error occurred during lookup
    }
}; 