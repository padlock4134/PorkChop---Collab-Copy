import React, { useState, useEffect } from 'react';
import { useLevelProgressContext } from './NavBar';
import WeeklyChallengeRecipeModal from './WeeklyChallengeRecipeModal';
import type { RecipeCard } from './RecipeMatcherModal';
import { getWeeklyChallengeRecipe } from '../api/anthropicChallenge';
import { getRecipeImage } from '../api/unsplash';
import { supabase } from '../api/supabaseClient';
import { getCurrentUserId } from '../api/userSession';

// Pool of weekly challenges
export const WEEKLY_CHALLENGES = [
  {
    title: 'PO TA TOES!',
    description: 'Cook any potato dish to earn bonus XP and the Samwise Badge.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('potato'),
    reward: { xp: 100, badge: 'Samwise' },
  },
  {
    title: 'Lobster Fest',
    description: 'Prepare a lobster dish for a chance at the Lobster Legend badge.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('lobster'),
    reward: { xp: 150, badge: 'Lobster Legend' },
  },
  {
    title: 'Veggie Virtuoso',
    description: 'Log three different vegetable-based recipes this week.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['carrot','broccoli','spinach','zucchini'].includes(i)),
    reward: { xp: 120, badge: 'Veggie Virtuoso' },
  },
  {
    title: 'Baker’s Dozen',
    description: 'Bake any bread or pastry for bonus XP.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['flour','yeast','sugar'].includes(i)),
    reward: { xp: 90, badge: 'Baker' },
  },
  {
    title: 'Global Grains',
    description: 'Cook a dish featuring rice, quinoa, or couscous.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['rice','quinoa','couscous'].includes(i)),
    reward: { xp: 80, badge: 'Grain Guru' },
  },
  {
    title: 'Taco Tuesday',
    description: 'Make any kind of taco or wrap.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('tortilla'),
    reward: { xp: 60, badge: 'Taco Titan' },
  },
  {
    title: 'Soup-er Star',
    description: 'Cook a soup or stew.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['broth','stock','soup'].includes(i)),
    reward: { xp: 75, badge: 'Soup-er Star' },
  },
  {
    title: 'Breakfast Bonanza',
    description: 'Prepare a breakfast dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['egg','bacon','pancake','oatmeal'].includes(i)),
    reward: { xp: 50, badge: 'Breakfast Boss' },
  },
  {
    title: 'Pasta Perfection',
    description: 'Make a pasta dish from scratch or with boxed pasta.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['pasta','spaghetti','noodle'].includes(i)),
    reward: { xp: 80, badge: 'Pasta Pro' },
  },
  {
    title: 'Fish Frenzy',
    description: 'Cook any seafood dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['fish','shrimp','crab','salmon','tuna'].includes(i)),
    reward: { xp: 110, badge: 'Seafood Star' },
  },
  {
    title: 'Salad Days',
    description: 'Create a fresh salad.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('lettuce') || recipe.ingredients.includes('salad'),
    reward: { xp: 60, badge: 'Salad Savant' },
  },
  {
    title: 'One-Pot Wonder',
    description: 'Make a one-pot meal.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['pot','casserole','stew'].includes(i)),
    reward: { xp: 85, badge: 'One-Pot Wonder' },
  },
  {
    title: 'Fermentation Nation',
    description: 'Use a fermented ingredient (yogurt, kimchi, miso, etc.).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['yogurt','kimchi','miso','sauerkraut','tempeh'].includes(i)),
    reward: { xp: 100, badge: 'Fermentation Fan' },
  },
  {
    title: 'Street Food Safari',
    description: 'Recreate a street food classic from any country.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['falafel','taco','gyro','hot dog','samosa'].includes(i)),
    reward: { xp: 90, badge: 'Street Foodie' },
  },
  {
    title: 'Pizza Party',
    description: 'Make a homemade pizza.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('pizza'),
    reward: { xp: 70, badge: 'Pizza Pro' },
  },
  {
    title: 'Egg-cellent Adventure',
    description: 'Cook a dish where eggs are the star.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('egg'),
    reward: { xp: 60, badge: 'Egg Master' },
  },
  {
    title: 'Spice It Up',
    description: 'Use at least three different spices in one dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.filter(i => ['cumin','paprika','turmeric','coriander','chili','cinnamon','nutmeg'].includes(i)).length >= 3,
    reward: { xp: 80, badge: 'Spice Savant' },
  },
  {
    title: 'Sheet Pan Supper',
    description: 'Make a complete meal on a sheet pan.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('sheet pan'),
    reward: { xp: 70, badge: 'Sheet Pan Chef' },
  },
  {
    title: 'Comfort Food Classic',
    description: 'Cook your favorite comfort food.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['macaroni','potato','chicken','cheese'].includes(i)),
    reward: { xp: 90, badge: 'Comfort King' },
  },
  {
    title: 'Grill Master',
    description: 'Grill any protein or veggie.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['grilled','bbq','barbecue'].includes(i)),
    reward: { xp: 110, badge: 'Grill Master' },
  },
  {
    title: 'Takeout Fakeout',
    description: 'Recreate your favorite takeout meal at home.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['fried rice','orange chicken','pad thai','pizza','burger'].includes(i)),
    reward: { xp: 100, badge: 'Takeout Star' },
  },
  {
    title: 'Dumpling Day',
    description: 'Make any kind of dumpling.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['dumpling','gyoza','pierogi','wonton'].includes(i)),
    reward: { xp: 80, badge: 'Dumpling Dynamo' },
  },
  {
    title: 'Wrap It Up',
    description: 'Prepare a wrap, burrito, or roll.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['wrap','burrito','roll'].includes(i)),
    reward: { xp: 70, badge: 'Wrap Wizard' },
  },
  {
    title: 'Dessert First',
    description: 'Bake or make a dessert.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['sugar','chocolate','cake','cookie','ice cream'].includes(i)),
    reward: { xp: 90, badge: 'Sweet Tooth' },
  },
  {
    title: 'Noodle Nirvana',
    description: 'Cook any noodle dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['noodle','ramen','udon','spaghetti'].includes(i)),
    reward: { xp: 80, badge: 'Noodle Ninja' },
  },
  {
    title: 'Farmers Market Find',
    description: 'Cook with a fresh, local, or seasonal ingredient.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['asparagus','corn','tomato','zucchini','peach'].includes(i)),
    reward: { xp: 75, badge: 'Market Maven' },
  },
  {
    title: 'Sandwich Showdown',
    description: 'Make a creative sandwich.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('bread'),
    reward: { xp: 60, badge: 'Sandwich Star' },
  },
  {
    title: 'Holiday Feast',
    description: 'Prepare a dish inspired by any holiday.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['turkey','ham','stuffing','cranberry','latke','eggnog'].includes(i)),
    reward: { xp: 100, badge: 'Festive Chef' },
  },
  {
    title: 'Bowl Food',
    description: 'Create a meal served in a bowl (poke, smoothie, grain bowl, etc.).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['bowl','poke','smoothie','rice'].includes(i)),
    reward: { xp: 70, badge: 'Bowl Boss' },
  },
  {
    title: 'Brunch Bash',
    description: 'Prepare a brunch dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['egg','waffle','bacon','mimosa'].includes(i)),
    reward: { xp: 80, badge: 'Brunch Boss' },
  },
  {
    title: 'Skillet Skills',
    description: 'Cook a meal using only a skillet or frying pan.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['skillet','pan','fry'].includes(i)),
    reward: { xp: 75, badge: 'Skillet Star' },
  },
  {
    title: 'Dairy-Free Delight',
    description: 'Make a dairy-free dish.',
    criteria: (recipe: { ingredients: string[] }) => !recipe.ingredients.some(i => ['milk','cheese','butter','cream','yogurt'].includes(i)),
    reward: { xp: 80, badge: 'Dairy-Free Pro' },
  },
  {
    title: 'Vegan Victory',
    description: 'Prepare a vegan meal.',
    criteria: (recipe: { ingredients: string[] }) => !recipe.ingredients.some(i => ['egg','milk','cheese','butter','meat','fish'].includes(i)),
    reward: { xp: 90, badge: 'Vegan Victory' },
  },
  {
    title: 'Gluten-Free Greatness',
    description: 'Cook a gluten-free recipe.',
    criteria: (recipe: { ingredients: string[] }) => !recipe.ingredients.some(i => ['wheat','flour','barley','rye','pasta','bread'].includes(i)),
    reward: { xp: 80, badge: 'Gluten-Free Guru' },
  },
  {
    title: 'Stuffed Sensation',
    description: 'Make a stuffed dish (peppers, dumplings, etc.).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['stuffed','dumpling','pepper','roll'].includes(i)),
    reward: { xp: 85, badge: 'Stuffed Star' },
  },
  {
    title: 'Sizzle & Stir-Fry',
    description: 'Make a stir-fry dish.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('stir-fry'),
    reward: { xp: 70, badge: 'Stir-Fry Star' },
  },
  {
    title: 'Hearty Harvest',
    description: 'Cook with a root vegetable (carrot, beet, turnip, etc.).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['carrot','beet','turnip','parsnip'].includes(i)),
    reward: { xp: 80, badge: 'Harvest Hero' },
  },
  {
    title: 'Mushroom Mania',
    description: 'Cook a dish featuring mushrooms.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('mushroom'),
    reward: { xp: 75, badge: 'Mushroom Master' },
  },
  {
    title: 'Chili Challenge',
    description: 'Make a chili or spicy stew.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['chili','pepper','jalapeno','spicy'].includes(i)),
    reward: { xp: 90, badge: 'Chili Champ' },
  },
  {
    title: 'Appetizer Artist',
    description: 'Prepare an appetizer or small plate.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['appetizer','dip','spread','starter'].includes(i)),
    reward: { xp: 60, badge: 'Appetizer Ace' },
  },
  {
    title: 'Fruit Frenzy',
    description: 'Make a dish featuring fresh fruit.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['apple','banana','berry','peach','plum','grape'].includes(i)),
    reward: { xp: 70, badge: 'Fruit Fanatic' },
  },
  {
    title: 'DIY Dips',
    description: 'Make a homemade dip or spread.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['hummus','guacamole','salsa','dip','spread'].includes(i)),
    reward: { xp: 60, badge: 'Dip Master' },
  },
  {
    title: 'Pantry Raid',
    description: 'Create a meal using only pantry staples.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['beans','rice','pasta','canned','flour'].includes(i)),
    reward: { xp: 70, badge: 'Pantry Pro' },
  },
  {
    title: 'Holiday Cookies',
    description: 'Bake a batch of cookies for any holiday.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.includes('cookie'),
    reward: { xp: 60, badge: 'Cookie Champ' },
  },
  {
    title: 'Bento Box Bonanza',
    description: 'Prepare a bento box or lunchbox meal.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['bento','rice','egg','seaweed'].includes(i)),
    reward: { xp: 80, badge: 'Bento Boss' },
  },
  {
    title: 'Retro Revival',
    description: 'Cook a dish inspired by the 1950s-80s.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['jello','meatloaf','fondue','casserole'].includes(i)),
    reward: { xp: 90, badge: 'Retro Chef' },
  },
  {
    title: 'Minimalist Meal',
    description: 'Make a dish using only five ingredients.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length <= 5,
    reward: { xp: 80, badge: 'Minimalist Chef' },
  },
];

