// Utility to search for tutorial videos using YouTube API
// Add your API key to .env

export interface TutorialVideoResult {
  title: string;
  url: string; // embed URL
  source: 'youtube' | 'manual' | 'none';
  thumbnail?: string;
}

// YouTube Search
interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string;
}

// Add this to make TypeScript recognize import.meta.env
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export async function searchYouTube(query: string): Promise<TutorialVideoResult | null> {
  const apiKey = (import.meta.env as ImportMetaEnv).VITE_YOUTUBE_API_KEY;
  const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!data.items || !data.items.length) return null;
    // Optionally: filter by view count, channel, etc.
    // TODO: Implement production video search logic.
    const video = data.items[0];
    return {
      title: video.snippet.title,
      url: `https://www.youtube.com/embed/${video.id.videoId}`,
      source: 'youtube',
      thumbnail: video.snippet.thumbnails?.high?.url
    };
  } catch (e) {
    return null;
  }
}


// Main function to get tutorial video
export async function getTutorialVideo(query: string): Promise<TutorialVideoResult> {
  const result = await searchYouTube(query);
  if (result) return result;

  return {
    title: 'No tutorial video found',
    url: '',
    source: 'none'
  };
}
