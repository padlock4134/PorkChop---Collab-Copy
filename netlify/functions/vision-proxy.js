const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { base64Image } = JSON.parse(event.body);
    
    if (!base64Image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing image data' })
      };
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const body = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION', maxResults: 10 }
        ]
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Vision API error: ${error}` })
      };
    }

    const data = await response.json();
    // Text detection
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
    const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Label detection
    const labels = data?.responses?.[0]?.labelAnnotations?.map(l => l.description) || [];
    // Combine and deduplicate
    const results = Array.from(new Set([...textLines, ...labels]));

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
