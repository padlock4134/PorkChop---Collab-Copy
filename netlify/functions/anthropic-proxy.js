const fetch = require('node-fetch');

const API_KEYS = {
  recipe: process.env.ANTHROPIC_RECIPE_KEY,
  challenge: process.env.ANTHROPIC_CHALLENGE_KEY,
  chef: process.env.ANTHROPIC_CHEF_KEY
};

// Log which API keys are configured (safely)
console.log('API Keys configured:', Object.keys(API_KEYS).reduce((acc, key) => {
  acc[key] = !!API_KEYS[key];
  return acc;
}, {}));

exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      console.error('JSON parse error:', e);
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const apiKeyIdentifier = requestBody.apiKeyIdentifier;
    console.log(`Request from ${apiKeyIdentifier} endpoint`);
    
    // Remove the identifier from the body before forwarding to Anthropic
    delete requestBody.apiKeyIdentifier;

    // Get the appropriate API key
    const apiKey = API_KEYS[apiKeyIdentifier];

    // Check if we have a valid API key
    if (!apiKey) {
      console.error(`Missing API key for ${apiKeyIdentifier}`);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: `API key not configured for: ${apiKeyIdentifier}`
        })
      };
    }

    console.log(`Making ${apiKeyIdentifier} request to Anthropic...`);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': event.headers['anthropic-version'] || '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error for ${apiKeyIdentifier}:`, errorText);
      return {
        statusCode: response.status,
        body: errorText
      };
    }

    const data = await response.json();
    console.log('Successful response from Anthropic');
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Error proxying to Anthropic:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
