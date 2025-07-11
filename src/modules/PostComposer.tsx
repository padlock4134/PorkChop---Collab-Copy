import React, { useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';

const PostComposer = () => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshXP } = useLevelProgressContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Check if this is a recipe share (simplified check for recipe keywords)
      const isRecipeShare = /recipe|ingredients?|instructions?|method|steps|serves|prep time|cook time/i.test(input);
      
      // In a real app, you would upload the image and create the post here
      // For now, we'll just simulate a successful post
      
      if (isRecipeShare) {
        // Award XP for sharing a recipe
        const { error } = await supabase.rpc('increment_user_xp', {
          user_id: user.id,
          xp_amount: XP_REWARDS.RECIPE_SHARE
        });
        
        if (!error) {
          // Log the XP award
          await supabase.from('xp_logs').insert([
            {
              user_id: user.id,
              xp_amount: XP_REWARDS.RECIPE_SHARE,
              action: 'recipe_share',
              metadata: { post_preview: input.substring(0, 100) + '...' }
            }
          ]);
          
          refreshXP();
        }
      }
      
      // Reset form
      setInput('');
      setImage(null);
      
      // Show success message or update UI
      alert('Post shared successfully!' + (isRecipeShare ? ' +' + XP_REWARDS.RECIPE_SHARE + ' XP for sharing a recipe!' : ''));
      
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chefs-corner-composer bg-weatheredWhite p-4 rounded shadow mb-6">
      <textarea
        className="w-full border rounded p-2 mb-2"
        placeholder="Share a tip, story, or recipe..."
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isSubmitting}
      />
      <div className="flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const files = e.target.files;
            if (files && files[0]) {
              setImage(files[0]);
            } else {
              setImage(null);
            }
          }}
          disabled={isSubmitting}
        />
        <button 
          type="submit"
          className={`px-4 py-2 rounded font-bold transition-colors ${
            isSubmitting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
};

export default PostComposer;
