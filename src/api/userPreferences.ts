import { supabase } from './supabaseClient';
import { ExperienceLevel, UserPreferences, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getCurrentUserId } from './userSession';

export async function getUserPreferences(): Promise<UserPreferences> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { experienceLevel: DEFAULT_EXPERIENCE_LEVEL };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('experience_level')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user preferences:', error);
    return { experienceLevel: DEFAULT_EXPERIENCE_LEVEL };
  }

  return {
    experienceLevel: (data.experience_level as ExperienceLevel) || DEFAULT_EXPERIENCE_LEVEL
  };
}

export async function updateExperienceLevel(level: ExperienceLevel): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('No user logged in');
    return;
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      experience_level: level,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to update experience level:', error);
    throw error;
  }
}
