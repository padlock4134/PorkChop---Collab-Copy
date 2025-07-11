import React, { useState } from 'react';
import { useRecipeContext } from './RecipeContext';
import { useNavigate } from 'react-router-dom';

export type RecipeCard = {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string;
  equipment?: string[];
  tutorials?: Array<{
    title: string;
    desc: string;
    videoUrl?: string;
  }>;
  products?: Array<{
    name: string;
    desc: string;
    price: string;
    image: string;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  cupboardIngredients: string[];
  onLike: (recipe: RecipeCard) => void;
  recipes: RecipeCard[];
  loading: boolean;
  error: string;
};

const RecipeMatcherModal: React.FC<Props> = ({ open, onClose, cupboardIngredients, onLike, recipes, loading, error }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { setSelectedRecipe } = useRecipeContext();
  const navigate = useNavigate();

  if (!open) return null;

  const handleLike = async () => {
    try {
      setIsSaving(true);
      await onLike(recipes[currentIdx]);
      setCurrentIdx(idx => idx + 1);
    } catch (error) {
      console.error('Error liking recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSkip = () => setCurrentIdx(idx => idx + 1);
  function generateTutorials(recipe: RecipeCard) {
  return [
    {
      title: `Equipment: Using the right tools for ${recipe.title}`,
      desc: `Learn how to use the main equipment needed for this dish.`
    },
    {
      title: `Protein Prep: Preparing the main ingredient`,
      desc: `How to prep the main protein (e.g., fish, chicken, clams) for this recipe.`
    },
    {
      title: `Recipe: ${recipe.title}`,
      desc: recipe.instructions
    }
  ];
}

  const handleCookMe = () => {
    const fullRecipe = {
      ...recipes[currentIdx],
      tutorials: recipes[currentIdx].tutorials && recipes[currentIdx].tutorials.length === 3
        ? recipes[currentIdx].tutorials
        : generateTutorials(recipes[currentIdx])
    };
    setSelectedRecipe(fullRecipe);
    navigate('/culinary-school');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-weatheredWhite rounded-lg shadow-lg p-6 max-w-xl w-full relative">
        <button className="absolute top-2 right-2 text-lobsterRed font-bold text-xl" onClick={onClose}>✕</button>
        <h2 className="font-retro text-2xl mb-2 text-center">Recipe Matcher</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">Finding recipes...</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : recipes.length === 0 || currentIdx >= recipes.length ? (
          <div className="text-center text-maineBlue font-bold py-10">No more suggestions.<br/>Try updating your cupboard!</div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-sand rounded-xl shadow-lg p-4 w-full max-w-md mb-4 relative">
              <img src={recipes[currentIdx].image} alt={recipes[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
              <h3 className="font-retro text-xl mb-1">{recipes[currentIdx].title}</h3>
              <div className="text-xs text-gray-600 mb-2">Ingredients: {recipes[currentIdx].ingredients.join(', ')}</div>
              {recipes[currentIdx].equipment && recipes[currentIdx].equipment.length > 0 && (
                <div className="text-xs text-gray-600 mb-2">Equipment: {recipes[currentIdx].equipment.join(', ')}</div>
              )}
              <div className="text-sm text-gray-800 mb-2 line-clamp-3">{recipes[currentIdx].instructions}</div>
            </div>
            <div className="flex gap-8 mt-2">
              <button className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" onClick={handleSkip}>
                ✕
              </button>
              <button 
                className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                onClick={handleLike}
                disabled={isSaving}
              >
                {isSaving ? '...' : '♥'}
              </button>
              <button className="bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue text-xl font-bold" onClick={handleCookMe}>
                Cook Me
              </button>
            </div>
            <div className="text-xs mt-4 text-center text-gray-500">Swipe through AI-powered recipes based on your cupboard!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeMatcherModal;
