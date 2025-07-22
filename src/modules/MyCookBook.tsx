import React, { useState, useEffect } from 'react';
import { useFreddieContext } from '../components/FreddieContext';
import { useRecipeContext } from '../components/RecipeContext';
import { useNavigate } from 'react-router-dom';
import { fetchCookbook, removeRecipeFromCookbook } from './cookbookSupabase';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';

// Chef quotes (production-ready)
const chefQuotes = [
  { chef: 'Julia Child', quote: 'People who love to eat are always the best people.' },
  { chef: 'Gordon Ramsay', quote: 'Cooking is about passion, so it may look slightly temperamental in a way that it\'s too assertive to the naked eye.' },
  { chef: 'Alice Waters', quote: 'Let things taste of what they are.' },
  { chef: 'Anthony Bourdain', quote: 'Your body is not a temple, it\'s an amusement park. Enjoy the ride.' },
  { chef: 'Massimo Bottura', quote: 'Cooking is an act of love, a gift, a way of sharing with others the little secrets — "piccoli segreti" — that are simmering on the burners.' },
  { chef: 'Thomas Keller', quote: 'A recipe has no soul. You as the cook must bring soul to the recipe.' },
  { chef: 'Ina Garten', quote: 'Food is not about impressing people. It\'s about making them feel comfortable.' },
  { chef: 'Ferran Adrià', quote: 'The more you know, the more you can create. There\'s no end to imagination in the kitchen.' },
  { chef: 'Emeril Lagasse', quote: 'Kick it up a notch!' },
  { chef: 'Wolfgang Puck', quote: 'Cooking is like painting or writing a song.' },
  { chef: 'Rene Redzepi', quote: 'Innovation, being avant-garde, is always polemic.' },
  { chef: 'Heston Blumenthal', quote: 'Question everything. No idea is a bad idea.' },
  { chef: 'Alain Ducasse', quote: 'Cooking is a way of giving.' },
  { chef: 'Rachel Ray', quote: 'Good food and a warm kitchen are what make a house a home.' },
  { chef: 'Pierre Gagnaire', quote: 'Cooking is not difficult. Everyone has taste, even if they don\'t realize it.' },
  { chef: 'Paul Bocuse', quote: 'Cooking is not just eating energy. It\'s an experience.' },
  { chef: 'Joël Robuchon', quote: 'The simpler the food, the more exceptional it can be.' },
  { chef: 'Marco Pierre White', quote: 'Mother Nature is the true artist and our job as cooks is to allow her to shine.' },
  { chef: 'Jamie Oliver', quote: 'Real food doesn\'t have ingredients, real food is ingredients.' },
  { chef: 'Nigella Lawson', quote: 'I have always believed that what goes on in the kitchen should stay in the kitchen.' }
];

export function getChefQuoteOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const idx = dayOfYear % chefQuotes.length;
  return chefQuotes[idx];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  photo?: string;
  ingredients?: string[];
  instructions?: string;
  equipment?: string[];
}