// Helper to get the current week number (ISO week)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
}

// Get the current weekly challenge based on the current week number
function getCurrentWeeklyChallenge() {
  const now = new Date();
  const week = getWeekNumber(now);
  return WEEKLY_CHALLENGES[week % WEEKLY_CHALLENGES.length];
}

const ChallengeOfTheWeek: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));
  const [challenge, setChallenge] = useState(getCurrentWeeklyChallenge());
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const { refreshXP } = useLevelProgressContext();

  // Fetch claim status for this user/week
  async function fetchClaimStatus() {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { data } = await supabase
      .from('weekly_challenge_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .maybeSingle();
    setAlreadyClaimed(!!data);
  }

  useEffect(() => {
    fetchClaimStatus();
  }, [weekNumber]);

  useEffect(() => {
    const fetchRecipeAndImage = async () => {
      try {
        const challenge = getCurrentWeeklyChallenge();
        const prompt = `${challenge.title}: ${challenge.description}`;
        const recipeData = await getWeeklyChallengeRecipe(prompt);
        const image = await getRecipeImage(recipeData.title || challenge.title, recipeData.title || challenge.title, 'recipe');
        const recipe: RecipeCard = {
          id: `weekly-${challenge.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: recipeData.title || challenge.title,
          image,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || '',
          equipment: recipeData.equipment || [],
        };
        setModalRecipe(recipe);
      } catch (e: any) {
        setError(e.message || 'Failed to generate recipe');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeAndImage();
  }, [weekNumber]);

  function handleCookMe() {
    setRecipeModalOpen(true);
    setOpen(false);
  }

  return (
    <>
      {!alreadyClaimed ? (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 shadow text-2xl cursor-pointer transition-colors"
          title={"Challenge of the Week: " + challenge.title}
          aria-label={"Challenge of the Week: " + challenge.title}
          onClick={() => setOpen(true)}
          style={{ outline: 'none', border: 'none' }}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      ) : (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 cursor-not-allowed text-2xl"
          title="You've already claimed this week's challenge!"
          aria-label="Challenge already claimed"
          disabled
          style={{ outline: 'none', border: 'none' }}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative z-50 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-3xl mb-2">🏆</span>
            <span className="font-bold text-xl text-yellow-800 mb-1">{challenge.title}</span>
            <span className="text-gray-800 mb-2 text-center">{challenge.description}</span>
            <span className="text-sm text-gray-500">Reward: <b>{challenge.reward.xp} XP</b> and <b>{challenge.reward.badge}</b> badge</span>
            <button
              className="mt-4 px-4 py-2 rounded bg-maineBlue hover:bg-seafoam text-seafoam hover:text-maineBlue font-bold shadow w-full"
              onClick={handleCookMe}
              disabled={loading}
            >
              {loading ? 'Generating Recipe...' : 'Cook Me'}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <button
              className="mt-2 px-4 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold shadow w-full"
              onClick={() => setOpen(false)}
            >Close</button>
          </div>
        </div>
      )}
      <WeeklyChallengeRecipeModal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        recipe={modalRecipe}
        loading={loading}
        error={error}
        challengeId={modalRecipe?.id || ''}
        weekNumber={getWeekNumber(new Date())}
        xp={challenge.reward.xp}
        badge={challenge.reward.badge}
      />
    </>
  );
};

export default ChallengeOfTheWeek;
