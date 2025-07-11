import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import EditProfileModal from './EditProfileModal';
import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';
import PaymentModal from './PaymentModal';

const Profile = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Error signing out: ' + error.message);
        return;
      }
      navigate('/signin');
    } catch (err) {
      alert('Unexpected error signing out.');
    }
  };

  const [subLoading, setSubLoading] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [customDietary, setCustomDietary] = useState('');
  const [customCuisine, setCustomCuisine] = useState('');
  const [dietarySaved, setDietarySaved] = useState(false);
  const [cuisineSaved, setCuisineSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { modalOpen, setModalOpen, termsContent } = useTermsModal();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          setError('You must be signed in to view your profile.');
          return;
        }

        // Fetch profile and XP in parallel for better performance
        const [profileResponse, xpResponse] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', authUser.id),
          supabase.from('user_xp').select('xp').eq('user_id', authUser.id)
        ]);

        if (profileResponse.error) {
          setError('Could not load your profile: ' + profileResponse.error.message);
          return;
        }

        const profile = profileResponse.data?.[0];
        if (!profile) {
          setError('No profile found. Please try signing out and in again.');
          return;
        }

        // Get XP if available, default to 0 if not
        const xp = xpResponse.data?.[0]?.xp ?? 0;

        setUser({
          ...profile,
          email: authUser.email,
          initials: (authUser.email || 'U').slice(0, 2).toUpperCase(),
          status: profile.is_premium ? 'Premium' : 'Active Account',
          joinDate: profile.created_at?.slice(0, 10) ?? '',
          trialEnds: profile.trial_ends_at?.slice(0, 10) ?? '',
          xp
        });

        setDietary(profile.dietary || []);
        setCuisine(profile.cuisine || []);
        setDietarySaved(true);
        setCuisineSaved(true);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading profile...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
      {/* User Details Card */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-seafoam flex items-center justify-center text-4xl font-retro text-maineBlue shadow-lg mb-2 border-4 border-maineBlue">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            user.initials
          )}
        </div>
        <div className="text-xl font-retro text-maineBlue mb-1">{user.name}</div>
        <div className="text-sm text-gray-600 mb-1">{user.email}</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-lobsterRed text-weatheredWhite px-3 py-1 rounded-full text-xs font-bold">{user.status}</span>
          <span className="text-xs text-gray-500">Joined: {user.joinDate}</span>
        </div>
        {user.status !== 'Premium' && user.trialEnds && (
          <div className="text-xs text-gray-500">
            Account active since: <span className="font-bold text-seafoam">{user.trialEnds}</span>
          </div>
        )}
        <button
          className="mt-4 px-4 py-2 rounded bg-seafoam text-maineBlue font-bold hover:bg-maineBlue hover:text-seafoam transition-colors"
          onClick={() => setShowEdit(true)}
        >
          Edit Profile
        </button>
        <EditProfileModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          user={user}
          onProfileUpdated={setUser}
        />
      </div>

      <h2 className="text-xl font-retro mb-4">Profile Preferences</h2>
      {/* Dietary Preferences - Pick List */}
      <div className="mb-6">
        <span className="block mb-1 font-semibold">Dietary Preferences</span>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Low-Carb', 'Keto', 'Paleo', 'Nut-Free', 'Halal', 'Kosher'
          ].map(option => (
            <button
              key={option}
              type="button"
              className={`px-3 py-1 rounded-full border font-bold text-xs transition-colors
                ${dietary.includes(option) && dietarySaved ? 'bg-maineBlue text-seafoam border-maineBlue' :
                  dietary.includes(option) ? 'bg-seafoam text-maineBlue border-seafoam' :
                  'bg-weatheredWhite text-maineBlue border-seafoam hover:bg-seafoam hover:text-maineBlue'}`}
              onClick={() => {
                setDietary(prev => prev.includes(option) ? prev.filter(d => d !== option) : [...prev, option]);
                setDietarySaved(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold mt-2 hover:bg-maineBlue hover:text-seafoam transition-colors"
          onClick={async () => {
            const { error } = await supabase.from('profiles').update({ dietary }).eq('id', user.id);
            if (!error) setDietarySaved(true);
          }}
        >
          Save Dietary Preferences
        </button>
        {dietarySaved && <div className="text-seafoam font-bold text-sm mt-1">Saved!</div>}
      </div>

      {/* Cuisine Preferences - Pick List */}
      <div className="mb-4">
        <span className="block mb-1 font-semibold">Cuisine Preferences</span>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            'Italian', 'Thai', 'Seafood', 'Mexican', 'Japanese', 'Chinese', 'Indian', 'French', 'Greek', 'American', 'Spanish', 'Middle Eastern', 'Korean'
          ].map(option => (
            <button
              key={option}
              type="button"
              className={`px-3 py-1 rounded-full border font-bold text-xs transition-colors
                ${cuisine.includes(option) && cuisineSaved ? 'bg-maineBlue text-seafoam border-maineBlue' :
                  cuisine.includes(option) ? 'bg-seafoam text-maineBlue border-seafoam' :
                  'bg-weatheredWhite text-maineBlue border-seafoam hover:bg-seafoam hover:text-maineBlue'}`}
              onClick={() => {
                setCuisine(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]);
                setCuisineSaved(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold mt-2 hover:bg-maineBlue hover:text-seafoam transition-colors"
          // TODO: Implement Stripe Customer Portal for cancellation in the future.
          onClick={async () => {
            const { error } = await supabase.from('profiles').update({ cuisine }).eq('id', user.id);
            if (!error) setCuisineSaved(true);
          }}
        >
          Save Cuisine Preferences
        </button>
        {cuisineSaved && <div className="text-seafoam font-bold text-sm mt-1">Saved!</div>}
      </div>

      {/* Account Actions */}
      <div className="mt-8 flex flex-col gap-2 items-center">
        <button
          className="bg-maineBlue text-weatheredWhite px-4 py-2 rounded font-bold w-full max-w-xs hover:bg-seafoam hover:text-maineBlue transition-colors disabled:opacity-60"
          onClick={async () => {
            setSubLoading(true);
            setShowSubModal(true);
            setTimeout(() => setSubLoading(false), 1000);
          }}
          disabled={subLoading}
        >
          Manage Subscription
        </button>
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold w-full max-w-xs hover:bg-seafoam hover:text-maineBlue transition-colors"
          onClick={() => setShowCancelModal(true)}
        >
          Cancel Subscription
        </button>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-weatheredWhite rounded-lg shadow-lg p-8 max-w-sm w-full relative flex flex-col items-center">
              <button className="absolute top-2 right-2 text-lobsterRed font-bold text-xl" onClick={() => setShowCancelModal(false)}>✕</button>
              <h3 className="font-retro text-lg mb-4 text-lobsterRed">Cancel Subscription</h3>
              {cancelConfirmed ? (
                <div className="text-center text-maineBlue text-lg font-retro">Your cancellation request has been received.<br/>Your account will be canceled within 24 hours.</div>
              ) : (
                <>
                  <div className="mb-4 text-center text-maineBlue">Your account will be canceled within 24 hours.<br/>You will receive an email confirmation.</div>
                  <button
                    className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold w-full mt-2 hover:bg-seafoam hover:text-maineBlue transition-colors"
                    onClick={async () => {
                      setCancelLoading(true);
                      try {
                        await fetch('/.netlify/functions/cancel-subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: user?.email }),
                        });
                        setCancelConfirmed(true);
                      } catch (e) {
                        alert('Failed to send cancellation request. Please try again.');
                      } finally {
                        setCancelLoading(false);
                      }
                    }}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Processing...' : 'Confirm Cancel'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Manage Subscription Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-weatheredWhite rounded-lg shadow-lg p-8 max-w-sm w-full relative flex flex-col items-center">
              <button className="absolute top-2 right-2 text-lobsterRed font-bold text-xl" onClick={() => setShowSubModal(false)}>✕</button>
              <h3 className="font-retro text-lg mb-4">Manage Subscription</h3>
              {subLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[100px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-maineBlue mb-4"></div>
                  <div className="text-lg font-retro mb-2">Loading portal...</div>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-center text-maineBlue">Manage your PorkChop subscription below:</div>
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors"
                      onClick={() => setShowUpgradeModal(true)}
                    >
                      Upgrade to Yearly
                    </button>
                    <PaymentModal
                      open={showUpgradeModal}
                      onClose={() => setShowUpgradeModal(false)}
                      plan="yearly"
                      email={user?.email}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Account Actions: Sign Out and TOS */}
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold w-full max-w-xs hover:bg-maineBlue hover:text-seafoam transition-colors mt-4"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
        <span className="text-xs text-navy underline cursor-pointer hover:text-lobsterRed" onClick={() => setModalOpen(true)}>Terms of Service & Privacy Policy</span>
        <TermsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} termsContent={termsContent} />
      </div>
    </div>
  );
};

export default Profile;
