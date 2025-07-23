import React, { useState, useEffect } from 'react';
import { FireIcon, ShieldCheckIcon, StarIcon, TrophyIcon, SparklesIcon, CakeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
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
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Store selected talents in state; permanent for this session
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('Cast Iron Champion');
  const [showTalents, setShowTalents] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [kitchenSetup, setKitchenSetup] = useState<string>('Apartment Kitchen');

  const { modalOpen: termsModalOpen, setModalOpen: setTermsModalOpen, termsContent } = useTermsModal();

  // 9 talents per tree, unlock at 10, 14, 25, 30, 36, 42, 48, 55, 60
  const talentTrees = {
    'Cast Iron Champion': [
      { name: 'Sear Savant', icon: FireIcon, unlockLevel: 10, description: 'Perfect searing technique for meats and veggies.' },
      { name: 'Heat Control', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Master even heat for flawless results.' },
      { name: 'Iron Will', icon: StarIcon, unlockLevel: 25, description: 'Reduces chance of burning food.' },
      { name: 'Seasoned Veteran', icon: TrophyIcon, unlockLevel: 30, description: 'Enhances seasoning absorption.' },
      { name: 'Rustproof', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Prevents cast iron from rusting.' },
      { name: 'Heavy Hitter', icon: FireIcon, unlockLevel: 42, description: 'Extra sear power for thick cuts.' },
      { name: 'Surface Sage', icon: StarIcon, unlockLevel: 48, description: 'Non-stick mastery for delicate foods.' },
      { name: 'Ironclad', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Cast iron lasts a lifetime.' },
      { name: 'Iron Chef', icon: TrophyIcon, unlockLevel: 60, description: 'Ultimate cast iron mastery (Capstone).' },
    ],
    'Grilling Heavy Weight': [
      { name: 'Flame Tamer', icon: FireIcon, unlockLevel: 10, description: 'Control over open flames.' },
      { name: 'Smoke Master', icon: SparklesIcon, unlockLevel: 14, description: 'Perfect smoky flavors every time.' },
      { name: 'Char Champion', icon: StarIcon, unlockLevel: 25, description: 'Expert in char marks and crust.' },
      { name: 'Grill Marks', icon: StarIcon, unlockLevel: 30, description: 'Signature grill patterns.' },
      { name: 'BBQ Buff', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Increased BBQ efficiency.' },
      { name: 'Pit Boss', icon: TrophyIcon, unlockLevel: 42, description: 'Command any grill with ease.' },
      { name: 'Coal Whisperer', icon: FireIcon, unlockLevel: 48, description: 'Perfect coal management.' },
      { name: 'Grill Guardian', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Grill never fails.' },
      { name: 'BBQ God', icon: TrophyIcon, unlockLevel: 60, description: 'Legendary grilling skills (Capstone).' },
    ],
    'Baking Warlock': [
      { name: 'Dough Whisperer', icon: CakeIcon, unlockLevel: 10, description: 'Perfect dough consistency.' },
      { name: 'Oven Oracle', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Precise baking timing.' },
      { name: 'Proofing Pro', icon: StarIcon, unlockLevel: 25, description: 'Expert in proofing dough.' },
      { name: 'Pastry Pro', icon: StarIcon, unlockLevel: 30, description: 'Expert in pastries.' },
      { name: 'Crust Conjurer', icon: CakeIcon, unlockLevel: 36, description: 'Flawless crusts every time.' },
      { name: 'Bake Sense', icon: SparklesIcon, unlockLevel: 42, description: 'Sense when baking is perfect.' },
      { name: 'Filling Fiend', icon: CakeIcon, unlockLevel: 48, description: 'Master of sweet and savory fillings.' },
      { name: 'Bread Buffoon', icon: AcademicCapIcon, unlockLevel: 55, description: 'Master of all baked goods.' },
      { name: 'Baking Warlock', icon: TrophyIcon, unlockLevel: 60, description: 'Legendary baking magic (Capstone).' },
    ],
  };

  const handleLogout = async () => {
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  // Handle permanent selection of a talent (cannot be undone)
  const handleSelectTalent = (talentName: string) => {
    if (!selectedTalents.includes(talentName)) {
      setSelectedTalents(prev => [...prev, talentName]);
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user) {
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
        
        // Map the database fields to the component's state
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp,
          // Map kitchen_setup from database to kitchenSetup in state
          kitchenSetup: profile.kitchen_setup || 'Apartment Kitchen',
          // Ensure these arrays are never undefined
          dietary: profile.dietary || [],
          cuisine: profile.cuisine || []
        });

        // Also update the local kitchenSetup state
        setKitchenSetup(profile.kitchen_setup || 'Apartment Kitchen');

        // Calculate talent points based on XP
        const calculatedTalentPoints = Math.floor(xp / 100);
        setTalentPoints(calculatedTalentPoints);
        
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
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      const points = Math.floor(userProfile.xp / 100);
      setTalentPoints(points);
      // No more mock activeTalents logic
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
      {/* Header: User Name with Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-maineBlue rounded-full flex items-center justify-center text-seafoam font-bold text-xl overflow-hidden shrink-0">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{userProfile.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <h1 className="text-3xl font-retro text-maineBlue">
            {userProfile.name}
          </h1>
        </div>
        {subscription && (
          <span className={`px-2 py-0.5 text-xs rounded-full mt-2 ${
            subscription.plan === 'yearly'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'}
          </span>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-block bg-sand text-gray-800 px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors"
        >
          Edit Profile
        </button>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="inline-block bg-sand text-gray-800 px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors"
        >
          Manage Subscription
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md font-medium hover:bg-gray-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {/* Details Row */}
      <div className="flex items-start mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-retro mb-2 text-center">My Culinary Journey</h2>
          {/* Active Talents and Talent Trees - Compact and Centered Buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap justify-center gap-1.5 mb-1.5">
              {selectedTalents.length > 0 &&
                selectedTalents.slice(0, 3).map(talent => (
                  <span
                    key={talent}
                    className="px-2 py-0.5 rounded-full border font-bold text-xs bg-maineBlue text-seafoam border-maineBlue"
                  >
                    {talent}
                  </span>
                ))}
              {selectedTalents.length > 3 && (
                <span className="px-2 py-0.5 rounded-full border font-bold text-xs text-gray-500">+{selectedTalents.length - 3} more</span>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="font-semibold text-xs">Show Talents</span>
                <span className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                  <input
                    type="checkbox"
                    checked={showTalents}
                    onChange={() => setShowTalents(val => !val)}
                    className="sr-only peer"
                    id="talent-toggle"
                  />
                  <span
                    className="block w-10 h-6 bg-gray-300 rounded-full shadow-inner peer-checked:bg-maineBlue transition-colors duration-200"
                  ></span>
                  <span
                    className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-4 shadow"
                  ></span>
                </span>
              </label>
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
                <div key={tree} className={activeTab === tree ? 'block' : 'hidden'}>
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-maineBlue">{tree}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {talents.map(talent => {
                        // Calculate if talent is unlocked by level
                        const xp = userProfile?.xp || 0;
                        const level = Math.floor(xp / 100) + 1;
                        const unlocked = level >= talent.unlockLevel;
                        const selected = selectedTalents.includes(talent.name);
                        const Icon = talent.icon;
                        return (
                          <div
                            key={talent.name}
                            className={`relative group p-2 rounded border text-xs flex flex-col items-center justify-center transition-colors min-h-[96px] w-full ${
                              selected
                                ? 'bg-green-600 text-white border-green-700' // selected
                                : unlocked
                                  ? 'bg-maineBlue text-seafoam border-maineBlue' // unlocked, not selected
                                  : 'bg-gray-200 text-gray-500 border-gray-200 opacity-60' // locked
                            }`}
                          >
                            <Icon className={`w-8 h-8 mb-1 ${!unlocked ? 'opacity-40 grayscale' : ''} ${selected ? 'drop-shadow-lg' : ''}`} />
                            <div className="font-bold mb-0.5 text-center">{talent.name}</div>
                            {/* Tooltip on hover */}
                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-44 border border-gray-300">
                              <strong>{talent.name}</strong>
                              <div className="mt-1">{talent.description}</div>
                              <div className="mt-1 text-xs text-gray-500">Unlocks at level {talent.unlockLevel}</div>
                            </div>
                            {/* Select button if unlocked and not selected */}
                            {!selected && unlocked && (
                              <button
                                className="mt-1 px-2 py-0.5 rounded bg-seafoam text-maineBlue border border-maineBlue font-bold text-xs hover:bg-maineBlue hover:text-seafoam transition-colors"
                                onClick={() => handleSelectTalent(talent.name)}
                                disabled={selected}
                              >
                                Select
                              </button>
                            )}
                            {/* Show 'Selected' if selected */}
                            {selected && (
                              <span className="mt-1 px-2 py-0.5 rounded bg-green-700 text-white text-xs font-bold">Selected</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <EditProfileModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        user={userProfile}
        onProfileUpdated={(updatedUser) => {
          setUserProfile(updatedUser);
          setModalOpen(false);
        }}
      />
      
      <PaymentModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={user?.id || ''}
        plan="monthly"
      />
      
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        content={termsContent}
      />
    </div>
  );
};

// EditProfileModal component moved outside of Profile component
function EditProfileModal({ 
  open, 
  onClose, 
  user,
  onProfileUpdated 
}: {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [experience, setExperience] = useState(user.experience || 'Beginner');
  const [dietary, setDietary] = useState<string[]>(user.dietary || []);
  const [cuisine, setCuisine] = useState<string[]>(user.cuisine || []);
  const [kitchenSetup, setKitchenSetup] = useState<string>(user.kitchenSetup || 'Apartment Kitchen');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
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
        experience,
        dietary,
        cuisine,
        kitchen_setup: kitchenSetup // Make sure this matches the database column name
      };

      // First update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Then fetch the updated profile to ensure we have the latest data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (updatedUser) {
        // Update the local state with the fresh data from the database
        onProfileUpdated({
          ...user,
          name: updatedUser.name,
          email: updatedUser.email,
          experience: updatedUser.experience,
          dietary: updatedUser.dietary || [],
          cuisine: updatedUser.cuisine || [],
          kitchenSetup: updatedUser.kitchen_setup || 'Apartment Kitchen'
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
      
      {/* Preferences Section - Directly under Cooking Experience */}
      <h3 className="text-lg font-retro mb-2 text-maineBlue">Preferences</h3>
      {/* Cooking Experience - Single-Select Dropdown */}
      <div className="mb-3">
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
          title={
            kitchenSetup === 'Apartment Kitchen' ? 'Basic stovetop and oven' :
            kitchenSetup === 'Outdoor Grilling' ? 'Grill and basic prep tools' :
            kitchenSetup === 'Home Chef' ? 'Standard equipment + some specialty tools' :
            kitchenSetup === 'Minimalist' ? 'Just the basics' :
            kitchenSetup === 'Dorm Life' ? 'Microwave, mini-fridge, and basic appliances' :
            'Professional setup with all equipment'
          }
        >
          {[
            'Apartment Kitchen',
            'Outdoor Grilling',
            'Home Chef',
            'Minimalist',
            'Dorm Life',
            'Full Chef\'s Kitchen'
          ].map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {kitchenSetup === 'Apartment Kitchen' && 'Basic stovetop and oven'}
          {kitchenSetup === 'Outdoor Grilling' && 'Grill and basic prep tools'}
          {kitchenSetup === 'Home Chef' && 'Standard equipment + some specialty tools'}
          {kitchenSetup === 'Minimalist' && 'Just the basics'}
          {kitchenSetup === 'Dorm Life' && 'Microwave, mini-fridge, and basic appliances'}
          {kitchenSetup === 'Full Chef\'s Kitchen' && 'Professional setup with all equipment'}
        </p>
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

// Modal component
type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative ${className || ''}`}>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// TermsModal component
type TermsModalProps = {
  open: boolean;
  onClose: () => void;
  content: string;
};

function TermsModal({ open, onClose, content }: TermsModalProps) {
  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      className="max-w-2xl mx-auto p-6 bg-weatheredWhite rounded shadow-lg max-h-[80vh] overflow-auto"
    >
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
