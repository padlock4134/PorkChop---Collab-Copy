// Anthropic Claude Haiku API integration for Chef Freddie
import { supabase } from './supabaseClient';
import { getCurrentUserId } from './userSession';

export async function askChefFreddie(prompt: string): Promise<string> {
  // --- Chat limit logic ---
  const userId = await getCurrentUserId();
  if (!userId) {
    return 'Error: User not found. Please sign in again.';
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('chat_count, last_chat_date')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    return 'Error fetching user profile. Please try again.';
  }
  const today = new Date().toISOString().slice(0, 10);
  let chatCount = profile.chat_count || 0;
  let lastChatDate = profile.last_chat_date ? profile.last_chat_date.toString().slice(0, 10) : null;
  if (lastChatDate === today) {
    if (chatCount >= 15) {
      return 'You have reached your daily limit of 15 chats. Please come back tomorrow!';
    }
    await supabase.from('profiles').update({ chat_count: chatCount + 1 }).eq('id', userId);
  } else {
    await supabase.from('profiles').update({ chat_count: 1, last_chat_date: today }).eq('id', userId);
  }
  // --- End chat limit logic ---

  const systemPrompt = `You are Chef Freddie, a friendly and knowledgeable AI chef assistant for the PorkChop cooking app.
  You help users with recipe suggestions, cooking tips, and kitchen equipment advice.
  You know about common kitchen equipment like pots, pans, knives, cutting boards, mixers, blenders, etc.
  When discussing recipes, you always mention what equipment is needed.
  Keep responses friendly but concise.`;
  // Use Netlify proxy for Anthropic API (no direct key in frontend)
  const response = await fetch('/.netlify/functions/anthropic-proxy', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'chef',
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: [{ role: 'user', content: `You are Chef Freddie, a friendly and knowledgeable AI chef assistant. Help me with: ${prompt}` }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  // Claude API returns an array of content blocks
  return data.content?.[0]?.text || 'Sorry, I could not generate a response.';
}
