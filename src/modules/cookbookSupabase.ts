import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RecipeCard } from '../components/RecipeMatcherModal';

export async function saveCookbook(userId: string, recipes: RecipeCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId,
      recipes: recipes // Stored as JSONB in Supabase
    }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchCookbook(userId: string): Promise<RecipeCard[]> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return (data?.recipes || []) as RecipeCard[];
}

export async function addRecipeToCookbook(userId: string, recipe: RecipeCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing recipes
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  // Add new recipe if not already present
  const existingRecipes = (data?.recipes || []) as RecipeCard[];
  if (!existingRecipes.some(r => r.id === recipe.id)) {
    const { error } = await supabase
      .from('user_cookbook')
      .upsert([{ 
        user_id: userId, 
        recipes: [...existingRecipes, recipe] // Stored as JSONB in Supabase
      }], { onConflict: 'user_id' });
    if (error) throw error;
  }
}

export async function removeRecipeFromCookbook(userId: string, recipeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  const existingRecipes = (data?.recipes || []) as RecipeCard[];
  const updatedRecipes = existingRecipes.filter(r => r.id !== recipeId);
  
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId, 
      recipes: updatedRecipes
    }], { onConflict: 'user_id' });
  if (error) throw error;
}
