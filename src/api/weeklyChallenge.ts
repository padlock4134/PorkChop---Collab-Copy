// Weekly Challenge XP/badge claim logic using Supabase
// Prevents double-claiming by checking for an existing claim for the current user and week
import { supabase } from './supabaseClient';
import { awardBadge } from '../utils/badges';

interface ClaimChallengeParams {
  userId: string;
  challengeId: string;
  weekNumber: number;
  xp: number;
  badge: string;
  proofPhotoPath?: string;
}

interface ClaimChallengeResult {
  alreadyClaimed: boolean;
}

export async function claimWeeklyChallenge({
  userId,
  challengeId,
  weekNumber,
  xp,
  badge,
  proofPhotoPath,
}: ClaimChallengeParams): Promise<ClaimChallengeResult> {
  // Check if already claimed
  const { data: existingClaim } = await supabase
    .from('weekly_challenge_claims')
    .select()
    .eq('user_id', userId)
    .eq('week_number', weekNumber)
    .single();

  if (existingClaim) {
    return { alreadyClaimed: true };
  }

  // Insert claim with photo proof
  const { error: claimError } = await supabase
    .from('weekly_challenge_claims')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      week_number: weekNumber,
      proof_photo: proofPhotoPath,
      claimed_at: new Date().toISOString(),
    });

  if (claimError) throw claimError;

  // Award XP and badge
  const { error: xpError } = await supabase.rpc('increment_user_xp', {
    user_id: userId,
    xp_amount: xp,
  });

  if (xpError) throw xpError;

  // Award badge using the utility function
  const badgeAwarded = await awardBadge(userId, badge);
  if (!badgeAwarded) {
    throw new Error('Failed to award badge');
  }

  return { alreadyClaimed: false };
}
