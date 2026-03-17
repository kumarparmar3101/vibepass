import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCityFromIp, getCityName } from '../utils/geolocation';

const INTERESTS = [
  'Music', 'Comedy', 'Sports', 'Food', 'Technology', 'Art', 
  'Theater', 'Gaming', 'Fitness', 'Networking', 'EDM', 'Movies'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setLocation, completeOnboarding } = useStore();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocation = () => {
    setIsLocating(true);
    if (!('geolocation' in navigator)) {
      getCityFromIp()
        .then((city) => setLocation({ city }))
        .catch((error) => console.error('IP location fallback failed:', error))
        .finally(() => {
          setIsLocating(false);
          setStep(2);
        });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const city = await getCityName(latitude, longitude);
          
          setLocation({
            city,
            coordinates: { lat: latitude, lng: longitude },
          });
        } catch (error) {
          console.error('Error fetching location:', error);
          // Don't block onboarding if location fetch fails
        } finally {
          setIsLocating(false);
          setStep(2);
        }
      },
      async (error) => {
        console.error('Geolocation error:', error);
        if (error.code !== 1) {
          try {
            const city = await getCityFromIp();
            setLocation({ city });
          } catch (fallbackError) {
            console.error('IP location fallback failed:', fallbackError);
          }
        }
        // Don't block user if they deny permission or lookup fails
        setIsLocating(false);
        setStep(2);
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFinish = () => {
    if (selectedInterests.length >= 3) {
      completeOnboarding();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-vibe-bg text-zinc-50 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-vibe-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center p-6 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-vibe-card rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-2xl shadow-vibe-primary/20">
                <MapPin className="w-10 h-10 text-vibe-primary" />
              </div>
              <h1 className="text-3xl font-black text-white mb-4">Find Your Vibe</h1>
              <p className="text-zinc-400 mb-12">
                Allow location access to discover the best events, movies, and experiences happening near you right now.
              </p>
              
              <button
                onClick={handleLocation}
                disabled={isLocating}
                className="w-full bg-vibe-primary hover:bg-vibe-primary-hover text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(255,0,60,0.3)] disabled:opacity-50"
              >
                {isLocating ? (
                  <span className="animate-pulse">Locating...</span>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span>Enable Location</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(2)}
                className="mt-6 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full justify-between py-12"
            >
              <div>
                <h1 className="text-3xl font-black text-white mb-2">What are you into?</h1>
                <p className="text-zinc-400 mb-8">
                  Pick at least 3 interests to personalize your feed.
                </p>

                <div className="flex flex-wrap gap-3">
                  {INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-5 py-3 rounded-full text-sm font-bold transition-all border ${
                          isSelected
                            ? 'bg-vibe-primary/20 text-rose-200 border-vibe-primary/50 shadow-[0_0_15px_rgba(255,0,60,0.2)]'
                            : 'bg-vibe-card text-zinc-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-12">
                <button
                  onClick={handleFinish}
                  disabled={selectedInterests.length < 3}
                  className={`w-full py-4 rounded-2xl font-bold tracking-wide flex items-center justify-center space-x-2 transition-all ${
                    selectedInterests.length >= 3
                      ? 'bg-vibe-primary hover:bg-vibe-primary-hover text-white shadow-[0_0_20px_rgba(255,0,60,0.3)]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <span>Continue</span>
                  {selectedInterests.length >= 3 && <Check className="w-5 h-5" />}
                </button>
                <p className="text-center text-xs text-zinc-500 mt-4">
                  {selectedInterests.length < 3 
                    ? `Select ${3 - selectedInterests.length} more` 
                    : "You're all set!"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
