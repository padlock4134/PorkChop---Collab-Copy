import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFreddieContext } from '../components/FreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/RecipeContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';

const generalLessons = [
  { title: 'Knife Skills 101', desc: 'Learn how to chop, dice, and julienne like a pro.' },
  { title: 'Seafood Handling & Safety', desc: 'How to select, store, and prep fresh seafood safely.' },
  { title: 'Essential Cooking Techniques', desc: 'Master sautéing, steaming, poaching, and more.' },
  { title: 'Sanitation & Cross-Contamination', desc: 'Keep your kitchen safe and clean.' },
  { title: 'Using a Thermometer', desc: 'How to check doneness for seafood, poultry, and meats.' },
  { title: 'Knife & Equipment Care', desc: 'Cleaning, storing, and maintaining your tools.' }
];

const defaultTutorials = [
  {
    title: 'Tutorials and Cooking Hacks',
    desc: 'Learn specialized techniques and shortcuts for better cooking.',
    comingSoon: true
  },
  {
    title: 'Let\'s Cook This Meal!',
    desc: 'How to prepare the main ingredient for this dish.'
  }
];

function getTwoTutorials(recipe) {
  if (!recipe) return [];
  return [
    {
      title: `Tutorials and Cooking Hacks`,
      desc: `Learn specialized techniques and shortcuts for better cooking.`,
      comingSoon: true
    },
    {
      title: `Let\'s Cook This Meal!`,
      desc: `How to prep the main ingredient (e.g., fish, chicken, clams) for this recipe.`
    }
  ];
}


