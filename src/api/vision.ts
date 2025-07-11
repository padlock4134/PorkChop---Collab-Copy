// Google Vision API integration for PorkChop
// Uses secure server-side proxy

export async function scanImage(base64Image: string): Promise<string[]> {
  try {
    const response = await fetch('/.netlify/functions/vision-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to process image');
    }

    const { results } = await response.json();
    return results || [];
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
}
