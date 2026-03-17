import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import React, { useState } from 'react';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Chandigarh', 'Lucknow'
];

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CitySelector({ isOpen, onClose }: CitySelectorProps) {
  const { location, setLocation } = useStore();
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  'Accept-Language': 'en-US,en;q=0.9',
                  'User-Agent': 'MovieWalletApp/1.0'
                }
              }
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || 'Unknown Location';
            
            setLocation({
              city,
              coordinates: { lat: latitude, lng: longitude }
            });
            onClose();
          } catch (error) {
            console.error('Error fetching location name:', error);
            setLocation({ city: 'Current Location', coordinates: { lat: position.coords.latitude, lng: position.coords.longitude } });
            onClose();
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not detect location. Please ensure location permissions are granted.');
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  const handleCitySelect = (city: string) => {
    if (!city.trim()) return;
    setLocation({ city: city.trim() });
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCitySelect(searchQuery);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-vibe-card rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-vibe-card z-10">
              <h2 className="text-lg font-bold text-white">Select City</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto hide-scrollbar">
              <form onSubmit={handleSearchSubmit} className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search for your city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-vibe-primary/50 transition-colors"
                />
                {searchQuery.trim() && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-vibe-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Search
                  </button>
                )}
              </form>

              <button
                onClick={handleGetLocation}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-vibe-primary/10 border border-vibe-primary/20 text-vibe-primary hover:bg-vibe-primary/20 transition-colors mb-6"
              >
                <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">Detect my location</div>
                  <div className="text-xs opacity-80">Using GPS</div>
                </div>
                {isLocating && <span className="w-4 h-4 rounded-full border-2 border-vibe-primary border-t-transparent animate-spin" />}
              </button>

              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2">Popular Cities</h3>
              <div className="grid grid-cols-3 gap-3">
                {INDIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-colors border ${
                      location.city === city 
                        ? 'bg-vibe-primary/20 border-vibe-primary text-vibe-primary' 
                        : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
