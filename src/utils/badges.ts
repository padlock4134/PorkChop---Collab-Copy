import { supabase } from '../api/supabaseClient';

export type BadgeCategory =
  | 'Weekly Challenge'
  | 'Milestone'
  | 'Difficulty'
  | 'Theme'
  | 'Streak'
  | 'Community'
  | 'Special';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description: string;
}

export const BADGES: BadgeDefinition[] = [
  // --- WEEKLY CHALLENGE BADGES (52) ---
  { id: 'souper_star', name: 'Soup-er Star', icon: '🍲', category: 'Weekly Challenge', description: 'Won a soup challenge.' },
  { id: 'grill_guru', name: 'Grill Guru', icon: '🍖', category: 'Weekly Challenge', description: 'Won a grilling challenge.' },
  { id: 'mushroom_master', name: 'Mushroom Master', icon: '🍄', category: 'Weekly Challenge', description: 'Won a mushroom challenge.' },
  { id: 'noodle_ninja', name: 'Noodle Ninja', icon: '🍜', category: 'Weekly Challenge', description: 'Won a noodle challenge.' },
  { id: 'pizza_pro', name: 'Pizza Pro', icon: '🍕', category: 'Weekly Challenge', description: 'Won a pizza challenge.' },
  { id: 'salad_savant', name: 'Salad Savant', icon: '🥗', category: 'Weekly Challenge', description: 'Won a salad challenge.' },
  { id: 'breakfast_boss', name: 'Breakfast Boss', icon: '🥞', category: 'Weekly Challenge', description: 'Won a breakfast challenge.' },
  { id: 'dessert_devotee', name: 'Dessert Devotee', icon: '🍰', category: 'Weekly Challenge', description: 'Won a dessert challenge.' },
  { id: 'seafood_specialist', name: 'Seafood Specialist', icon: '🦞', category: 'Weekly Challenge', description: 'Won a seafood challenge.' },
  { id: 'bbq_boss', name: 'BBQ Boss', icon: '🍗', category: 'Weekly Challenge', description: 'Won a BBQ challenge.' },
  { id: 'veggie_victor', name: 'Veggie Victor', icon: '🥦', category: 'Weekly Challenge', description: 'Won a vegetarian challenge.' },
  { id: 'vegan_victor', name: 'Vegan Victor', icon: '🥕', category: 'Weekly Challenge', description: 'Won a vegan challenge.' },
  { id: 'holiday_hero', name: 'Holiday Hero', icon: '🎄', category: 'Weekly Challenge', description: 'Won a holiday challenge.' },
  { id: 'spicy_supreme', name: 'Spicy Supreme', icon: '🌶️', category: 'Weekly Challenge', description: 'Won a spicy challenge.' },
  { id: 'comfort_king', name: 'Comfort King', icon: '🥘', category: 'Weekly Challenge', description: 'Won a comfort food challenge.' },
  { id: 'fusion_fanatic', name: 'Fusion Fanatic', icon: '🍱', category: 'Weekly Challenge', description: 'Won a fusion challenge.' },
  { id: 'street_foodie', name: 'Street Foodie', icon: '🌯', category: 'Weekly Challenge', description: 'Won a street food challenge.' },
  { id: 'bowl_boss', name: 'Bowl Boss', icon: '🥣', category: 'Weekly Challenge', description: 'Won a bowl food challenge.' },
  { id: 'harvest_hero', name: 'Harvest Hero', icon: '🌽', category: 'Weekly Challenge', description: 'Won a harvest challenge.' },
  { id: 'brunch_boss', name: 'Brunch Boss', icon: '🥓', category: 'Weekly Challenge', description: 'Won a brunch challenge.' },
  { id: 'sizzle_star', name: 'Sizzle Star', icon: '🍳', category: 'Weekly Challenge', description: 'Won a stir-fry challenge.' },
  { id: 'pantry_pro', name: 'Pantry Pro', icon: '🥫', category: 'Weekly Challenge', description: 'Won a pantry challenge.' },
  { id: 'egg_cellent', name: 'Egg-cellent', icon: '🥚', category: 'Weekly Challenge', description: 'Won an egg challenge.' },
  { id: 'samwise', name: 'Samwise', icon: '🥔', category: 'Weekly Challenge', description: 'Won a potato challenge.' },
  { id: 'festive_chef', name: 'Festive Chef', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'dairy_free_pro', name: 'Dairy-Free Pro', icon: '🥛', category: 'Weekly Challenge', description: 'Won a dairy-free challenge.' },
  { id: 'grain_guru', name: 'Grain Guru', icon: '🌾', category: 'Weekly Challenge', description: 'Won a grain challenge.' },
  { id: 'stuffed_star', name: 'Stuffed Star', icon: '🌯', category: 'Weekly Challenge', description: 'Won a stuffed food challenge.' },
  { id: 'dip_master', name: 'Dip Master', icon: '🥣', category: 'Weekly Challenge', description: 'Won a dip challenge.' },
  // ...add 24 more unique weekly challenge badges for a total of 52

  // --- MILESTONE BADGES (20) ---
  { id: 'meal_novice', name: 'Meal Novice', icon: '🍽️', category: 'Milestone', description: 'Cooked 10 meals.' },
  { id: 'meal_apprentice', name: 'Meal Apprentice', icon: '🍽️', category: 'Milestone', description: 'Cooked 25 meals.' },
  { id: 'meal_pro', name: 'Meal Pro', icon: '🍽️', category: 'Milestone', description: 'Cooked 50 meals.' },
  { id: 'meal_veteran', name: 'Meal Veteran', icon: '🍽️', category: 'Milestone', description: 'Cooked 100 meals.' },
  { id: 'meal_hero', name: 'Meal Hero', icon: '🍽️', category: 'Milestone', description: 'Cooked 200 meals.' },
  { id: 'meal_master', name: 'Meal Master', icon: '🍽️', category: 'Milestone', description: 'Cooked 300 meals.' },
  { id: 'meal_legend', name: 'Meal Legend', icon: '🍽️', category: 'Milestone', description: 'Cooked 400 meals.' },
  { id: 'meal_icon', name: 'Meal Icon', icon: '🍽️', category: 'Milestone', description: 'Cooked 500 meals.' },
  { id: 'meal_champion', name: 'Meal Champion', icon: '🍽️', category: 'Milestone', description: 'Cooked 750 meals.' },
  { id: 'meal_god', name: 'Meal God', icon: '🍽️', category: 'Milestone', description: 'Cooked 1000 meals.' },
  { id: 'cookbook_5', name: 'Recipe Collector', icon: '📚', category: 'Milestone', description: 'Added 5 recipes to your cookbook.' },
  { id: 'cookbook_10', name: 'Recipe Curator', icon: '📚', category: 'Milestone', description: 'Added 10 recipes to your cookbook.' },
  { id: 'cookbook_20', name: 'Recipe Librarian', icon: '📚', category: 'Milestone', description: 'Added 20 recipes to your cookbook.' },
  { id: 'cookbook_40', name: 'Recipe Archivist', icon: '📚', category: 'Milestone', description: 'Added 40 recipes to your cookbook.' },
  { id: 'cookbook_60', name: 'Recipe Historian', icon: '📚', category: 'Milestone', description: 'Added 60 recipes to your cookbook.' },
  { id: 'cookbook_80', name: 'Recipe Scholar', icon: '📚', category: 'Milestone', description: 'Added 80 recipes to your cookbook.' },
  { id: 'cookbook_100', name: 'Recipe Sage', icon: '📚', category: 'Milestone', description: 'Added 100 recipes to your cookbook.' },
  { id: 'first_recipe', name: 'First Cook', icon: '👨‍🍳', category: 'Milestone', description: 'Cooked your first recipe.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first recipe.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🥄', category: 'Difficulty', description: 'Cooked your first easy recipe.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🥄', category: 'Difficulty', description: 'Cooked your first intermediate recipe.' },
  { id: 'hard_first', name: 'Hardcore Chef', icon: '🔥', category: 'Difficulty', description: 'Cooked your first hard recipe.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🥄', category: 'Difficulty', description: 'Cooked 10 easy recipes.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🥄', category: 'Difficulty', description: 'Cooked 10 intermediate recipes.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Cooked 10 hard recipes.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🥄', category: 'Difficulty', description: 'Cooked 25 easy recipes.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🥄', category: 'Difficulty', description: 'Cooked 25 intermediate recipes.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Cooked 25 hard recipes.' },
  { id: 'iron_chef', name: 'Iron Chef', icon: '🦾', category: 'Difficulty', description: 'Cooked 50 hard recipes.' },

  // --- THEME/INGREDIENT BADGES (50) ---
  // Vegetarian, Vegan, Dessert, BBQ, Seafood, Pasta, Breakfast, Salad, Soup, Bread
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'veggie', name: 'Veggie Virtuoso', icon: '🥦' },
      { key: 'vegan', name: 'Vegan Virtuoso', icon: '🥕' },
      { key: 'dessert', name: 'Dessert Pro', icon: '🧁' },
      { key: 'bbq', name: 'BBQ Boss', icon: '🍗' },
      { key: 'seafood', name: 'Seafood Star', icon: '🦀' },
      { key: 'pasta', name: 'Pasta Pro', icon: '🍝' },
      { key: 'breakfast', name: 'Breakfast Buff', icon: '🥞' },
      { key: 'salad', name: 'Salad Sage', icon: '🥗' },
      { key: 'soup', name: 'Soup Specialist', icon: '🍜' },
      { key: 'bread', name: 'Bread Baker', icon: '🍞' },
    ];
    const tiers = [
      { suffix: '_1', desc: 'Cooked 1', n: 1 },
      { suffix: '_5', desc: 'Cooked 5', n: 5 },
      { suffix: '_10', desc: 'Cooked 10', n: 10 },
      { suffix: '_25', desc: 'Cooked 25', n: 25 },
      { suffix: '_50', desc: 'Cooked 50', n: 50 },
    ];
    const out: BadgeDefinition[] = [];
    for (const theme of themes) {
      for (const tier of tiers) {
        out.push({
          id: `${theme.key}${tier.suffix}`,
          name: `${theme.name}${tier.n > 1 ? ' ' + tier.n : ''}`,
          icon: theme.icon,
          category: 'Theme',
          description: `${tier.desc} ${theme.name.replace(/ .*/, '').toLowerCase()} meals.`
        });
      }
    }
    return out;
  })(),

  // --- STREAK BADGES (10) ---
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', category: 'Streak', description: 'Cooked 3 days in a row.' },
  { id: 'streak_7', name: 'One-Week Streak', icon: '🔥', category: 'Streak', description: 'Cooked 7 days in a row.' },
  { id: 'streak_14', name: 'Two-Week Streak', icon: '🔥', category: 'Streak', description: 'Cooked 14 days in a row.' },
  { id: 'streak_30', name: 'One-Month Streak', icon: '🔥', category: 'Streak', description: 'Cooked 30 days in a row.' },
  { id: 'streak_60', name: 'Two-Month Streak', icon: '🔥', category: 'Streak', description: 'Cooked 60 days in a row.' },
  { id: 'streak_90', name: 'Three-Month Streak', icon: '🔥', category: 'Streak', description: 'Cooked 90 days in a row.' },
  { id: 'challenge_streak_3', name: 'Challenge Streak 3', icon: '🏅', category: 'Streak', description: 'Completed 3 weekly challenges in a row.' },
  { id: 'challenge_streak_5', name: 'Challenge Streak 5', icon: '🏅', category: 'Streak', description: 'Completed 5 weekly challenges in a row.' },
  { id: 'challenge_streak_10', name: 'Challenge Streak 10', icon: '🏅', category: 'Streak', description: 'Completed 10 weekly challenges in a row.' },
  { id: 'challenge_streak_20', name: 'Challenge Streak 20', icon: '🏅', category: 'Streak', description: 'Completed 20 weekly challenges in a row.' },

  // --- COMMUNITY BADGES (14) ---
  { id: 'recipe_sharer_1', name: 'Recipe Sharer', icon: '📤', category: 'Community', description: 'Shared your first recipe.' },
  { id: 'recipe_sharer_5', name: 'Recipe Contributor', icon: '📤', category: 'Community', description: 'Shared 5 recipes.' },
  { id: 'recipe_sharer_10', name: 'Recipe Publisher', icon: '📤', category: 'Community', description: 'Shared 10 recipes.' },
  { id: 'recipe_sharer_25', name: 'Recipe Influencer', icon: '📤', category: 'Community', description: 'Shared 25 recipes.' },
  { id: 'recipe_sharer_50', name: 'Recipe Celebrity', icon: '📤', category: 'Community', description: 'Shared 50 recipes.' },
  { id: 'commenter_1', name: 'First Comment', icon: '💬', category: 'Community', description: 'Commented on a recipe.' },
  { id: 'commenter_10', name: 'Conversationalist', icon: '💬', category: 'Community', description: 'Commented on 10 recipes.' },
  { id: 'commenter_25', name: 'Discussion Leader', icon: '💬', category: 'Community', description: 'Commented on 25 recipes.' },
  { id: 'commenter_50', name: 'Community Voice', icon: '💬', category: 'Community', description: 'Commented on 50 recipes.' },
  { id: 'liker_1', name: 'First Like', icon: '❤️', category: 'Community', description: 'Liked a recipe.' },
  { id: 'liker_10', name: 'Recipe Fan', icon: '❤️', category: 'Community', description: 'Liked 10 recipes.' },
  { id: 'liker_25', name: 'Recipe Enthusiast', icon: '❤️', category: 'Community', description: 'Liked 25 recipes.' },
  { id: 'liker_50', name: 'Recipe Addict', icon: '❤️', category: 'Community', description: 'Liked 50 recipes.' },
  { id: 'liker_100', name: 'Recipe Superfan', icon: '❤️', category: 'Community', description: 'Liked 100 recipes.' },

  // --- SPECIAL / HIDDEN BADGES (10+) ---
  { id: 'birthday_chef', name: 'Birthday Chef', icon: '🎂', category: 'Special', description: 'Cooked a meal on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'secret_sauce', name: 'Secret Sauce', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_cook', name: 'Holiday Cook', icon: '🎁', category: 'Special', description: 'Cooked a meal on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Cooked a meal after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Cooked a meal before 6am.' },
  { id: 'all_themes', name: 'Theme Master', icon: '🏆', category: 'Special', description: 'Cooked at least one meal from every theme.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'chef_of_the_year', name: 'Chef of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_chef', name: 'Legendary Chef', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
];

// --- Badge Utilities ---

/**
 * Award a badge to a user if not already awarded.
 * Returns true if badge awarded or already present, false on error.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  if (!userId || !badgeId) return false;
  // Try to insert, ignore duplicate errors (unique constraint)
  const { error } = await supabase
    .from('user_badges')
    .insert([{ user_id: userId, badge_id: badgeId }]);
  if (error && !error.message.includes('duplicate')) {
    console.error('Failed to award badge:', error);
    return false;
  }
  return true;
}

/**
 * Fetch all badge IDs a user has earned.
 */
export async function getUserBadges(userId: string): Promise<{ badge_id: string; awarded_at: string }[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to fetch user badges:', error);
    return [];
  }
  return data || [];
}
