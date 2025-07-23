import React, { useState, useEffect } from 'react';
import { redirectToLogout } from '@wristband/react-client-auth';

import { supabase } from '../api/supabaseClient';
import { useSupabase } from '../components/SupabaseProvider';
import { verifySubscription } from '../api/userSubscription';
import { Subscription } from '../types/shared-types';
import PaymentModal from './PaymentModal';
import { isSessionValid } from '../api/userSession';

// Define a simple hook for TermsModal since the original import is incorrect
function useTermsModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const termsContent = `Terms of Service for Porkchop (effective July 2025)

Welcome to Porkchop. By using this app, you agree to be bound by the following terms and conditions.`;
  return { modalOpen, setModalOpen, termsContent };
}

// Define UserProfile type to resolve missing type error
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  experience: string;
  dietary: string[];
  cuisine: string[];
  kitchenSetup: string;
  xp: number;
};

const Profile = () => {
  const { user, isSessionValid } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTalents, setActiveTalents] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('Cast Iron Champion');
  const [showTalents, setShowTalents] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [kitchenSetup, setKitchenSetup] = useState<string>('Apartment Kitchen');

  const { modalOpen: termsModalOpen, setModalOpen: setTermsModalOpen, termsContent } = useTermsModal();

  const talentTrees = {
    'Cast Iron Champion': [
      { name: 'Sear Savant', cost: 1, active: activeTalents.includes('Sear Savant'), description: 'Perfect searing technique' },
      { name: 'Heat Control', cost: 2, active: activeTalents.includes('Heat Control'), description: 'Mastery of heat distribution' },
      { name: 'Seasoned Surface', cost: 3, active: activeTalents.includes('Seasoned Surface'), description: 'Optimal non-stick surface' },
      { name: 'Iron Chef', cost: 5, active: activeTalents.includes('Iron Chef'), description: 'Ultimate cast iron mastery' },
    ],
    'Grilling Heavy Weight': [
      { name: 'Flame Tamer', cost: 1, active: activeTalents.includes('Flame Tamer'), description: 'Control over open flames' },
      { name: 'Smoke Master', cost: 2, active: activeTalents.includes('Smoke Master'), description: 'Perfect smoky flavors' },
      { name: 'Grill Marks', cost: 3, active: activeTalents.includes('Grill Marks'), description: 'Signature grill patterns' },
      { name: 'BBQ God', cost: 5, active: activeTalents.includes('BBQ God'), description: 'Legendary grilling skills' },
    ],
    'Baking Warlock': [
      { name: 'Dough Whisperer', cost: 1, active: activeTalents.includes('Dough Whisperer'), description: 'Perfect dough consistency' },
      { name: 'Oven Oracle', cost: 2, active: activeTalents.includes('Oven Oracle'), description: 'Precise baking timing' },
      { name: 'Pastry Pro', cost: 3, active: activeTalents.includes('Pastry Pro'), description: 'Expert in pastries' },
      { name: 'Bread Buffoon', cost: 5, active: activeTalents.includes('Bread Buffoon'), description: 'Master of all baked goods' },
    ],
  };

  const handleLogout = async () => {
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  const handleUnlock = (tree: string, talent: string, cost: number) => {
    if (talentPoints >= cost && !activeTalents.includes(talent)) {
      setTalentPoints(points => points - cost);
      setActiveTalents(talents => [...talents, talent]);
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const sessionValid = await isSessionValid();
        if (!sessionValid) {
          setError('Not authenticated. Please sign in again.');
          setLoading(false);
          return;
        }

        const [profileResponse] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user?.id).single(),
        ]);

        if (profileResponse.error) {
          setError('Could not load your profile: ' + profileResponse.error.message);
          setLoading(false);
          return;
        }

        const profile = profileResponse.data;
        if (!profile) {
          setError('No profile found. Please try signing out and in again.');
          setLoading(false);
          return;
        }

        // Ensure XP is a number and has a default value of 0
        const xp = typeof profile.xp === 'number' ? profile.xp : 0;
        console.log('Profile XP:', profile.xp, 'Parsed XP:', xp);
        
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp
        });

        // Calculate talent points based on XP
        const calculatedTalentPoints = Math.floor(xp / 100);
        setTalentPoints(calculatedTalentPoints);
        console.log('Calculated talent points:', calculatedTalentPoints);
        
        // Mock active talents for now (in real implementation, fetch from backend)
        if (xp >= 100) setActiveTalents(['Sear Savant', 'Flame Tamer', 'Dough Whisperer']);
        if (xp >= 300) setActiveTalents(prev => [...prev, 'Heat Control']);
        
        // Fetch subscription information
        try {
          const subscriptionData = await verifySubscription(user?.id || '');
          setSubscription(subscriptionData.subscription);
        } catch (subError) {
          console.error('Error fetching subscription:', subError);
          // Don't set error state here to avoid blocking profile display
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      const points = Math.floor(userProfile.xp / 100);
      setTalentPoints(points);
      // Mock active talents for now (in real implementation, fetch from backend)
      if (userProfile.xp >= 100) setActiveTalents(['Sear Savant', 'Flame Tamer', 'Dough Whisperer']);
      if (userProfile.xp >= 300) setActiveTalents(prev => [...prev, 'Heat Control']);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && userProfile.kitchenSetup) {
      setKitchenSetup(userProfile.kitchenSetup);
    }
  }, [userProfile]);

  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  } 

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  } 

  if (!userProfile) {
    return null;
  } 

  return (
    <div className="max-w-2xl mx-auto p-6 bg-weatheredWhite rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-center items-center mb-6 flex-wrap gap-4 sm:gap-0">
        <h1 className="text-3xl font-retro text-maineBlue">My Profile</h1>
      </div>

      {/* User Details - Condensed and Centered */}
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-maineBlue rounded-full flex items-center justify-center text-seafoam font-bold text-2xl overflow-hidden shrink-0">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{userProfile.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-maineBlue">{userProfile.name}</h2>
            {subscription && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                subscription.plan === 'yearly' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'}
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-retro mb-2 text-center">My Culinary Journey</h2>
      {/* Active Talents and Talent Trees - Compact and Centered Buttons */}
      <div className="mb-4">
        <span className="block mb-1 font-semibold text-sm text-center">Active Talents</span>
        <div className="flex flex-wrap justify-center gap-1.5 mb-1.5">
          {activeTalents.length > 0 ? (
            activeTalents.slice(0, 3).map(talent => (
              <span
                key={talent}
                className="px-2 py-0.5 rounded-full border font-bold text-xs bg-maineBlue text-seafoam border-maineBlue"
              >
                {talent}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">No talents yet. Cook to earn points!</span>
          )}
          {activeTalents.length > 3 && (
            <span className="px-2 py-0.5 rounded-full border font-bold text-xs text-gray-500">+{activeTalents.length - 3} more</span>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <button
            className="bg-seafoam text-maineBlue px-3 py-1 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors text-sm"
            onClick={() => setShowTalents(!showTalents)}
          >
            {showTalents ? 'Hide Talents' : 'View Talents'}
          </button>
          <button
            className="bg-seafoam text-maineBlue px-3 py-1 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors text-sm"
            onClick={() => setModalOpen(true)}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Talent Trees Collapsible Panel - Condensed */}
      {showTalents && (
        <div className="space-y-2">
          <div className="flex gap-2 justify-center flex-wrap">
            {Object.entries(talentTrees).map(([tree, talents]) => (
              <button
                key={tree}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  activeTab === tree ? 'bg-maineBlue text-seafoam' : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
                }`}
                onClick={() => setActiveTab(tree)}
              >
                {tree}
              </button>
            ))}
          </div>
          {Object.entries(talentTrees).map(([tree, talents]) => (
            <div
              key={tree}
              className={`bg-gray-100 p-3 rounded-lg border border-gray-200 ${
                activeTab === tree ? 'block' : 'hidden'
              }`}
            >
              <h3 className="text-lg font-bold mb-2 text-maineBlue">{tree}</h3>
              <div className="grid grid-cols-2 gap-2">
                {talents.map(talent => (
                  <div
                    key={talent.name}
                    className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                      talent.active
                        ? 'bg-maineBlue text-seafoam border-maineBlue'
                        : talent.cost <= talentPoints
                        ? 'bg-seafoam text-maineBlue border-seafoam hover:bg-maineBlue hover:text-seafoam'
                        : 'bg-gray-200 text-gray-500 border-gray-200'
                    }`}
                    onClick={() => handleUnlock(tree, talent.name, talent.cost)}
                  >
                    <div className="font-bold mb-0.5">{talent.name}</div>
                    <div className="text-[11px] opacity-90">{talent.description}</div>
                    <div className="text-[11px]">Cost: {talent.cost} 🧑‍🍳</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2 items-center">
        <button
          className="bg-seafoam text-maineBlue px-3 py-1 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors text-sm"
          onClick={() => setShowUpgradeModal(true)}
        >
          Manage Subscription
        </button>
        <button
          className="bg-lobsterRed text-weatheredWhite px-3 py-1 rounded font-bold hover:bg-red-700 transition-colors text-sm"
          onClick={async () => handleLogout()}
        >
          Sign Out
        </button>
        <button className="text-xs text-gray-500 hover:underline" onClick={() => setTermsModalOpen(true)}>
          Terms of Service
        </button>
      </div>

      {/* Edit Profile Modal */}
      {modalOpen && (
        <EditProfileModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={userProfile}
          onProfileUpdated={(updatedUserProfile) => {
            setUserProfile(updatedUserProfile);
            setModalOpen(false);
          }}
        />
      )}

      {/* Terms Modal */}
      {termsModalOpen && (
        <TermsModal
          open={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          content={termsContent}
        />
      )}

      {/* Subscription Modal */}
      {showUpgradeModal && (
        <PaymentModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

function EditProfileModal({ open, onClose, user, onProfileUpdated }: {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [experience, setExperience] = useState(user.experience || 'Beginner');
  const [dietary, setDietary] = useState<string[]>(user.dietary || []);
  const [cuisine, setCuisine] = useState<string[]>(user.cuisine || []);
  const [kitchenSetup, setKitchenSetup] = useState<string>(user.kitchenSetup || 'Apartment Kitchen');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || '');
      setExperience(user.experience || 'Beginner');
      setDietary(user.dietary || []);
      setCuisine(user.cuisine || []);
      setKitchenSetup(user.kitchenSetup || 'Apartment Kitchen');
    }
  }, [open, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = {
        name,
        email,
        avatar: avatar || null,
        experience,
        dietary,
        cuisine,
        kitchen_setup: kitchenSetup
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        onProfileUpdated({
          ...user,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          experience: data.experience,
          dietary: data.dietary,
          cuisine: data.cuisine,
          kitchenSetup: data.kitchen_setup
        });
        onClose();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg mx-auto p-6 bg-weatheredWhite rounded shadow-lg">
      <h2 className="text-2xl font-retro mb-4 text-maineBlue">Edit Profile</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Your Name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Your Email"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
        <input
          type="text"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Experience</label>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Professional">Professional</option>
        </select>
      </div>
      
      {/* Preferences Section - Directly under Cooking Experience */}
      <h3 className="text-lg font-retro mb-2 text-maineBlue">Preferences</h3>
      {/* Dietary Preferences - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Dietary</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={dietary.length > 0 ? dietary[0] : ''}
          onChange={(e) => {
            setDietary(e.target.value ? [e.target.value] : []);
          }}
        >
          <option value="">None</option>
          {[
            'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Low-Carb', 'Keto', 'Paleo', 'Nut-Free', 'Halal', 'Kosher'
          ].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Cuisine Preferences - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Cuisine</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={cuisine.length > 0 ? cuisine[0] : ''}
          onChange={(e) => {
            setCuisine(e.target.value ? [e.target.value] : []);
          }}
        >
          <option value="">None</option>
          {[
            'Italian', 'Thai', 'Seafood', 'Mexican', 'Japanese', 'Chinese', 'Indian', 'French', 'Greek', 'American', 'Spanish', 'Middle Eastern', 'Korean'
          ].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Kitchen Setup - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Kitchen Setup</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={kitchenSetup}
          onChange={(e) => {
            setKitchenSetup(e.target.value);
          }}
        >
          {[
            'Apartment Kitchen', 'Grilling Setup', 'Full Chef Station'
          ].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2 bg-seafoam text-maineBlue rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ open, onClose, children, className }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative ${className || ''}`}>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function TermsModal({ open, onClose, content }: {
  open: boolean;
  onClose: () => void;
  content: string;
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl mx-auto p-6 bg-weatheredWhite rounded shadow-lg max-h-[80vh] overflow-auto">
      <h2 className="text-2xl font-retro mb-4 text-maineBlue">Terms of Service</h2>
      <div className="mb-4 text-gray-700 whitespace-pre-line">
        {content}
      </div>
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-seafoam text-maineBlue rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default Profile;
