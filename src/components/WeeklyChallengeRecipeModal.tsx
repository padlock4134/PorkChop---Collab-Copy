import React from 'react';
import type { RecipeCard } from './RecipeMatcherModal';
import { useState, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { claimWeeklyChallenge } from '../api/weeklyChallenge';
import { isSessionValid } from '../api/userSession';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from './NavBar';
import { useSupabase } from './SupabaseProvider';

interface WeeklyChallengeRecipeModalProps {
  open: boolean;
  onClose: () => void;
  recipe: RecipeCard | null;
  loading: boolean;
  error: string | null;
  challengeId?: string;
  weekNumber?: number;
  xp?: number;
  badge?: string;
  onClaimed?: () => void;
}

const WeeklyChallengeRecipeModal: React.FC<WeeklyChallengeRecipeModalProps> = ({ open, onClose, recipe, loading, error, challengeId, weekNumber, xp, badge, onClaimed }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshXP } = useLevelProgressContext();

  const { user } = useSupabase();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('Photo must be less than 5MB');
      return;
    }

    setProofPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  async function uploadProofPhoto() {
    if (!proofPhoto) {
      setUploadError('Please submit a photo of your dish');
      return null;
    }

    const sessionValid = await isSessionValid();
    if (!sessionValid || !user?.id) throw new Error('Not signed in');

    const fileExt = proofPhoto.name.split('.').pop();
    const fileName = `${user?.id}-week${weekNumber}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('challenge-proofs')
      .upload(fileName, proofPhoto);

    if (error) {
      setUploadError('Failed to upload photo');
      throw error;
    }

    return data.path;
  }

  async function handleClaim() {
    setClaiming(true);
    setClaimError(null);
    setUploadError(null);

    try {
      const sessionValid = await isSessionValid();
      if (!sessionValid || !user?.id) throw new Error('Not signed in');

      // First upload the proof photo
      const photoPath = await uploadProofPhoto();
      if (!photoPath) return;

      // Then claim the challenge with the photo proof
      const result = await claimWeeklyChallenge({
        userId: user?.id,
        challengeId: challengeId || recipe?.id || '',
        weekNumber: weekNumber || 0,
        xp: xp || 0,
        badge: badge || '',
        proofPhotoPath: photoPath
      });

      if (result.alreadyClaimed) {
        setAlreadyClaimed(true);
      } else {
        setClaimed(true);
        // Award XP for completing the challenge
        const sessionValid = await isSessionValid();
        if (sessionValid && user.id) {
          await import('../services/xpService').then(m => 
            m.awardXP(user.id, XP_REWARDS.CHALLENGE_COMPLETE, 'challenge_complete')
          );
          refreshXP();
        }
      }
      if (onClaimed) onClaimed();
    } catch (e: any) {
      setClaimError(e.message || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="Close">✕</button>
        <div className="flex flex-col items-center min-h-[200px] justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maineBlue mb-4"></div>
              <span className="text-lg font-semibold">Generating Recipe...</span>
            </div>
          )}
          {!loading && error && (
            <div className="text-red-600 text-center">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && recipe && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center text-black">{recipe.title}</h2>
              {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full max-h-48 sm:max-h-64 object-cover rounded mb-6" />}
              {/* Photo Upload Section */}
              <div className="w-full mt-4 border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">Submit Proof Photo</h3>
                <div className="flex flex-col items-center gap-2">
                  {photoUrl ? (
                    <div className="relative w-full">
                      <img src={photoUrl} alt="Proof" className="w-full h-48 object-cover rounded" />
                      <button 
                        onClick={() => {
                          setProofPhoto(null);
                          setPhotoUrl(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-maineBlue transition-colors"
                    >
                      📸
                      <span className="mt-2 text-gray-600">Click to add a photo of your dish</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                </div>
              </div>

              <button
                className={`mt-4 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-bold shadow w-full ${claimed || alreadyClaimed ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleClaim}
                disabled={claiming || claimed || alreadyClaimed || !proofPhoto}
              >
                {claiming ? 'Claiming...' : claimed ? 'Reward Claimed!' : alreadyClaimed ? 'Already Claimed' : 'Submit Proof & Claim Reward'}
              </button>
              {claimError && <div className="text-red-600 mt-2">{claimError}</div>}
              {claimed && <div className="text-green-700 mt-2 font-semibold">XP and badge awarded! 🎉</div>}
              {alreadyClaimed && <div className="text-yellow-700 mt-2 font-semibold">You already claimed this week's reward.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyChallengeRecipeModal;
