import { RecipeCard } from '../components/RecipeMatcherModal';
import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { getCurrentUserId } from './userSession';

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

const RECIPE_PROMPTS = {
  new_to_cooking: (numRecipes: number, ingredients: string[]) => 
    `You are a patient cooking teacher. Create ${numRecipes} super simple recipes for a beginner cook using ingredients from: ${ingredients.join(", ")}. 
    RULES:
    1. Use only 2-3 ingredients per recipe
    2. Only basic cooking methods (pan fry, boil, mix)
    3. Very detailed step-by-step instructions
    4. Keep cook time under 20 minutes
    5. Include necessary equipment for each recipe`,

  home_cook: (numRecipes: number, ingredients: string[]) => 
    `You are a helpful home cooking expert. Create ${numRecipes} recipes for someone comfortable with basic cooking using ingredients from: ${ingredients.join(", ")}.
    RULES:
    1. Use 3-4 ingredients per recipe
    2. Standard cooking methods
    3. Clear instructions
    4. Keep cook time under 30 minutes
    5. Include necessary equipment for each recipe`,

  kitchen_confident: (numRecipes: number, ingredients: string[]) => 
    `You are a professional chef. Create ${numRecipes} interesting recipes for an experienced home cook using ingredients from: ${ingredients.join(", ")}.
    RULES:
    1. Use 4+ ingredients per recipe
    2. Can include advanced techniques
    3. Professional-style instructions
    4. Focus on flavor and technique
    5. Include necessary equipment for each recipe`
};

async function getUserProfile() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('dietary, cuisine')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }

  return data;
}

export async function fetchRecipesWithImages(ingredients: string[], numRecipes = 5): Promise<RecipeCard[]> {
  // 1. Get user preferences
  const [{ experienceLevel }, profile] = await Promise.all([
    getUserPreferences(),
    getUserProfile()
  ]);

  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  // 2. Build the Anthropic prompt
  const basePrompt = promptTemplate(numRecipes, ingredients);
  
  // Add dietary and cuisine preferences if available
  const dietaryPrefs = profile?.dietary || [];
  const cuisinePrefs = profile?.cuisine || [];
  
  const prompt = `${basePrompt}

${dietaryPrefs.length ? `IMPORTANT: All recipes MUST follow these dietary restrictions: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length ? `PREFERRED CUISINES: Try to incorporate these cuisine styles when possible: ${cuisinePrefs.join(', ')}` : ''}

Format your response as a JSON array of recipe objects. Each recipe object MUST have these exact fields:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...]
}

For equipment, list all necessary kitchen tools and appliances needed to prepare the recipe (e.g., "frying pan", "mixing bowl", "oven", "blender").
Return ONLY the JSON array, no other text.`;

  // 3. Call Anthropic API
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'recipe',
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500, // Increased to handle equipment field
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return generateFallbackRecipes(ingredients, numRecipes);
  }

  let recipes;
  try {
    const content = anthropicData.content[0].text;
    
    // Extract JSON array using regex in case there's additional text
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/); 
    if (jsonMatch) {
      recipes = JSON.parse(jsonMatch[0]);
    } else {
      recipes = JSON.parse(content);
    }
    
    if (!Array.isArray(recipes)) throw new Error('Response not an array');
  } catch (err) {
    console.error('Failed to parse recipes:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    return generateFallbackRecipes(ingredients, numRecipes);
  }

  // 4. Fetch images for each recipe
  const imagePromises = recipes.slice(0, numRecipes).map(async (recipe: any) => {
    try {
      const res = await fetch(`${UNSPLASH_API_URL}?query=${encodeURIComponent(recipe.title)}&client_id=${unsplashKey}`);
      const data = await res.json();
      return data.results?.[0]?.urls?.small || '';
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return '';
    }
  });

  const images = await Promise.all(imagePromises);

  // 5. Return recipe cards
  return recipes.slice(0, numRecipes).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}

export async function generateFallbackRecipes(ingredients: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences();
  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, ingredients)}

Format your response as a JSON array of recipe objects. Each recipe object MUST have these exact fields:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...]
}

For equipment, list all necessary kitchen tools and appliances needed to prepare the recipe (e.g., "frying pan", "mixing bowl", "oven", "blender").
Return ONLY the JSON array, no other text.`;

  // 2. Call Anthropic API
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'recipe',
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', {
      status: anthropicRes.status,
      statusText: anthropicRes.statusText,
      body: await anthropicRes.text()
    });
    throw new Error(`Anthropic API error: ${anthropicRes.status} ${anthropicRes.statusText}`);
  }

  const anthropicData = await anthropicRes.json();
  
  // Try to extract JSON from Claude's response
  let recipes: any[] = [];
  try {
    if (!anthropicData.content?.[0]?.text) {
      console.error('Invalid Anthropic response format:', anthropicData);
      throw new Error('Invalid response format from Anthropic API');
    }
    const responseText = anthropicData.content[0].text;
    console.log('Raw Anthropic response:', responseText);
    
    // More robust JSON extraction
    const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      recipes = JSON.parse(match[0]);
      console.log('Parsed recipes:', recipes);
    } else {
      console.error('No JSON array found in response:', responseText);
      throw new Error('No recipe data found in API response');
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    throw new Error('Failed to parse recipe data from API response');
  }

  // Validate recipe format
  recipes = Array.isArray(recipes) ? recipes : [];
  const validRecipes = recipes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions);
    if (!isValid) {
      console.warn('Invalid recipe format:', r);
    }
    return isValid;
  });

  if (validRecipes.length === 0) {
    console.error('No valid recipes found in response');
    throw new Error('No valid recipes found in API response');
  }

  // 3. For each recipe, call Unsplash in parallel
  const imagePromises = validRecipes.map(async (r) => {
    const q = encodeURIComponent(r.title || r.ingredients?.[0] || 'meal');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RecipeCards
  return validRecipes.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
