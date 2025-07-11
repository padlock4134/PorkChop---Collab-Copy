// YouTube Data API integration for PorkChop tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_ingredient', 'equipment', or 'recipe'
function buildVideoQuery(recipeTitle: string, item: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Recipe Name with Equipment'
    return `${recipeTitle} with a ${item}`;
  }
  if (type === 'main_ingredient') {
    // Main ingredient prep: 'Main Ingredient for Recipe Name'
    return `${item} for ${recipeTitle}`;
  }
  // Default: 'Recipe Name' (possibly with other context)
  return `${recipeTitle}${item ? ' ' + item : ''}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, recipeTitle?: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): Promise<string | null> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key missing');
  const searchQuery = recipeTitle ? buildVideoQuery(recipeTitle, query, type) : query;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('YouTube API error');
  const data = await res.json();
  const relevant = data.items?.find((r: any) => isRelevantYouTubeResult(r, query));
  return relevant ? `https://www.youtube.com/watch?v=${relevant.id.videoId}` : null;
}
