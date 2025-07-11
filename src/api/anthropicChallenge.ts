// Anthropic (Haiku) API integration for Weekly Challenge
// Requires VITE_ANTHROPIC_CHALLENGE_KEY in .env

export async function getWeeklyChallengeRecipe(prompt: string): Promise<{ title: string; ingredients: string[]; instructions: string; equipment?: string[]; }> {
  // System prompt to instruct the AI to return JSON
  const systemPrompt = "You are an AI assistant. Given a user's request for a weekly challenge recipe, provide the recipe details as a single JSON object. The JSON object should have the following fields: 'title' (string), 'ingredients' (array of strings), 'instructions' (string), and optionally 'equipment' (array of strings). Do not include any other text, explanations, or markdown formatting (like ```json) outside of this JSON object. Ensure the JSON is valid.";
  const userPromptContent = prompt; // User's actual query

  const response = await fetch('/.netlify/functions/anthropic-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'challenge',
      model: 'claude-3-haiku-20240307', // Using a model compatible with Messages API
      system: systemPrompt,
      messages: [{ role: 'user', content: userPromptContent }],
      max_tokens: 1024, // Increased tokens for JSON output
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error in getWeeklyChallengeRecipe:', errorText);
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  try {
    // Anthropic Messages API returns content in data.content[0].text
    if (data.content && data.content[0] && data.content[0].text) {
      const recipeJsonString = data.content[0].text;
      const recipeData = JSON.parse(recipeJsonString);
      return {
        title: recipeData.title || 'Weekly Challenge Recipe (parsed)',
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || '',
        equipment: recipeData.equipment || [],
      };
    } else {
      console.warn('Unexpected Anthropic response structure in getWeeklyChallengeRecipe:', data);
      throw new Error('Unexpected response structure from AI.');
    }
  } catch (e) {
    console.error('Failed to parse JSON recipe from Anthropic response in getWeeklyChallengeRecipe:', e, data.content?.[0]?.text);
    throw new Error(`Failed to parse recipe from AI: ${e.message}`);
  }
}