const CulinarySchool = () => {
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  const [modalIdx, setModalIdx] = useState<null | number>(null);

  useEffect(() => {
    updateContext({ page: 'CulinarySchool' });
  }, [updateContext]);

  const isRecipeSelected = !!selectedRecipe;
  const tutorials = isRecipeSelected ? getTwoTutorials(selectedRecipe) : [];
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);

  // Helper: extract main protein from ingredients
  function getMainProtein(ingredients: string[] = []) {
    const proteins = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'clam', 'crab', 'lobster',
      'tofu', 'turkey', 'duck', 'lamb', 'egg', 'eggs', 'scallop', 'scallops', 'mussels', 'steak',
      'bacon', 'sausage', 'ham', 'vegan', 'tempeh', 'seitan', 'octopus', 'squid', 'anchovy', 'anchovies'
    ];
    return ingredients.find(ing => proteins.some(p => ing.toLowerCase().includes(p)));
  }
  // Helper: extract main equipment from equipment array
  function getMainEquipment(equipment: string[] = []) {
    const priorities = [
      'pan', 'pot', 'oven', 'grill', 'skillet', 'wok', 'baking sheet', 'slow cooker', 'pressure cooker', 'air fryer', 'broiler', 'deep fryer', 'steamer', 'microwave', 'toaster oven'
    ];
    for (const p of priorities) {
      const found = equipment.find(eq => eq.toLowerCase().includes(p));
      if (found) return found;
    }
    return equipment[0] || '';
  }

  // Helper to call Chef Freddie backend for a smart search query
  async function getVideoQueryFromFreddie(recipe, tut, idx) {
    // For the 3rd tutorial (idx === 2), just search the recipe name
    if (typeof idx === 'number' && idx === 2 && recipe && recipe.title) {
      return recipe.title;
    }
    // For the main recipe tutorial, try to generate a focused query
    let query = '';
    if (recipe && tut && tut.title && tut.title.toLowerCase().includes('recipe')) {
      const mainProtein = getMainProtein(recipe.ingredients || []);
      const mainEquipment = getMainEquipment(recipe.equipment || []);
      if (mainProtein && mainEquipment) {
        query = `How to cook ${mainProtein} using ${mainEquipment}`;
      } else if (mainProtein) {
        query = `How to cook ${mainProtein}`;
      } else if (mainEquipment) {
        query = `How to cook with ${mainEquipment}`;
      }
    }
    // Fallback to the old prompt if not main recipe step or missing info
    if (!query) {
      const prompt = `
        Given the following recipe and tutorial step, generate a concise YouTube search query for a relevant cooking video.\n
        - Only use the equipment and ingredients listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and recipe.\n
        Recipe: ${recipe.title}\n
        Ingredients: ${recipe.ingredients?.join(', ')}\n
        Equipment: ${recipe.equipment?.join(', ') || 'N/A'}\n
        Step Title: ${tut.title}\n
        Step Description: ${tut.desc}\n
        Query:
      `;
      try {
        const res = await fetch('/api/chefFreddieQuery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        return data.query || tut.title + ' ' + (recipe.title || '');
      } catch {
        return tut.title + ' ' + (recipe.title || '');
      }
    }
    return query;
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      if (!isRecipeSelected) return;

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        // No more tut.videoUrl, just fetch video for each tutorial
        // Generate distinct queries for each tutorial step
        let query = '';
        if (idx === 0) {
          // Step 1: How to make the meal
          query = selectedRecipe.title ? `how to make ${selectedRecipe.title}` : tut.title;
        } else if (idx === 1) {
          // Step 2: Main Ingredient Prep
          const mainIngredient = getMainIngredient(selectedRecipe.ingredients || []);
          query = mainIngredient && selectedRecipe.title
            ? `how to prepare ${mainIngredient} for ${selectedRecipe.title}`
            : tut.title;

          const result: TutorialVideoResult = await getTutorialVideo(query);
          // Debug: log the query and result
          console.log(`[CulinarySchool] Tutorial step`, { query, result });
          const lowerTitle = result?.title?.toLowerCase() || '';
          const equipmentArr = Array.isArray(selectedRecipe?.equipment) ? selectedRecipe.equipment : [];
          const ingredientsArr = Array.isArray(selectedRecipe?.ingredients) ? selectedRecipe.ingredients : [];
          const relevant =
            (equipmentArr.some(eq => lowerTitle.includes(eq.toLowerCase())) ||
             ingredientsArr.some(ing => lowerTitle.includes(ing.toLowerCase())) ||
             lowerTitle.includes((selectedRecipe?.title || '').toLowerCase()));
          // If not relevant but we have a result, use it anyway as a fallback
          newUrls[idx] = (relevant && result?.url) ? result.url : (result?.url || null);
        }
      }));
      if (!cancelled) setVideoUrls(newUrls);

    }
    fetchVideos();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecipeSelected, selectedRecipe?.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-8 bg-sand min-h-screen">

        <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <h2 className="text-xl font-retro mb-4">Culinary School</h2>
        {/* Always render a VideoModal for the currently displayed tutorial list */}
        {(isRecipeSelected ? tutorials : defaultTutorials).map((tut, idx) => (
          <VideoModal
            key={idx}
            open={modalIdx === idx}
            onClose={() => setModalIdx(null)}
            title={tut.title}
            videoUrl={videoUrls[idx] || ''}
            tutorialId={`${selectedRecipe?.id || 'general'}_${idx}`}
            recipeId={selectedRecipe?.id}
          />
        ))}
        {isRecipeSelected && selectedRecipe ? (
          <div className="mb-6">
            {/* Tutorials Section */}
            <h3 className="text-lg font-retro mb-2 text-maineBlue">For {selectedRecipe.title}</h3>
            <ol className="space-y-4 list-decimal list-inside">
              {tutorials.map((tut, idx) => (
                <li
                  key={idx}
                  className={`bg-sand p-4 rounded shadow-inner relative ${tut.comingSoon ? 'cursor-default' : 'cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors'}`}
                  onClick={() => !tut.comingSoon && setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">Step {idx + 1}: {tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                  {tut.comingSoon && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-lg transform rotate-12">Coming Soon</span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {/* Recipe Card Display at Bottom (matching MyCookBook RecipeCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-3xl min-h-[350px] mt-8 mx-auto">
              {/* Left Page */}
              <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                {selectedRecipe.image && (
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    className="rounded-lg w-full h-32 object-cover mb-4"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <h3 className="font-bold text-xl mb-1 text-maineBlue">{selectedRecipe.title}</h3>
                {/* No description on RecipeCard, but add if needed: */}
                {/* <div className="text-gray-600 mb-2 text-base">{selectedRecipe.description}</div> */}
                <div className="font-semibold mb-1 mt-2">Ingredients:</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">No ingredients listed.</li>
                  )}
                </ul>
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">Instructions</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">No instructions provided.</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">Equipment Needed:</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq, i) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">No equipment listed.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-retro mb-2 text-maineBlue">General Tutorials</h3>
            <ol className="space-y-4 list-decimal list-inside">
              {defaultTutorials.map((tut, idx) => (
                <li
                  key={idx}
                  className={`bg-sand p-4 rounded shadow-inner relative ${tut.comingSoon ? 'cursor-default' : 'cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors'}`}
                  onClick={() => !tut.comingSoon && setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">Step {idx + 1}: {tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                  {tut.comingSoon && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-lg transform rotate-12">Coming Soon</span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <div className="text-gray-700 mb-4">Want to get started? Head to My Kitchen and click <b>'Cook Me'</b> on any recipe!</div>
              <div className="flex justify-center space-x-4">
                <Link to="/my-kitchen" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">Go to My Kitchen</Link>
                <Link to="/my-cookbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">Go to My Cookbook</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CulinarySchool;
