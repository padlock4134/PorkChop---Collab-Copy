const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Function triggered with event:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
    headers: event.headers
  });

  if (!event.queryStringParameters?.lat || !event.queryStringParameters?.lng) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required coordinates' })
    };
  }

  const { lat, lng, radius = 24140, type = 'supermarket,convenience_store,bakery' } = event.queryStringParameters;
  const apiKey = process.env.VITE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('Missing Places API Key');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error - Missing API Key' })
    };
  }

  console.log('Using API key:', apiKey.substring(0, 5) + '...');

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const searchBody = {
    includedTypes: type.split(','),
    locationRestriction: {
      circle: {
        center: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        radius: parseFloat(radius)
      }
    }
  };

  console.log('Request to Google Places:', {
    url,
    method: 'POST',
    body: searchBody
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.id,places.websiteUri'
      },
      body: JSON.stringify(searchBody)
    });

    const rawResponse = await response.text();
    console.log('Raw Google API response:', rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      console.error('Failed to parse Google API response:', e);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Invalid response from Google Places API',
          rawResponse
        })
      };
    }

    console.log('Parsed Google API response:', {
      status: response.status,
      statusText: response.statusText,
      hasResults: !!data.places,
      resultCount: data.places ? data.places.length : 0,
      error: data.error
    });

    if (!response.ok) {
      console.error('Places API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Places API error', 
          details: data,
          request: searchBody
        })
      };
    }

    const transformedData = {
      status: 'OK',
      results: (data.places || []).map(place => ({
        place_id: place.id,
        name: place.displayName?.text || '',
        vicinity: place.formattedAddress || '',
        types: place.types || [],
        website: place.websiteUri || null
      }))
    };

    return {
      statusCode: 200,
      body: JSON.stringify(transformedData),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    };
  } catch (error) {
    console.error('Places fetch error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch places', 
        details: error.message,
        request: searchBody
      })
    };
  }
};
