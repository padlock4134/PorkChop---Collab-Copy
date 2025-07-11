// Helper to get the current signed-in user's ID from Supabase
import { supabase } from './supabaseClient';

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}
