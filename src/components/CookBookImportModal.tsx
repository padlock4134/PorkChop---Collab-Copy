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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setSelected([]);
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

  if (!open) return null;

  const handleToggle = (idx: number) => {
    setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };

  const handleImport = () => {
    const allIngredients = selected
      .map(idx => recipes[idx]?.ingredients || [])
      .flat()
      .filter(Boolean);
    const unique = Array.from(new Set(allIngredients.map(i => i.trim())));
    onImport(unique);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div ref={modalRef} className="bg-weatheredWhite rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto relative animate-fadein">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-lobsterRed text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-retro text-maineBlue mb-4">Select Recipes to Import</h2>
        <div className="max-h-72 overflow-y-auto divide-y divide-seafoam mb-4">
          {recipes.length === 0 ? (
            <div className="text-gray-400 italic text-center py-8">No recipes found in your CookBook.</div>
          ) : (
            recipes.map((r, idx) => (
              <label key={idx} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-seafoam/10 rounded px-2">
                <input
                  type="checkbox"
                  checked={selected.includes(idx)}
                  onChange={() => handleToggle(idx)}
                  className="accent-maineBlue"
                />
                <span className="font-semibold text-maineBlue">{r.title}</span>
                <span className="text-xs text-gray-500">{r.ingredients?.length || 0} ingredients</span>
              </label>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-400"
            onClick={onClose}
          >Cancel</button>
          <button
            className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue disabled:opacity-50"
            onClick={handleImport}
            disabled={selected.length === 0}
          >Import Selected</button>
        </div>
      </div>
    </div>
  );
};

export default CookBookImportModal;
