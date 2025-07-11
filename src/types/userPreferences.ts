export type ExperienceLevel = 'new_to_cooking' | 'home_cook' | 'kitchen_confident';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  // Add other preferences here in the future
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_cooking';
