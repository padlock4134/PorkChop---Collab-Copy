import { useCallback } from 'react';
import { useLevelProgressContext } from '../components/NavBar';
import { awardXP } from '../services/xpService';
import { isSessionValid } from '../api/userSession';

export const useXP = (userId: string) => {
  const { refreshXP } = useLevelProgressContext();

  const awardXPWithRefresh = useCallback(async (xpAmount: number, action: string) => {
    const sessionValid = await isSessionValid();
    if (!sessionValid || !userId) return false;
    
    const success = await awardXP(userId, xpAmount, action);
    if (success) {
      refreshXP();
    }
    return success;
  }, [refreshXP]);

  return { awardXP: awardXPWithRefresh };
};
