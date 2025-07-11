import React, { useEffect, useRef, useState } from 'react';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from './NavBar';
import { supabase } from '../api/supabaseClient';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string; // YouTube/Vimeo embed URL
  tutorialId?: string; // Unique ID for the tutorial
  recipeId?: string;   // Optional recipe ID if this is a recipe tutorial
}

const VideoModal: React.FC<VideoModalProps> = ({ open, onClose, title, videoUrl, tutorialId, recipeId }) => {
  const [hasAwardedXP, setHasAwardedXP] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { refreshXP } = useLevelProgressContext();
  
  // Reset XP award state when modal opens/closes or tutorial changes
  useEffect(() => {
    setHasAwardedXP(false);
  }, [open, tutorialId]);

  // Check if video is completed (for YouTube/other embeds)
  const checkVideoProgress = () => {
    if (!open || hasAwardedXP || !tutorialId) return;
    
    // This is a simplified check - in a real app, you'd use the YouTube/player API
    // to track actual video progress (e.g., 80% watched)
    const videoWatched = true; // Simplified for now
    
    if (videoWatched) {
      awardXpForTutorial();
    }
  };

  const awardXpForTutorial = async () => {
    if (hasAwardedXP || !tutorialId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if XP was already awarded for this tutorial
      const { data: existingLog } = await supabase
        .from('xp_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', `tutorial_${tutorialId}`)
        .maybeSingle();
      
      if (!existingLog) {
        // Award XP for completing a tutorial
        await supabase.rpc('increment_user_xp', {
          user_id: user.id,
          xp_amount: recipeId ? XP_REWARDS.LESSON_COMPLETE : XP_REWARDS.RECIPE_COMPLETE
        });
        
        // Log the XP award
        await supabase.from('xp_logs').insert([
          {
            user_id: user.id,
            xp_amount: recipeId ? XP_REWARDS.LESSON_COMPLETE : XP_REWARDS.RECIPE_COMPLETE,
            action: `tutorial_${tutorialId}`,
            metadata: { recipe_id: recipeId, tutorial_title: title }
          }
        ]);
        
        refreshXP();
        setHasAwardedXP(true);
      }
    } catch (error) {
      console.error('Error awarding XP for tutorial:', error);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-maineBlue text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-maineBlue">{title}</h2>
        <div className="aspect-w-16 aspect-h-9 w-full">
          {videoUrl ? (
            <iframe
              ref={iframeRef}
              src={videoUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-72 rounded"
              onLoad={checkVideoProgress}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-72 bg-gray-100 rounded text-gray-500 text-lg">
              No video found for this step.
            </div>
          )}
        </div>
        {/* Debug: show the raw videoUrl value */}
        <div className="mt-2 text-xs text-gray-400 break-all">
          <span className="font-semibold">Debug videoUrl:</span> {videoUrl ? videoUrl : '(empty)'}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
