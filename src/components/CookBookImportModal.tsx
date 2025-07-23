import React, { useEffect, useState, useRef } from 'react';
import { useRecipeContext } from './RecipeContext';

interface CookBookImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (ingredients: string[]) => void;
}

const CookBookImportModal: React.FC<CookBookImportModalProps> = ({ open, onClose, onImport }) => {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div ref={modalRef} className="bg-weatheredWhite rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto relative animate-fadein">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-lobsterRed text-2xl font-bold"
          aria-label="Close"
          disabled={isLoading}
        >
          ×
        </button>
        <h2 className="text-2xl font-retro text-maineBlue mb-4">Select Recipes to Import</h2>
        
        <div className="max-h-72 overflow-y-auto divide-y divide-seafoam mb-4">
          {recipes.length === 0 ? (
            <div className="text-gray-400 italic text-center py-8">
              No recipes found in your CookBook. Save some recipes to see them here!
            </div>
          ) : (
            recipes.map((r, idx) => (
              <label 
                key={r.id || idx} 
                className="flex items-center gap-3 py-2 cursor-pointer hover:bg-seafoam/10 rounded px-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(idx)}
                  onChange={() => handleToggle(idx)}
                  className="accent-maineBlue"
                  disabled={isLoading}
                />
                <span className="font-semibold text-maineBlue">{r.title || 'Untitled Recipe'}</span>
                <span className="text-xs text-gray-500">
                  {Array.isArray(r.ingredients) ? r.ingredients.length : 0} ingredients
                </span>
              </label>
            ))
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-400 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue disabled:opacity-50"
            onClick={handleImport}
            disabled={selected.length === 0 || isLoading}
          >
            {isLoading ? 'Importing...' : `Import ${selected.length} Recipe${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookBookImportModal;
