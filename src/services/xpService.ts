import { supabase } from '../api/supabaseClient';

// Standard XP rewards
export const XP_REWARDS = {
  DAILY_LOGIN: 10,
  RECIPE_SAVE: 20,
  RECIPE_COMPLETE: 50,
  LESSON_COMPLETE: 30,
  RECIPE_SHARE: 20,
  CHALLENGE_COMPLETE: 100,
  MEAL_PLAN_CREATE: 25,
  RECIPE_REVIEW: 15,
  PROFILE_COMPLETE: 20
} as const;

// Safe XP award function that won't break if the database function doesn't exist
export const awardXP = async (userId: string, xpAmount: number, action: string) => {
  try {
    // First try the RPC function (if it exists)
    const { error: rpcError } = await supabase.rpc('increment_user_xp', {
      p_user_id: userId,
      p_xp_amount: xpAmount  
    }).single();

    // If RPC fails, fall back to direct update
    if (rpcError) {
      console.warn('RPC increment_user_xp not available, falling back to direct update');
      
      // Get current XP
      const { data: currentData, error: fetchError } = await supabase
        .from('user_xp')
        .select('xp')
        .eq('user_id', userId)
        .single();

      if (fetchError && !currentData) {
        // If no record exists, create one
        const { error: insertError } = await supabase
          .from('user_xp')
          .insert([{ user_id: userId, xp: xpAmount }]);
          
        if (insertError) throw insertError;
      } else {
        // Update existing record
        const currentXP = currentData?.xp || 0;
        const { error: updateError } = await supabase
          .from('user_xp')
          .update({ xp: currentXP + xpAmount })
          .eq('user_id', userId);
          
        if (updateError) throw updateError;
      }
    }

    // Log the XP award (optional, won't break if table doesn't exist)
    try {
      await supabase.from('xp_logs').insert({
        user_id: userId,
        xp_amount: xpAmount,
        action: action,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Could not log XP award:', logError);
      // Not critical, continue
    }
    
    return true;
  } catch (error) {
    console.error('Error in awardXP:', error);
    return false;
  }
};

// Safe function to get current XP
export const getCurrentXP = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_xp')
      .select('xp')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 0;
    return data.xp || 0;
  } catch (error) {
    console.error('Error getting XP:', error);
    return 0;
  }
};
