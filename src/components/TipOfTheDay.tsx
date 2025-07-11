import React, { useState, useRef, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

const tips = [
  "Always read the entire recipe before starting.",
  "Let meat rest after cooking for juicier results.",
  "Use a sharp knife for safer, easier chopping.",
  "Season as you go, not just at the end.",
  "Preheat your pan before adding ingredients.",
  "Taste as you cook for better results.",
  "Clean as you go to keep your workspace tidy.",
  "Store herbs in a damp paper towel to keep them fresh.",
  "Use a thermometer for perfect doneness.",
  "Balance flavors with acid, salt, and sweetness."
  // ...add up to 365 tips
];

function getTipOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return tips[dayOfYear % tips.length];
}

const TipOfTheDay = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative flex items-center">
      <button
        aria-label="Show tip of the day"
        className="p-2 rounded-full bg-seafoam hover:bg-maineBlue hover:text-seafoam text-maineBlue shadow transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <LightBulbIcon className="h-7 w-7" />
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-1/2 -translate-x-1/2 top-12 z-50 bg-weatheredWhite text-maineBlue rounded-lg shadow-lg px-5 py-4 font-retro text-sm max-w-xs w-64 border border-seafoam"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Tip of the Day</span>
            <button
              aria-label="Close tip"
              className="text-lobsterRed text-lg font-bold ml-2"
              onClick={() => setOpen(false)}
            >✕</button>
          </div>
          <span>{getTipOfTheDay()}</span>
        </div>
      )}
    </div>
  );
};

export default TipOfTheDay;
