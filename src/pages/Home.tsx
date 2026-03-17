import { Search, Bell, MapPin, X, Navigation } from 'lucide-react';
import CategoryBar from '../components/CategoryBar';
import EventCard from '../components/EventCard';
import CitySelector from '../components/CitySelector';
import TheatreList from '../components/TheatreList';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState, useEffect, useMemo } from 'react';
import { fetchNowPlayingMovies } from '../services/tmdb';
import { Event } from '../data/mockData';

export default function Home() {
  const navigate = useNavigate();
  const { location, setLocation, events } = useStore();
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [tmdbMovies, setTmdbMovies] = useState<Event[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);

  const localMovies = events.filter((e) => e.type === 'movie');
  const displayMovies = useMemo(() => {
    const source = tmdbMovies.length > 0 ? tmdbMovies : localMovies;
    const byTitle = new Map<string, Event>();

    for (const movie of source) {
      const key = (movie.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const existing = byTitle.get(key);
      if (!existing) {
        byTitle.set(key, movie);
        continue;
      }

      const existingLanguages = (existing.language || '')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);
      const movieLanguages = (movie.language || '')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);

      existing.language = Array.from(new Set([...existingLanguages, ...movieLanguages])).join(', ');
      existing.genre = Array.from(new Set([...(existing.genre || []), ...(movie.genre || [])]));
    }

    return Array.from(byTitle.values());
  }, [tmdbMovies, localMovies]);

  const trendingEvents = [
    ...events.filter((e) => e.isTrending && e.type !== 'movie'), // Keep non-movie trending events
    ...displayMovies.filter((m) => m.isTrending) // Add trending TMDB movies
  ].sort((a, b) => b.rating - a.rating); // Sort by rating to mix them up

  useEffect(() => {
    const loadMovies = async () => {
      setIsLoadingMovies(true);
      const fetchedMovies = await fetchNowPlayingMovies(location.city);
      setTmdbMovies(fetchedMovies);
      setIsLoadingMovies(false);
    };
    loadMovies();
  }, [location.city]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 min-h-screen bg-vibe-bg text-zinc-50"
    >
      {/* City Selector Modal */}
      <CitySelector isOpen={showCitySelector} onClose={() => setShowCitySelector(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div 
            className="cursor-pointer group"
            onClick={() => setShowCitySelector(true)}
          >
            <p className="text-[10px] font-bold text-vibe-primary uppercase tracking-widest mb-0.5 flex items-center">
              Location
            </p>
            <h1 className="text-lg font-bold flex items-center space-x-1 group-hover:text-vibe-primary-hover transition-colors">
              <span className="truncate max-w-[150px]">{location.city}</span>
              <MapPin className="w-4 h-4 text-zinc-500 group-hover:text-vibe-primary-hover" />
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-vibe-card border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-vibe-primary rounded-full border border-vibe-card"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <CategoryBar />

      {/* Now Running (Horizontal) */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-xl font-bold tracking-tight">Now Running</h2>
          <button 
            onClick={() => navigate('/category/movies')}
            className="text-xs font-semibold text-vibe-primary hover:text-vibe-primary-hover"
          >
            See All
          </button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar px-4 space-x-4 pb-4">
          {isLoadingMovies ? (
            <div className="flex space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-64 h-40 bg-white/5 animate-pulse rounded-2xl flex-shrink-0" />
              ))}
            </div>
          ) : (
            displayMovies.map((movie) => (
              <EventCard key={movie.id} event={movie} variant="horizontal" />
            ))
          )}
        </div>
      </section>

      {/* Theatres Section */}
      <section className="mt-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Theatres in {location.city}</h2>
        </div>
        <TheatreList city={location.city} />
      </section>

      {/* Trending / Nearby (Vertical) */}
      <section className="mt-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Trending Nearby</h2>
        </div>
        <div className="space-y-6">
          {trendingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}
