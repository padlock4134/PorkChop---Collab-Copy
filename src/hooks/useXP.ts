import { useCallback } from 'react';
import { useLevelProgressContext } from '../components/NavBar';
import { awardXP } from '../services/xpService';
import { supabase } from '../api/supabaseClient';

export const useXP = () => {
  const { refreshXP } = useLevelProgressContext();

  const awardXPWithRefresh = useCallback(async (xpAmount: number, action: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const success = await awardXP(user.id, xpAmount, action);
    if (success) {
      refreshXP();
    }
    return success;
  }, [refreshXP]);

  return { awardXP: awardXPWithRefresh };
};
