import React, { useState } from 'react';
import ChefFreddieWidget from './ChefFreddieWidget';
import { useEffect } from 'react';
import { useFreddieContext } from '../components/FreddieContext';
import { fetchKitchen } from './kitchenSupabase';
import CookBookImportModal from '../components/CookBookImportModal';
import MarketDirectory from '../components/MarketDirectory';
import { useRecipeContext } from '../components/RecipeContext';
import { fetchCookbook } from './cookbookSupabase';

const ChefsCorner = () => {
  const { updateContext } = useFreddieContext();
  const { setRecipes } = useRecipeContext();
  
  useEffect(() => {
    updateContext({ page: 'ChefsCorner' });
    
    // Load recipes from cookbook when Chef's Corner loads
    const loadRecipes = async () => {
      try {
        const savedRecipes = await fetchCookbook();
        setRecipes(savedRecipes);
      } catch (err) {
        console.error('Error loading cookbook recipes:', err);
      }
    };
    
    loadRecipes();
  }, [updateContext, setRecipes]);

  // Shopping list state
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  // Modal state for CookBook import
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);

  // Removed coords state since NearbyPlaces now handles its own location

  // Open modal for My CookBook import
  const importFromCookBook = () => setCookbookModalOpen(true);

  // Handler for modal import - only add ingredients not in kitchen
  const handleCookBookImport = async (ingredientNames: string[]) => {
    try {
      const kitchenIngredients = await fetchKitchen();
      let kitchenNames: string[] = [];
      if (Array.isArray(kitchenIngredients) && kitchenIngredients.length > 0) {
        if (kitchenIngredients.every(i => typeof i === 'string')) {
          kitchenNames = kitchenIngredients as string[];
        } else if (kitchenIngredients.every(i => typeof i === 'object' && i !== null && 'name' in i)) {
          kitchenNames = (kitchenIngredients as { name: string }[]).map(i => i.name);
        } else {
          kitchenNames = [];
        }
      }
      const missing = ingredientNames.filter(name => !kitchenNames.map(n => n.trim().toLowerCase()).includes(name.trim().toLowerCase()));
      setShoppingList(Array.from(new Set([...shoppingList, ...missing].map(i => i.trim()).filter(Boolean))));
    } catch (err) {
      alert('Could not compare with kitchen: ' + (err as Error).message);
      // fallback: add all
      setShoppingList(Array.from(new Set([...shoppingList, ...ingredientNames].map(i => i.trim()).filter(Boolean))));
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
      <div className="chefs-corner-root relative flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <header className="chefs-corner-header mb-6 flex flex-col items-center">
            <h1 className="text-3xl font-retro text-maineBlue mb-2">Chefs Corner</h1>
            <p className="text-lg text-gray-700 mb-4 text-center">Shop the freshest ingredients, meal kits, and more—all with a Maine Fish Market flair.</p>
          </header>
          {/* Shopping List - now at the top */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-maineBlue mb-3 text-center">Shopping List</h2>
            <div className="bg-sand rounded shadow p-4 flex flex-col items-center">
              <p className="mb-2 text-gray-700 text-center">Import your saved recipes from My CookBook and shop everything you need in one click!</p>
              <button onClick={importFromCookBook} className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full">Import from My CookBook</button>
              <CookBookImportModal
                open={cookbookModalOpen}
                onClose={() => setCookbookModalOpen(false)}
                onImport={handleCookBookImport}
              />
              <ul className="mt-4 w-full">
                {shoppingList.length === 0 ? (
                  <li className="text-gray-400 italic text-center">No items yet. Import to get started!</li>
                ) : (
                  shoppingList.map(item => (
                    <li key={item} className="flex items-center justify-between py-1 border-b border-seafoam last:border-b-0">
                      <span>{item}</span>
                      <button
                        className="text-lobsterRed font-bold ml-2 hover:underline"
                        onClick={() => setShoppingList(shoppingList.filter(i => i !== item))}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>

            </div>
          </section>


          {/* Markets Directory */}
          <MarketDirectory />

        </div>

        <ChefFreddieWidget />
      </div>
    </div>
  );
};

export default ChefsCorner;

