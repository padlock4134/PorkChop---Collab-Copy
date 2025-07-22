
A cross-platform cooking app with a 1950s Maine Fish Market theme. Scan your pantry, match recipes, save and edit favorites, connect with chefs, and learn culinary skills—all in one place.

## Features
- **My Kitchen:** Scan ingredients (Google Vision), digital cupboard, recipe matcher (Anthropic Haiku)
- **My Cook Book:** Save, edit, and organize recipes
- **Chefs Corner:** Social hub for chefs/home cooks
- **Culinary School:** Tutorials and guides
- **Chef Freddie:** Contextual AI chef assistant

## Tech Stack
- React + TypeScript + Vite
- TailwindCSS
- Stripe (payments)
- Supabase (backend/auth)
- Google Vision API (ingredient scanning)
- Anthropic Haiku (AI)
- Unsplash (recipe images)

## Setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Ensure you have the Netlify CLI installed: `npm install -g netlify-cli`
4. Run `npm install`
5. Run `netlify dev`

The React app runs on [http://localhost:3000](http://localhost:3000) (with hot reload), and all user interactions should happen here.

The Netlify functions dev server runs on [http://localhost:8888](http://localhost:8888). Behind the scenes, Vite is configured to proxy all requests to `/.netlify/functions` to the dev server URL.

## Environment Variables
See `.env.example` for required keys.

## License
MIT
