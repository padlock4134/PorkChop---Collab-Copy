import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  AuthStatus,
  redirectToLogout,
  SessionResponse,
  useWristbandAuth,
  WristbandAuthProvider
} from '@wristband/react-client-auth';

import NavBar from './components/NavBar';
import MyKitchen from './modules/MyKitchen';
import MyCookBook from './modules/MyCookBook';
import ChefsCorner from './modules/ChefsCorner';
import CulinarySchool from './modules/CulinarySchool';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import ChefFreddieWidget from './components/ChefFreddieWidget';
import { FreddieProvider } from './components/FreddieContext';
import { RecipeProvider } from './components/RecipeContext';
import LandingPage from './components/LandingPage';
import './components/LandingPage.css';
import SupabaseProvider, { useSupabase } from './components/SupabaseProvider';
import type { WristbandSessionMetadata } from './types/session-types';
import { setSupabaseJwt } from './api/supabaseClient';
import PlanSelectionModal from './components/PlanSelectionModal';
import PaymentModal from './components/PaymentModal';

const PUBLIC_ROUTES = ['/'];
const devOnlyPaymentBypass = (import.meta as any).env.VITE_PORKCHOP_DEV_ONLY_PAYMENT_BYPASS === 'true';

const AppRoutes = () => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  const navigate = useNavigate();

  const { authStatus} = useWristbandAuth();
  const { user, isLoading, isPaid } = useSupabase();

  // We have this check here because the SupabaseProvider isLoading flag will never flip to false
  // in the event the initial Wristband auth session check fails. This status gets set to UNAUTHENTICATED
  // just once upfront right after the auth isLoading is set to false.
  useEffect(() => {
    if (authStatus === AuthStatus.UNAUTHENTICATED) {
      navigate('/');
    }
  }, [authStatus]);

  // Only show loading for protected routes, skip for landing page
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated on protected route, redirect immediately
  if (!isLoading && !user && !isPublicRoute) {
    navigate('/');
    return null;
  }

  // Paywall check - hard gate
  if (!isLoading && user && !isPaid && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <PlanSelectionModal
          open={!showPlanModal}
          onClose={() => redirectToLogout('/.netlify/functions/auth-logout')}
          onSelectPlan={plan => {
            setSelectedPlan(plan);
            setShowPlanModal(false);
            setShowPaymentModal(true);
          }}
        />
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan || 'monthly'}
          userId={user.id}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      {!isPublicRoute && <NavBar />}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        <Routes>
          {/* Protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-kitchen" element={<MyKitchen />} />
          <Route path="/my-cookbook" element={<MyCookBook />} />
          <Route path="/chefs-corner" element={<ChefsCorner />} />
          <Route path="/culinary-school" element={<CulinarySchool />} />
          <Route path="/profile" element={<Profile />} />
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </main>
      {!isPublicRoute && <ChefFreddieWidget />}
    </div>
  );
};

const App = () => {
  return (
    <WristbandAuthProvider<WristbandSessionMetadata>
      loginUrl='/.netlify/functions/auth-login'
      logoutUrl='/.netlify/functions/auth-logout'
      sessionUrl='/.netlify/functions/auth-session'
      disableRedirectOnUnauthenticated={true}
      onSessionSuccess={(sessionResponse: SessionResponse) => {
        // Before isAuthenticated is set to true, set the Supabase token in the client
        // so it can be used for all authenticated Supabase requests.
        const { metadata } = sessionResponse;
        const { supabaseToken } = metadata as WristbandSessionMetadata;
        setSupabaseJwt(supabaseToken);
      }}
    >
      <SupabaseProvider devOnlyPaymentBypass={devOnlyPaymentBypass}>
        <RecipeProvider>
          <FreddieProvider>
            <AppRoutes />
          </FreddieProvider>
        </RecipeProvider>
      </SupabaseProvider>
    </WristbandAuthProvider>
  );
};

export default App;
