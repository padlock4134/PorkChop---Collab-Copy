import React, { useState, useEffect } from 'react';
import { ExperienceLevel } from '../types/userPreferences';
import { getUserPreferences, updateExperienceLevel } from '../api/userPreferences';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from './NavBar';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onProfileUpdated: (profile: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, user, onProfileUpdated }) => {
  const { refreshXP } = useLevelProgressContext();
  const [bio, setBio] = useState(user?.bio || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('new_to_cooking');

  useEffect(() => {
    if (open) {
      getUserPreferences().then(prefs => {
        setExperienceLevel(prefs.experienceLevel);
      });
    }
  }, [open]);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check if this is the first time the profile is being completed
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('bio, avatar_url, experience_level')
        .eq('id', user.id)
        .single();
      
      if (profileFetchError) throw profileFetchError;
      
      const isProfileIncomplete = !profileData.bio || !profileData.avatar_url || !profileData.experience_level;
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          bio, 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Update experience level
      await updateExperienceLevel(experienceLevel);

      // Award XP if this completes the profile
      if (isProfileIncomplete && (bio && avatarUrl && experienceLevel)) {
        // Check if XP was already awarded for profile completion
        const { data: existingLog } = await supabase
          .from('xp_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('action', 'profile_complete')
          .maybeSingle();
          
        if (!existingLog) {
          // Award XP for profile completion
          await supabase.rpc('increment_user_xp', {
            user_id: user.id,
            xp_amount: XP_REWARDS.PROFILE_COMPLETE
          });
          
          // Log the XP award
          await supabase.from('xp_logs').insert([
            {
              user_id: user.id,
              xp_amount: XP_REWARDS.PROFILE_COMPLETE,
              action: 'profile_complete',
              metadata: { 
                has_bio: !!bio,
                has_avatar: !!avatarUrl,
                has_experience_level: true
              }
            }
          ]);
          
          refreshXP();
          
          // Show success message
          alert(`Profile completed! +${XP_REWARDS.PROFILE_COMPLETE} XP`);
        }
      }

      onProfileUpdated({ ...user, bio, avatar: avatarUrl });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-maineBlue">×</button>
        <h2 className="text-xl font-bold mb-4 text-maineBlue">Edit Profile</h2>
        {error && <div className="mb-2 text-red-600">{error}</div>}

        <label className="block mb-2 font-semibold">Cooking Experience</label>
        <select
          className="w-full mb-4 p-2 border rounded bg-white"
          value={experienceLevel}
          onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)}
        >
          <option value="new_to_cooking">New to Cooking</option>
          <option value="home_cook">Home Cook</option>
          <option value="kitchen_confident">Kitchen Confident</option>
        </select>
        <label className="block mb-2 font-semibold">Bio</label>
        <textarea
          className="w-full mb-4 p-2 border rounded"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
        <label className="block mb-2 font-semibold">Avatar URL</label>
        <input
          className="w-full mb-4 p-2 border rounded"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
        />
        <button type="submit" disabled={loading} className="w-full bg-maineBlue text-seafoam py-2 rounded font-semibold hover:bg-seafoam hover:text-maineBlue transition-colors">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProfileModal;
