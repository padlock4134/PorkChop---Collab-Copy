import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { Ingredient } from '../types/shared-types';

export async function saveKitchen(userId: string, ingredients: Ingredient[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_kitchen')
    .upsert([{ user_id: userId, ingredients }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchKitchen(userId: string): Promise<Ingredient[]> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('user_kitchen')
    .select('ingredients')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return data?.ingredients || [];
}
