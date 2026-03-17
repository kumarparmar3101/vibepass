import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories } from '../data/mockData';
import EventCard from '../components/EventCard';
import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import { fetchNowPlayingMovies } from '../services/tmdb';
import { Event } from '../data/mockData';

const categoryToTypeMap: Record<string, string> = {
  movies: 'movie',
  events: 'event',
  sports: 'sports',
  stream: 'stream',
  plays: 'play',
};

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, location } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    genre: '',
    location: '',
    language: '',
  });
  const [tmdbMovies, setTmdbMovies] = useState<Event[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  const category = categories.find((c) => c.id === id);
  const eventType = id ? categoryToTypeMap[id] : null;

  useEffect(() => {
    if (eventType === 'movie') {
      const loadMovies = async () => {
        setIsLoadingMovies(true);
        const fetchedMovies = await fetchNowPlayingMovies(location.city);
        setTmdbMovies(fetchedMovies);
        setIsLoadingMovies(false);
      };
      loadMovies();
    }
  }, [eventType, location.city]);

  const categoryEvents = useMemo(() => {
    if (eventType === 'movie' && tmdbMovies.length > 0) {
      const byTitle = new Map<string, Event>();
      for (const movie of tmdbMovies) {
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
    }
    return events.filter((e) => e.type === eventType);
  }, [events, eventType, tmdbMovies]);

  const uniqueDates = useMemo(() => {
    const dates = categoryEvents.map(e => e.date.split(' • ')[0].split(', ')[0]);
    return Array.from(new Set(dates)).filter(Boolean);
  }, [categoryEvents]);

  const uniqueGenres = useMemo(() => {
    const genres = categoryEvents.flatMap(e => e.genre);
    return Array.from(new Set(genres)).filter(Boolean);
  }, [categoryEvents]);

  const uniqueLocations = useMemo(() => {
    const locations = categoryEvents.map(e => e.location);
    return Array.from(new Set(locations)).filter(Boolean);
  }, [categoryEvents]);

  const uniqueLanguages = useMemo(() => {
    const languages = categoryEvents.flatMap((e) =>
      (e.language || '')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(languages)).filter(Boolean);
  }, [categoryEvents]);

  const filteredEvents = categoryEvents.filter((e) => {
    const matchesDate = filters.date ? e.date.includes(filters.date) : true;
    const matchesGenre = filters.genre ? e.genre.includes(filters.genre) : true;
    const matchesLocation = filters.location ? e.location === filters.location : true;
    const eventLanguages = (e.language || '')
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean);
    const matchesLanguage = filters.language ? eventLanguages.includes(filters.language) : true;

    return matchesDate && matchesGenre && matchesLocation && matchesLanguage;
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <p>Category not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-24">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors mr-4"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{category.name}</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full border transition-colors ${
              showFilters || filters.date || filters.genre || filters.location
                ? 'bg-vibe-primary border-vibe-primary text-white'
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
            >
              <div className="pt-2 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={filters.genre}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                  >
                    <option value="">All Genres</option>
                    {uniqueGenres.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                  >
                    <option value="">Any Date</option>
                    {uniqueDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {eventType === 'movie' && (
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                  >
                    <option value="">All Languages</option>
                    {uniqueLanguages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                )}
                
                {(filters.date || filters.genre || filters.location || filters.language) && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setFilters({ date: '', genre: '', location: '', language: '' })}
                      className="text-xs text-vibe-primary font-medium hover:underline"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="p-4">
        {isLoadingMovies ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-32 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500">{filteredEvents.length} found</span>
            </div>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} variant={eventType === 'movie' ? 'compact' : 'large'} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <p>No events found matching your filters.</p>
            {(filters.date || filters.genre || filters.location || filters.language) && (
              <button
                onClick={() => setFilters({ date: '', genre: '', location: '', language: '' })}
                className="mt-4 text-vibe-primary text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