const MyCookBook = () => {
  const { setSelectedRecipe } = useRecipeContext();
  const navigate = useNavigate();
  const [recipes, setLocalRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recipesPerPage] = useState(2); // Changed from 6 to 2 to show just 1 row of 2 cards
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipeToShare, setRecipeToShare] = useState<Recipe | null>(null);

  const { user } = useSupabase();

  // Load recipes and set page context on mount
  const { updateContext } = useFreddieContext();
  const { refreshXP } = useLevelProgressContext();
  
  // Categories for filtering
  const categories = ['All', 'Seafood', 'Meat', 'Vegetarian', 'Dessert'];

  const handleShare = async (platform: string = 'native') => {
    const shareData = {
      title: recipeToShare ? `${recipeToShare.name} Recipe on Porkchop` : 'My Cookbook on Porkchop',
      text: recipeToShare 
        ? `Check out this amazing recipe for ${recipeToShare.name} on Porkchop!` 
        : 'Check out my digital cookbook on Porkchop! I\'ve been collecting amazing recipes and would love to share them with you.',
      url: window.location.href + (recipeToShare ? `?recipe=${encodeURIComponent(recipeToShare.id)}` : ''),
    };

    try {
      let shared = false;
      
      switch (platform) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'pinterest':
          window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareData.url)}&description=${encodeURIComponent(shareData.text)}`, '_blank');
          shared = true;
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'instagram':
          // Instagram doesn't support direct sharing via URL, so we'll copy to clipboard with instructions
          const instagramMessage = `Check out my cookbook! ${shareData.url}\n\nTo share on Instagram:\n1. Open Instagram\n2. Create a new post\n3. Paste this link in your caption`;
          await navigator.clipboard.writeText(instagramMessage);
          alert('Sharing instructions copied to clipboard! Open Instagram to share your cookbook.');
          shared = true;
          break;
        case 'slack':
          window.open(`https://slack.com/intent/share?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
            shared = true;
          } else {
            await navigator.clipboard.writeText(shareData.url);
            alert('Cookbook link copied to clipboard!');
            shared = true;
          }
          break;
      }

      if (shared) {
        // Award XP for sharing
        const sessionValid = await isSessionValid();
        if (sessionValid && user) {
          const today = new Date().toISOString().split('T')[0];
          const { data: existingLog } = await supabase
            .from('xp_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('action', 'cookbook_share')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .maybeSingle();
          
          if (!existingLog) {
            await supabase.rpc('increment_user_xp', {
              user_id: user.id,
              xp_amount: XP_REWARDS.RECIPE_SHARE
            });
            
            await supabase.from('xp_logs').insert([
              {
                user_id: user.id,
                xp_amount: XP_REWARDS.RECIPE_SHARE,
                action: 'cookbook_share',
                metadata: { shared_url: shareData.url, platform }
              }
            ]);
            
            refreshXP();
          }
        }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      if (err.name !== 'AbortError') {
        alert('Failed to share. Please try again.');
      }
    } finally {
      setShowShareModal(false);
    }
  };
  useEffect(() => {
    updateContext({ page: 'MyCookBook' });
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const savedRecipes = await fetchCookbook(user?.id!);
        const converted = savedRecipes.map(r => ({
          id: r.id,
          name: r.title,
          description: r.instructions,
          photo: r.image,
          ingredients: r.ingredients,
          instructions: r.instructions,
          equipment: r.equipment
        }));
        setLocalRecipes(converted);
      } catch (err) {
        console.error('Error loading cookbook:', err);
        setError('Failed to load your cookbook');
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, [updateContext]);

  // Filter recipes based on search term and category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;
    
    // Simple category detection based on ingredients
    const ingredients = recipe.ingredients || [];
    const ingredientsJoined = ingredients.join(' ').toLowerCase();
    
    const hasSeafood = ingredientsJoined.includes('fish') || 
      ingredientsJoined.includes('salmon') || 
      ingredientsJoined.includes('tuna') || 
      ingredientsJoined.includes('cod') || 
      ingredientsJoined.includes('tilapia') || 
      ingredientsJoined.includes('shrimp') || 
      ingredientsJoined.includes('lobster') || 
      ingredientsJoined.includes('crab') || 
      ingredientsJoined.includes('oyster') || 
      ingredientsJoined.includes('clam') || 
      ingredientsJoined.includes('mussel');
    
    const hasMeat = ingredientsJoined.includes('beef') || 
      ingredientsJoined.includes('chicken') || 
      ingredientsJoined.includes('pork') || 
      ingredientsJoined.includes('turkey') || 
      ingredientsJoined.includes('bacon') || 
      ingredientsJoined.includes('sausage') || 
      ingredientsJoined.includes('lamb');
    
    const hasVegetable = ingredientsJoined.includes('vegetable') || 
      ingredientsJoined.includes('tomato') || 
      ingredientsJoined.includes('carrot') || 
      ingredientsJoined.includes('spinach');
    
    const hasDessert = ingredientsJoined.includes('sugar') || 
      ingredientsJoined.includes('chocolate') || 
      ingredientsJoined.includes('vanilla') || 
      ingredientsJoined.includes('cream') || 
      ingredientsJoined.includes('cake') || 
      ingredientsJoined.includes('cookie') || 
      ingredientsJoined.includes('pie');
    
    switch (activeCategory) {
      case 'Seafood': return hasSeafood && matchesSearch;
      case 'Meat': return hasMeat && matchesSearch;
      case 'Vegetarian': return hasVegetable && !hasMeat && !hasSeafood && matchesSearch;
      case 'Dessert': return hasDessert && matchesSearch;
      default: return matchesSearch;
    }
  });

  // Get current recipes for pagination
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
          <div className="text-lg font-retro mb-2">Loading your cookbook...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-xl text-red-600 mb-4">⚠️</div>
          <div className="text-lg font-retro mb-2">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
      {/* My Cook Book header with emoji */}
      <div className="flex items-center justify-center mb-6">
        <span className="text-5xl mr-2">📖</span>
        <h1 className="text-3xl font-retro text-maineBlue mb-0">My Cook Book</h1>
      </div>
      {/* Chef of the Day Quote */}
      <div className="mb-6 p-4 border-l-4 border-seafoam rounded flex items-center">
        <div className="mr-4 text-3xl" role="img" aria-label="chef-hat">👨‍🍳</div>
        <div>
          {/* Store quote in variable to avoid duplicate function calls */}
          {(() => {
            const quoteOfDay = getChefQuoteOfTheDay();
            return (
              <>
                <div className="italic text-lg mb-1">"{quoteOfDay.quote}"</div>
                <div className="font-retro text-seafoam font-bold text-right">— {quoteOfDay.chef}</div>
              </>
            );
          })()}
        </div>
      </div>
      {showShareModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
        setShowShareModal(false);
        setRecipeToShare(null);
      }}>
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-4">
            {recipeToShare ? `Share "${recipeToShare.name}" Recipe` : 'Share Your Cookbook'}
          </h3>
          <div className="flex justify-around mb-4">
            <button 
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full hover:bg-blue-100"
              title="Share on Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-blue-100"
              title="Share on Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('pinterest')}
              className="p-2 rounded-full hover:bg-red-100"
              title="Share on Pinterest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E60023"><path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full hover:bg-green-100"
              title="Share on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/></svg>
            </button>
            <button 
              onClick={() => handleShare('instagram')}
              className="p-2 rounded-full hover:bg-pink-100"
              title="Share on Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('slack')}
              className="p-2 rounded-full hover:bg-purple-100"
              title="Share on Slack"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4A154B"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </button>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => handleShare('native')}
              className="px-4 py-2 bg-seafoam text-maineBlue rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
            >
              Share via...
            </button>
            <button
              onClick={() => {
                setShowShareModal(false);
                setRecipeToShare(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      )}
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search recipes..."
            className="pl-8 pr-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <div className="absolute left-2 top-2.5 text-gray-400">🔍</div>
        </div>
      
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setCurrentPage(1); // Reset to first page on category change
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                activeCategory === category
                  ? 'bg-seafoam text-maineBlue font-medium'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      {/* Recipe Count */}
      <div className="text-sm text-gray-500 mb-4">
        {filteredRecipes.length === 0 
          ? 'No recipes found' 
          : `Showing ${indexOfFirstRecipe + 1}-${Math.min(indexOfLastRecipe, filteredRecipes.length)} of ${filteredRecipes.length} recipes`}
      </div>

      {/* Digital Cookbook Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {currentRecipes.length === 0 ? (
          <div className="col-span-2 text-gray-400 italic text-center py-8">
            {recipes.length === 0 
              ? 'No recipes yet. Add your first recipe!' 
              : 'No recipes match your search criteria.'}
          </div>
        ) : currentRecipes.map((recipe, idx) => (
          <div key={idx} className="group h-[400px] [perspective:1000px]">
            <div className="relative h-full w-full rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front */}
              <div className="absolute inset-0 bg-white p-4 rounded-lg shadow-md">
                {recipe.photo && (
                  <img 
                    src={recipe.photo} 
                    alt={recipe.name} 
                    className="w-full h-32 object-cover rounded-t-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2 line-clamp-1">{recipe.name}</h3>
                <div className="text-gray-600 overflow-hidden">
                  <h4 className="font-semibold mb-1">Ingredients:</h4>
                  <ul className="list-disc pl-4 max-h-[100px] overflow-y-auto">
                    {recipe.ingredients?.map((ingredient, i) => (
                      <li key={i} className="line-clamp-1">{ingredient}</li>
                    ))}
                  </ul>
                  
                  {recipe.equipment && recipe.equipment.length > 0 && (
                    <>
                      <h4 className="font-semibold mb-1 mt-2">Equipment Needed:</h4>
                      <ul className="list-disc pl-4 max-h-[60px] overflow-y-auto">
                        {recipe.equipment.map((item, i) => (
                          <li key={i} className="line-clamp-1">{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              {/* Back */}
              <div className="absolute inset-0 h-full w-full rounded-xl bg-white p-4 shadow-md [transform:rotateY(180deg)] [backface-visibility:hidden]">
                <h3 className="text-xl font-bold mb-2 line-clamp-1">{recipe.name}</h3>
                <div className="text-gray-600 overflow-y-auto h-[280px] mb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  <h4 className="font-semibold mb-1">Instructions:</h4>
                  <p className="whitespace-pre-wrap">{recipe.instructions}</p>
                </div>
                <div className="flex justify-between items-center absolute bottom-4 left-4 right-4">
                  <button
                    onClick={async () => {
                      try {
                        const recipeId = recipe.id;
                        await removeRecipeFromCookbook(user?.id!, recipeId);
                        setLocalRecipes(recipes.filter(r => r.id !== recipeId));
                      } catch (err) {
                        console.error('Error deleting recipe:', err);
                        setError('Failed to delete recipe');
                      }
                    }}
                    className="text-lobsterRed hover:text-maineBlue transition-colors"
                    title="Delete Recipe"
                  >
                    🗑️ Remove
                  </button>
                  
                  <button
                    onClick={() => {
                      const fullRecipe = {
                        id: `${recipe.name.replace(/\s+/g, '-')}-${idx}`,
                        title: recipe.name,
                        image: recipe.photo || '',
                        ingredients: recipe.ingredients || [],
                        instructions: recipe.instructions || '',
                        equipment: recipe.equipment || [],
                        tutorials: [
                          {
                            title: `Equipment: Using the right tools for ${recipe.name}`,
                            desc: `Learn how to use the main equipment needed for this dish.`
                          },
                          {
                            title: `Protein Prep: Preparing the main ingredient`,
                            desc: `How to prep the main protein (e.g., fish, chicken, clams) for this recipe.`
                          },
                          {
                            title: `Recipe: ${recipe.name}`,
                            desc: recipe.instructions || ''
                          }
                        ]
                      };
                      setSelectedRecipe(fullRecipe);
                      navigate('/culinary-school');
                    }}
                    className="bg-seafoam text-maineBlue px-4 py-2 rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
                  >
                    Cook This
                  </button>
                  <button
                    onClick={() => {
                      setRecipeToShare(recipe);
                      setShowShareModal(true);
                    }}
                    className="bg-maineBlue text-seafoam px-4 py-2 rounded hover:bg-seafoam hover:text-maineBlue transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center">
            <button 
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
              } transition-colors`}
            >
              ←
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              // Show limited page numbers with ellipsis for better UX
              if (
                i === 0 || // First page
                i === totalPages - 1 || // Last page
                (i >= currentPage - 2 && i <= currentPage) || // 2 pages before current
                (i >= currentPage && i <= currentPage + 1) // 1 page after current
              ) {
                return (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? 'bg-maineBlue text-seafoam font-medium'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    {i + 1}
                  </button>
                );
              } else if (
                (i === 1 && currentPage > 3) || 
                (i === totalPages - 2 && currentPage < totalPages - 2)
              ) {
                // Show ellipsis
                return <span key={i} className="mx-1">...</span>;
              }
              return null;
            })}
            
            <button 
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === totalPages 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
              } transition-colors`}
            >
              →
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default MyCookBook;
