import React, { useEffect, useState } from 'react';

// Types for market info
export const DEPARTMENT_TYPES = [
  { key: 'grocery', label: 'Grocery', icon: '🛒', placeTypes: ['supermarket', 'convenience_store'], keywords: ['grocery', 'market', 'food', 'store', 'co-op', 'coop', 'natural', 'organic'] },
  { key: 'produce', label: 'Produce', icon: '🥦', placeTypes: ['supermarket', 'convenience_store'], keywords: ['produce', 'fruit', 'vegetable', 'farm', 'organic', 'farmers', 'garden', 'orchard', 'berry', 'apple', 'greengrocer', 'csa', 'stand'] },
  { key: 'bakery', label: 'Bakery', icon: '🍞', placeTypes: ['bakery'], keywords: ['bakery', 'bread', 'pastry', 'cake', 'donut', 'bake', 'bagel', 'cookie', 'pie', 'patisserie', 'boulangerie', 'confection'] },
  { key: 'butcher', label: 'Meat', icon: '🥩', placeTypes: ['supermarket'], keywords: ['meat', 'butcher', 'steak', 'beef', 'poultry', 'pat', 'pats', 'sausage', 'deli', 'chop', 'prime', 'angus', 'pork', 'chicken', 'lamb'] },
  { key: 'seafood', label: 'Seafood', icon: '🐟', placeTypes: ['supermarket'], keywords: ['seafood', 'fish', 'shellfish', 'lobster', 'crab', 'harbor', 'ocean', 'sea', 'marine', 'catch', 'oyster', 'clam', 'shrimp', 'mussel', 'fishmonger', 'fishery'] },
  { key: 'farms', label: 'Farms', icon: '🚜', placeTypes: ['supermarket', 'convenience_store'], keywords: ['farm', 'farmers market', 'farmstand', 'csa', 'agriculture', 'ranch', 'homestead', 'acres', 'dairy', 'milk', 'cheese', 'creamery', 'yogurt'] },
  { key: 'equipment', label: 'Equipment', icon: '🔪', placeTypes: ['store', 'home_goods_store'], keywords: ['kitchen', 'knife', 'cookware', 'utensil', 'appliance', 'tool', 'gadget', 'cutlery', 'pot', 'pan', 'bakeware', 'chef', 'cooking'] },
];

// Maximum number of places to show per category
const MAX_PLACES_PER_CATEGORY = 5;

// List of big box retailers and non-food places to exclude
const BIG_BOX_RETAILERS = ['walmart', 'costco', 'bj', 'bjs', 'sams club', 'sam\'s club', 'best buy', 'target', 'home depot', 'lowe\'s', 'lowes', 'duluth trading', 'duluth trading company', 'cvs', 'cvs pharmacy', 'maine audubon'];

// List of specific places to exclude (exact matches)
const EXCLUDED_PLACES = ['Brunswick Farmers Market', 'Brunswick Winter Farmers\' Market'];

// List of generic grocery chains that should not be considered specialized
const GENERIC_GROCERY_CHAINS = ['trader joe', 'whole foods', 'hannaford', 'shaw', 'market basket', 'stop & shop', 'kroger', 'publix', 'albertsons', 'safeway', 'giant', 'food lion'];

// Specialty keywords that strongly indicate a specialized market
const SPECIALTY_INDICATORS = [
  'specialty', 'artisan', 'gourmet', 'local', 'fresh', 'organic', 'market', 'shop', 'farm', 'stand'
];

// Known specialized markets to prioritize
const SPECIALIZED_MARKETS = {
  'harbor fish': 'seafood',
  'harbor fish market': 'seafood',
  'merrill seafood': 'seafood',
  'pats meat': 'butcher',
  'pat meat': 'butcher',
  'pat\'s meat': 'butcher',
  'pat\'s meat market': 'butcher'
};

// Search queries for specialty categories
const SPECIALTY_SEARCH_QUERIES = {
  'butcher': ['meat market', 'butcher shop'],
  'seafood': ['seafood market', 'fish market'],
  'produce': ['produce market', 'fruit stand', 'vegetable market'],
  'farms': ['farm', 'farmers market', 'farm stand'],
  'equipment': ['kitchen store', 'cookware shop', 'knife store']
};

