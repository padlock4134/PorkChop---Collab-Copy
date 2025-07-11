import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabaseClient';
import { awardXP } from '../services/xpService';
import { XP_REWARDS } from '../services/xpService';

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

// Hook for components to easily access auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get the current session from Supabase
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        
        const { data } = await supabase.auth.getSession();
        
        if (data && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Check and award daily XP on initial login
          checkAndAwardDailyXP(data.session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          // Check and award daily XP on auth state change (e.g., login)
          checkAndAwardDailyXP(newSession.user.id);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Award daily login XP if it's a new day
  const checkAndAwardDailyXP = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if XP was already awarded today
      const { data: existingLog } = await supabase
        .from('xp_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('action', 'daily_login')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (!existingLog) {
        // Award daily login XP
        await awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'daily_login');
      }
    } catch (error) {
      console.error('Error awarding daily XP:', error);
    }
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
