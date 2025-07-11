import React, { useEffect, useState } from 'react';

type PlaceResult = {
  name: string;
  vicinity: string;
  place_id: string;
  types: string[];
};

const NearbyPlaces: React.FC = () => {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please enable location services in your browser settings.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch places once we have coordinates
  useEffect(() => {
    if (!coordinates) return;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const radius = 24140; // 15 miles in meters
        console.log('Fetching places with coordinates:', coordinates);
        const url = `/.netlify/functions/get-places?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}&type=supermarket,convenience_store,bakery,restaurant,meal_takeaway`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        const rawResponse = await response.text(); // Get raw text first
        console.log('Raw response text:', rawResponse);
        
        let data;
        try {
          data = JSON.parse(rawResponse);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid response format');
        }
        
        console.log('Parsed Places API response:', data);
        
        if (!response.ok) {
          console.error('Places API Error:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
          throw new Error(data.error || `API returned ${response.status}`);
        }
        
        if (!data.results) {
          console.error('No results in response:', data);
          throw new Error('No results found');
        }
        
        if (data.status === 'ZERO_RESULTS') {
          setPlaces([]);
          return;
        }
        
        if (data.status !== 'OK') {
          console.error('Google Places API error details:', data);
          throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'No error message provided'}`);
        }
        
        setPlaces(data.results);
      } catch (err) {
        console.error('Places fetch error:', err);
        setError(`Failed to fetch nearby places: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [coordinates]);



  if (loading) {
    return (
      <div className="my-8 text-center">
        <h2 className="text-xl font-bold text-maineBlue mb-4">Finding Markets Near You</h2>
        <p className="text-gray-600">Searching within 15 miles of your location...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 text-center">
        <h2 className="text-xl font-bold text-maineBlue mb-4">Oops!</h2>
        <p className="text-red-500">{error}</p>
        <button
          onClick={requestLocation}
          className="mt-4 bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-maineBlue">Markets Near You</h2>
        <button
          onClick={requestLocation}
          className="text-sm bg-seafoam text-maineBlue px-3 py-1 rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
        >
          Update Location
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {places.map(place => (
          <div key={place.place_id} className="bg-white rounded shadow p-4">
            <div className="font-retro font-bold">{place.name}</div>
            <div className="text-gray-600">{place.vicinity}</div>
          </div>
        ))}
      </div>
      {places.length === 0 && (
        <div className="text-gray-400 italic text-center">
          No markets found within 15 miles of your location.
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