interface Place {
  name: string;
  vicinity: string;
  place_id: string;
  types: string[];
  website: string | null;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  assignedCategory?: string; // Track which category this place is assigned to
  isSpecialized?: boolean; // Whether this is a specialized market vs. general grocery
  distance?: number; // Distance from user's location in miles
}

const MarketDirectory: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<typeof DEPARTMENT_TYPES[0] | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please enable location services.');
      }
    );
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch places when coordinates are available
  useEffect(() => {
    if (!coordinates) return;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const radius = 24140; // 15 miles in meters
        let allPlaces: Place[] = [];
        
        // Initial fetch for supermarkets, convenience stores, and bakeries
        const initialResponse = await fetch(
          `/.netlify/functions/get-places?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}&type=supermarket,convenience_store,bakery`
        );
        
        const initialData = await initialResponse.json();
        console.log('Initial Places API response:', initialData);
        
        if (!initialResponse.ok) {
          throw new Error(initialData.error || `API returned ${initialResponse.status}`);
        }
        
        if (initialData.status === 'OK' && initialData.results) {
          // Filter out restaurants and big box retailers
          const filteredPlaces = initialData.results.filter(
            (place: Place) => 
              !place.types.some(type => type === 'restaurant' || type === 'meal_takeaway') &&
              !BIG_BOX_RETAILERS.some(storeName => place.name.toLowerCase().includes(storeName))
          );
          
          allPlaces = [...filteredPlaces];
        }
        
        // Additional searches for specialty categories
        const specialtyCategories = ['butcher', 'seafood', 'produce', 'farms', 'equipment'];
        for (const category of specialtyCategories) {
          const queries = SPECIALTY_SEARCH_QUERIES[category as keyof typeof SPECIALTY_SEARCH_QUERIES];
          
          for (const query of queries) {
            try {
              console.log(`Searching for ${category} with query: ${query}`);
              const specialtyResponse = await fetch(
                `/.netlify/functions/text-search-places?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}&query=${encodeURIComponent(query)}`
              );
              
              const specialtyData = await specialtyResponse.json();
              console.log(`${category} search response for "${query}":`, specialtyData);
              
              if (specialtyData.status === 'OK' && specialtyData.results) {
                // Filter out restaurants and big box retailers
                const filteredSpecialtyPlaces = specialtyData.results.filter(
                  (place: Place) => 
                    !place.types.some(type => type === 'restaurant' || type === 'meal_takeaway') &&
                    !BIG_BOX_RETAILERS.some(storeName => place.name.toLowerCase().includes(storeName))
                );
                
                // Add to our collection, avoiding duplicates
                for (const place of filteredSpecialtyPlaces) {
                  if (!allPlaces.some(p => p.place_id === place.place_id)) {
                    allPlaces.push(place);
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching ${category} places with query "${query}":`, err);
              // Continue with other queries even if one fails
            }
          }
        }
        
        // Assign each place to its most appropriate category
        const categorizedPlaces = assignPlacesToCategories(allPlaces);
        setPlaces(categorizedPlaces);
      } catch (err) {
        console.error('Places fetch error:', err);
        setError('Failed to fetch nearby places.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [coordinates]);

  const openModal = (dept: typeof DEPARTMENT_TYPES[0]) => {
    setSelectedDept(dept);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // Assign places to their most appropriate category based on name and types
  const assignPlacesToCategories = (places: Place[]): Place[] => {
    const result = [...places];
    
    result.forEach(place => {
      const nameLower = place.name.toLowerCase();
      
      // Debug: Log if we find Harbor Fish or other specialty markets
      if (nameLower.includes('harbor') && nameLower.includes('fish')) {
        console.log('Found Harbor Fish during categorization:', place);
      }
      if (nameLower.includes('merrill') && nameLower.includes('seafood')) {
        console.log('Found Merrill Seafood during categorization:', place);
      }
      if ((nameLower.includes('pat') || nameLower.includes('pat\'s')) && nameLower.includes('meat')) {
        console.log('Found Pat\'s Meat Market during categorization:', place);
      }
      
      // Check if it's a big box retailer (already filtered, but double-check)
      const isBigBox = BIG_BOX_RETAILERS.some(retailer => nameLower.includes(retailer));
      if (isBigBox) {
        // Skip big box retailers entirely
        return;
      }
      
      // Check if it's in our specific exclusion list (exact match)
      if (EXCLUDED_PLACES.includes(place.name)) {
        // Skip specifically excluded places
        return;
      }
      
      // Priority categorization for seafood and meat in name - these take precedence over other rules
      if (nameLower.includes('seafood') || nameLower.includes('fish') || nameLower.includes('shellfish') || nameLower.includes('lobster')) {
        place.assignedCategory = 'seafood';
        place.isSpecialized = true;
        return;
      }
      
      if (nameLower.includes('meat') || nameLower.includes('butcher')) {
        place.assignedCategory = 'butcher';
        place.isSpecialized = true;
        return;
      }
      
      // Special handling for bakeries - make sure they're properly categorized
      if (nameLower.includes('bakery') || nameLower.includes('bakeries') || nameLower.includes('bread') || 
          nameLower.includes('pastry') || nameLower.includes('cake') || 
          (place.types && place.types.includes('bakery'))) {
        place.assignedCategory = 'bakery';
        place.isSpecialized = true;
        return;
      }
      
      // Special handling for farms
      if (nameLower.includes('farm') || nameLower.includes('farmers market')) {
        place.assignedCategory = 'farms';
        place.isSpecialized = true;
        return;
      }
      
      // Check if it's a generic grocery chain
      const isGenericChain = GENERIC_GROCERY_CHAINS.some(chain => nameLower.includes(chain));
      if (isGenericChain) {
        // Generic chains always go to grocery and are not specialized
        place.assignedCategory = 'grocery';
        place.isSpecialized = false;
        return;
      }
      
      // First check for known specialized markets we want to explicitly categorize
      for (const [marketName, category] of Object.entries(SPECIALIZED_MARKETS)) {
        if (nameLower.includes(marketName)) {
          place.assignedCategory = category;
          place.isSpecialized = true;
          return; // Skip further processing for this place
        }
      }
      
      // Special handling for farms - farms are typically specialized
      if (nameLower.includes('farm')) {
        if (nameLower.includes('beef') || nameLower.includes('poultry')) {
          place.assignedCategory = 'butcher';
          place.isSpecialized = true;
          return;
        } else if (nameLower.includes('dairy') || nameLower.includes('milk') || nameLower.includes('cheese')) {
          place.assignedCategory = 'farms';
          place.isSpecialized = true;
          return;
        } else {
          // Default farm to farms category if not specified
          place.assignedCategory = 'farms';
          place.isSpecialized = true;
          return;
        }
      }
      
      // Check for specialty keywords in each department
      for (const dept of DEPARTMENT_TYPES) {
        // Skip grocery category for specialty keyword matching
        if (dept.key === 'grocery') continue;
        
        // Check if any specialty keywords are in the name
        if (dept.keywords.some(keyword => nameLower.includes(keyword))) {
          place.assignedCategory = dept.key;
          // Check if it contains any specialty indicators
          place.isSpecialized = SPECIALTY_INDICATORS.some(indicator => nameLower.includes(indicator)) || 
                               // These types are always specialized
                               dept.key === 'bakery' || 
                               dept.key === 'butcher' || 
                               dept.key === 'seafood' ||
                               dept.key === 'farms' ||
                               dept.key === 'equipment';
          return; // Found a match, no need to check further
        }
      }
      
      // If no specialty was found, check Google's place types
      for (const dept of DEPARTMENT_TYPES) {
        if (place.types.some(type => dept.placeTypes.includes(type))) {
          place.assignedCategory = dept.key;
          // Bakeries from Google place types are specialized
          place.isSpecialized = dept.key === 'bakery';
          return; // Found a match, no need to check further
        }
      }
      
      // Default to grocery if no category was assigned
      if (!place.assignedCategory) {
        place.assignedCategory = 'grocery';
        place.isSpecialized = false;
      }
    });
    
    return result;
  };

  const getPlacesForDepartment = (dept: typeof DEPARTMENT_TYPES[0]) => {
    // Get places specifically assigned to this category
    let assignedPlaces = places.filter(place => place.assignedCategory === dept.key);
    
    // Apply 15-mile distance filter if geometry data is available
    if (coordinates) {
      assignedPlaces = assignedPlaces.filter(place => {
        // If no geometry data, keep the place to avoid empty results
        if (!place.geometry || !place.geometry.location) return true;
        
        try {
          const distance = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          return distance <= 15;
        } catch (err) {
          console.log('Distance calculation error for', place.name, err);
          return true; // Keep the place on error to avoid empty results
        }
      });
    }
    
    // Calculate distance for each place for sorting purposes
    if (coordinates) {
      assignedPlaces.forEach(place => {
        if (place.geometry && place.geometry.location) {
          try {
            place.distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            );
          } catch (err) {
            place.distance = 999; // Default high distance value for places with calculation errors
          }
        } else {
          place.distance = 999; // Default high distance value for places without geometry
        }
      });
    }
    
    // Sort by specialized first, then by distance (closest first)
    assignedPlaces.sort((a, b) => {
      // First priority: specialized markets always come first
      if (a.isSpecialized && !b.isSpecialized) return -1;
      if (!a.isSpecialized && b.isSpecialized) return 1;
      
      // Second priority: within each group (specialized or non-specialized), sort by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Fallback to alphabetical if distances aren't available
      return a.name.localeCompare(b.name);
    });
    
    // Remove duplicates by name (case insensitive)
    const uniquePlaces: Place[] = [];
    const seenNames = new Set<string>();
    
    for (const place of assignedPlaces) {
      const nameLower = place.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        uniquePlaces.push(place);
        seenNames.add(nameLower);
      }
    }
    
    // If we have assigned places, return up to MAX_PLACES_PER_CATEGORY
    if (uniquePlaces.length > 0) {
      return uniquePlaces.slice(0, MAX_PLACES_PER_CATEGORY);
    }
    
    // Fallback: If no places were specifically assigned to this category,
    // use the place type-based filtering, excluding generic grocery chains
    const fallbackPlaces = places.filter(place => 
      place.types.some(type => dept.placeTypes.includes(type)) &&
      !GENERIC_GROCERY_CHAINS.some(chain => place.name.toLowerCase().includes(chain))
    );
    
    // Also deduplicate fallback places
    const uniqueFallbackPlaces: Place[] = [];
    const seenFallbackNames = new Set<string>();
    
    for (const place of fallbackPlaces) {
      const nameLower = place.name.toLowerCase();
      if (!seenFallbackNames.has(nameLower)) {
        uniqueFallbackPlaces.push(place);
        seenFallbackNames.add(nameLower);
      }
    }
    
    return uniqueFallbackPlaces.slice(0, MAX_PLACES_PER_CATEGORY);
  };

  return (
    <div className="my-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-lg mx-auto">
        {DEPARTMENT_TYPES.slice(0, 6).map(dep => (
          <button
            key={dep.key}
            className="flex flex-col items-center bg-white rounded-lg shadow-md p-6 hover:bg-sand transition cursor-pointer focus:outline-none"
            onClick={() => openModal(dep)}
          >
            <span className="text-4xl mb-2">{dep.icon}</span>
            <span className="font-retro text-lg">{dep.label}</span>
          </button>
        ))}
        {/* Equipment button as full width */}
        {DEPARTMENT_TYPES.slice(6, 7).map(dep => (
          <button
            key={dep.key}
            className="col-span-2 sm:col-span-3 flex flex-col items-center bg-white rounded-lg shadow-md p-6 hover:bg-sand transition cursor-pointer focus:outline-none"
            onClick={() => openModal(dep)}
          >
            <span className="text-4xl mb-2">{dep.icon}</span>
            <span className="font-retro text-lg">{dep.label}</span>
          </button>
        ))}
      </div>
      {modalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <span className="text-5xl mb-4">{selectedDept.icon}</span>
            <h3 className="text-xl font-bold mb-2 text-maineBlue">{selectedDept.label} Options</h3>
            {loading ? (
              <p className="text-gray-600">Finding places near you...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="w-full mt-4 space-y-3">
                  {getPlacesForDepartment(selectedDept).map(place => (
                    <div 
                      key={place.place_id} 
                      className={`rounded-lg p-4 ${place.isSpecialized ? 'bg-sand' : 'bg-gray-50'}`}
                    >
                      <h4 className="font-bold text-maineBlue">{place.name}</h4>
                      <p className="text-gray-600 text-sm">{place.vicinity}</p>
                      {place.website && (
                        <a 
                          href={place.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-maineBlue hover:underline mt-1 inline-block"
                        >
                          Visit Website <span className="text-xs">↗</span>
                        </a>
                      )}
                    </div>
                  ))}
                  {getPlacesForDepartment(selectedDept).length === 0 && (
                    <p className="text-gray-500 text-center italic">
                      No {selectedDept.label.toLowerCase()} locations found nearby.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDirectory;
