import { supabase } from '../api/supabaseClient';
import { Ingredient } from '../types';

export async function saveKitchen(ingredients: Ingredient[]) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_kitchen')
    .upsert([{ user_id: user.id, ingredients }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchKitchen(): Promise<Ingredient[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('user_kitchen')
    .select('ingredients')
    .eq('user_id', user.id)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return data?.ingredients || [];
}
