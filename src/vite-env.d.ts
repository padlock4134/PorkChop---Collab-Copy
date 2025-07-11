/// <reference types="vite/client" />

// This file ensures proper typing for import.meta.env in Vite projects.
// You can add custom env variables to the ImportMetaEnv interface below if needed.

interface ImportMetaEnv {
  readonly VITE_GOOGLE_VISION_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // add more custom env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

