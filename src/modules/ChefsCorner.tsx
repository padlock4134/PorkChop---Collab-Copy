import React, { useState } from 'react';
import ChefFreddieWidget from './ChefFreddieWidget';
import { useEffect } from 'react';
import { useFreddieContext } from '../components/FreddieContext';
import { fetchKitchen } from './kitchenSupabase';
import CookBookImportModal from '../components/CookBookImportModal';
import MarketDirectory from '../components/MarketDirectory';
import { useRecipeContext } from '../components/RecipeContext';
import { fetchCookbook } from './cookbookSupabase';
import { useSupabase } from '../components/SupabaseProvider';

const ChefsCorner = () => {
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user } = useSupabase();
  
  // Shopping list state
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    updateContext({ page: 'ChefsCorner' });
    
    // Load recipes from cookbook when Chef's Corner loads
    const loadRecipes = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const savedRecipes = await fetchCookbook(user.id);
        setRecipes(savedRecipes || []);
      } catch (err) {
        console.error('Error loading cookbook recipes:', err);
        // Initialize with empty array if there's an error
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, [updateContext, setRecipes, user?.id]);

  // Open modal for My CookBook import
  const importFromCookBook = () => {
    if (!user) {
      alert('Please sign in to access your cookbook');
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - add all ingredients, only deduplicating within the shopping list
  const handleCookBookImport = async (ingredientNames: string[]) => {
    console.log('Importing ingredients:', ingredientNames);
    
    if (!ingredientNames || !Array.isArray(ingredientNames)) {
      console.error('Invalid ingredients data received:', ingredientNames);
      alert('Error: Invalid ingredients data');
      return;
    }

    try {
      // Process all ingredients first
      const allIngredients = ingredientNames
        .filter((item): item is string => item != null) // Remove null/undefined
        .map(item => String(item).trim()) // Ensure string and trim
        .filter(item => item.length > 0); // Remove empty strings
      
      console.log('Processed ingredients to add:', allIngredients);
      
      if (allIngredients.length === 0) {
        console.log('No valid ingredients to add');
        return;
      }
      
      // Add to shopping list, removing duplicates (case-insensitive)
      setShoppingList(currentList => {
        // Create a Set of normalized current list items for quick lookup
        const currentNormalized = new Set(
          currentList.map(item => item.trim().toLowerCase())
        );
        
        // Only add items that aren't already in the shopping list
        const newItems = allIngredients.filter(
          item => !currentNormalized.has(item.trim().toLowerCase())
        );
        
        if (newItems.length === 0) {
          console.log('No new ingredients to add - all already in shopping list');
          return currentList;
        }
        
        const updatedList = [...currentList, ...newItems];
        console.log('Added new items to shopping list:', newItems);
        console.log('Updated shopping list:', updatedList);
        return updatedList;
      });
      
      alert(`Added ${allIngredients.length} ingredients to your shopping list`);
      
    } catch (error) {
      console.error('Error importing ingredients:', error);
      alert('Failed to import ingredients. Please try again.');
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
      <div className="chefs-corner-root relative flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <header className="chefs-corner-header mb-6 flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-5xl mr-2">🦐</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">Chefs Corner</h1>
            </div>
            <p className="text-lg text-gray-700 mb-4 text-center">Shop the freshest ingredients, meal kits, and more—all with a Maine Fish Market flair.</p>
          </header>
          {/* Shopping List - now at the top */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-maineBlue mb-3 text-center">Shopping List</h2>
            <div className="bg-sand rounded shadow p-4 flex flex-col items-center">
              <p className="mb-2 text-gray-700 text-center">Import your saved recipes from My CookBook and shop everything you need in one click!</p>
              <button 
                onClick={importFromCookBook} 
                className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Import from My CookBook'}
              </button>
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
