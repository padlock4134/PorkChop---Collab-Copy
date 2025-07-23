import React, { useEffect, useState, useRef } from 'react';
import { useRecipeContext } from './RecipeContext';

interface CookBookImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (ingredients: string[]) => void;
  existingIngredients?: string[];
}

const CookBookImportModal: React.FC<CookBookImportModalProps> = ({ 
  open, 
  onClose, 
  onImport,
  existingIngredients = []
}) => {
  const { recipes } = useRecipeContext();
  const [selected, setSelected] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    setSelected([]);
    setIsLoading(false);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleToggle = (idx: number) => {
    setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };

  const handleImport = async () => {
    if (selected.length === 0) return;
    
    setIsLoading(true);
    try {
      console.log('Selected recipe indices:', selected);
      console.log('All recipes:', recipes);
      
      // Extract all ingredients from selected recipes
      const allIngredients = selected.flatMap(recipeIdx => {
        const recipe = recipes[recipeIdx];
        if (!recipe) {
          console.warn(`No recipe found at index ${recipeIdx}`);
          return [];
        }
        
        console.log(`Processing recipe ${recipeIdx}:`, recipe.title, 'Ingredients:', recipe.ingredients);
        
        try {
          // Handle different possible ingredient formats
          if (Array.isArray(recipe.ingredients)) {
            return recipe.ingredients.map(ing => {
              // If it's a string, use it as is
              if (typeof ing === 'string') return ing.trim();
              // If it's an object with a 'name' property, use that
              const ingredientObj = ing as { name?: unknown };
              if (ingredientObj && typeof ingredientObj === 'object' && 'name' in ingredientObj) {
                return String(ingredientObj.name).trim();
              }
              // Otherwise, try to convert to string
              return String(ing).trim();
            }).filter((ing): ing is string => Boolean(ing));
          }
          
          // If ingredients is a string, try to split by newlines or commas
          const ingredientsStr = String(recipe.ingredients || '');
          if (ingredientsStr) {
            return ingredientsStr
              .split(/[\n,]/)
              .map(ing => ing.trim())
              .filter(Boolean);
          }
          
          console.warn('Unsupported ingredients format:', recipe.ingredients);
          return [];
          
        } catch (error) {
          console.error(`Error processing recipe ${recipeIdx} (${recipe.title}):`, error);
          return [];
        }
      });
      
      console.log('All extracted ingredients:', allIngredients);
      
      if (allIngredients.length === 0) {
        alert('No valid ingredients found in the selected recipes.');
        return;
      }
      
      // Pass all ingredients to parent component
      onImport(allIngredients);
      onClose();
      
    } catch (error) {
      console.error('Error in import process:', error);
      alert('Failed to import recipes. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const isIngredientInList = (ingredient: string): boolean => {
    if (!ingredient) return false;
    const normalizedIngredient = ingredient.trim().toLowerCase();
    return existingIngredients.some(
      existing => existing.trim().toLowerCase() === normalizedIngredient
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Import from CookBook</h2>
          <p className="text-gray-600 mb-4">
            Select recipes to import ingredients from. Items already in your shopping list will be marked.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recipes found in your CookBook.
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe, idx) => (
                <div key={recipe.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center p-4 bg-gray-50">
                    <input
                      type="checkbox"
                      id={`recipe-${idx}`}
                      checked={selected.includes(idx)}
                      onChange={() => handleToggle(idx)}
                      className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label 
                      htmlFor={`recipe-${idx}`} 
                      className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer flex-1"
                    >
                      {recipe.title}
                      <span className="text-xs text-gray-500 ml-2">
                        ({Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients)
                      </span>
                    </label>
                  </div>
                  
                  {selected.includes(idx) && (
                    <div className="p-4 pt-2 border-t bg-white">
                      <div className="text-sm text-gray-600 space-y-1">
                        {recipe.ingredients.map((ingredient, i) => {
                          const exists = isIngredientInList(ingredient);
                          return (
                            <div key={i} className="flex items-start py-1">
                              <span className="inline-block w-4 h-4 mr-2 mt-0.5">
                                {exists ? (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                                )}
                              </span>
                              <span className={exists ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                {ingredient}
                              </span>
                              {exists && (
                                <span className="ml-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                  In list
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading || selected.length === 0}
          >
            {isLoading ? 'Importing...' : `Import ${selected.length} selected`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookBookImportModal;
