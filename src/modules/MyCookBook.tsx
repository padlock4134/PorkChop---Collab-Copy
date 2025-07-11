import React, { useState, useEffect } from 'react';
import { useFreddieContext } from '../components/FreddieContext';
import { useRecipeContext } from '../components/RecipeContext';
import { useNavigate } from 'react-router-dom';
import { fetchCookbook, removeRecipeFromCookbook } from './cookbookSupabase';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';

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

  // Load recipes and set page context on mount
  const { updateContext } = useFreddieContext();
  const { refreshXP } = useLevelProgressContext();

  const handleShare = async (platform: string = 'native') => {
    const shareData = {
      title: 'My Cookbook on Porkchop',
      text: 'Check out my digital cookbook on Porkchop! I\'ve been collecting amazing recipes and would love to share them with you.',
      url: window.location.href,
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
        const savedRecipes = await fetchCookbook();
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
    // You can enhance this with more sophisticated categorization
    const hasSeafood = recipe.ingredients?.some(i => 
      ['fish', 'salmon', 'tuna', 'shrimp', 'lobster', 'crab', 'seafood'].some(term => 
        i.toLowerCase().includes(term)
      )
    );
    
    const hasMeat = recipe.ingredients?.some(i => 
      ['beef', 'chicken', 'pork', 'lamb', 'meat', 'steak', 'turkey'].some(term => 
        i.toLowerCase().includes(term)
      )
    );
    
    const hasVegetable = recipe.ingredients?.some(i => 
      ['vegetable', 'carrot', 'broccoli', 'spinach', 'kale', 'lettuce', 'vegan', 'vegetarian'].some(term => 
        i.toLowerCase().includes(term)
      )
    );
    
    const hasDessert = recipe.ingredients?.some(i => 
      ['sugar', 'chocolate', 'dessert', 'cake', 'cookie', 'sweet', 'pie', 'ice cream'].some(term => 
        i.toLowerCase().includes(term)
      )
    );
    
    switch(activeCategory) {
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
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Categories for filtering
  const categories = ['All', 'Seafood', 'Meat', 'Vegetarian', 'Dessert'];

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

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-weatheredWhite p-6 rounded shadow">
      {/* Chef of the Day Quote */}
      <div className="mb-6 p-4 border-l-4 border-seafoam rounded flex items-center">
        <div className="mr-4 text-3xl" role="img" aria-label="chef-hat">👨‍🍳</div>
        <div>
          <div className="italic text-lg mb-1">"{getChefQuoteOfTheDay().quote}"</div>
          <div className="font-retro text-seafoam font-bold text-right">— {getChefQuoteOfTheDay().chef}</div>
        </div>
      </div>

      {/* Digital Cookbook Header with Search and Filters */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-retro">My Digital Cookbook</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="text-maineBlue hover:text-seafoam transition-colors"
              title="Share Cookbook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {showShareModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-4">Share Your Cookbook</h3>
                  <div className="flex justify-around mb-4">
                    <button 
                      onClick={() => handleShare('facebook')}
                      className="p-2 rounded-full hover:bg-blue-100"
                      title="Share on Facebook"
                    >
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="p-2 rounded-full hover:bg-blue-100"
                      title="Share on Twitter"
                    >
                      <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('pinterest')}
                      className="p-2 rounded-full hover:bg-red-100"
                      title="Share on Pinterest"
                    >
                      <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="p-2 rounded-full hover:bg-green-100"
                      title="Share on WhatsApp"
                    >
                      <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.173.199-.347.222-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.784-1.66-2.087-.173-.297-.018-.458.13-.606.136-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.508-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.078 4.488.703.306 1.25.489 1.675.625.712.227 1.36.195 1.871.118.571-.086 1.757-.718 2.005-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.345m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.885 9.888-9.885 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.465h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('instagram')}
                      className="p-2 rounded-full hover:bg-pink-100"
                      title="Share on Instagram"
                    >
                      <svg className="w-8 h-8 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('slack')}
                      className="p-2 rounded-full hover:bg-purple-100"
                      title="Share on Slack"
                    >
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.104-2.521a2.528 2.528 0 0 1 5.046 0 2.528 2.528 0 0 1-2.526 2.52h-2.52v-2.52zm-1.271 0a2.528 2.528 0 0 1-2.522-2.52 2.528 2.528 0 0 1 2.522-2.522 2.528 2.528 0 0 1 2.526 2.522v6.313a2.528 2.528 0 0 1-2.526 2.521 2.527 2.527 0 0 1-2.522-2.521V3.792zm-2.522 13.894a2.527 2.527 0 0 1 2.522-2.521 2.527 2.527 0 0 1 2.521 2.521v2.522h-2.521a2.528 2.528 0 0 1-2.522-2.522z"/>
                      </svg>
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
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              className="pl-8 pr-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <div className="absolute left-2 top-2.5 text-gray-400">🔍</div>
          </div>
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
                        await removeRecipeFromCookbook(recipeId);
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
