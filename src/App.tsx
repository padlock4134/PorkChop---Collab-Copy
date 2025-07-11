import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import MyKitchen from './modules/MyKitchen';
import MyCookBook from './modules/MyCookBook';
import ChefsCorner from './modules/ChefsCorner';
import CulinarySchool from './modules/CulinarySchool';
import Profile from './components/Profile';
import SignUp from './modules/SignUp';
import SignIn from './modules/SignIn';
import Dashboard from './components/Dashboard';
import ChefFreddieWidget from './components/ChefFreddieWidget';
import { FreddieProvider } from './components/FreddieContext';
import { RecipeProvider } from './components/RecipeContext';
import LandingPage from './components/LandingPage';
import './components/LandingPage.css';
import AuthProvider, { useAuth } from './components/AuthProvider';
import ConfirmEmail from './modules/ConfirmEmail';

const AppRoutes = () => {
  const location = useLocation();
  const hideOnPublic = ['/', '/signup', '/signin', '/confirm-email'].includes(location.pathname);
  const { user, isLoading } = useAuth();

  // Only show loading for protected routes, skip for landing page
  if (isLoading && !hideOnPublic) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      {!hideOnPublic && <NavBar />}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        <Routes>
          <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          {/* Protected routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/my-kitchen" element={user ? <MyKitchen /> : <Navigate to="/signin" />} />
          <Route path="/my-cookbook" element={user ? <MyCookBook /> : <Navigate to="/signin" />} />
          <Route path="/chefs-corner" element={user ? <ChefsCorner /> : <Navigate to="/signin" />} />
          <Route path="/culinary-school" element={user ? <CulinarySchool /> : <Navigate to="/signin" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/signin" />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </main>
      {!hideOnPublic && <ChefFreddieWidget />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <RecipeProvider>
        <FreddieProvider>
          <AppRoutes />
        </FreddieProvider>
      </RecipeProvider>
    </AuthProvider>
  );
};

export default App;
