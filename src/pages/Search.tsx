import { Search as SearchIcon, Mic, X, Filter, Clock, MapPin, Star, Flame, Check } from 'lucide-react';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import EventCard from '../components/EventCard';
import CitySelector from '../components/CitySelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';

const PLACEHOLDERS = ["Avengers...", "Comedy shows...", "IMAX near you...", "Live music..."];

export default function Search() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : ['Dune', 'Comedy', 'Concerts', 'IMAX'];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    genre: '',
    location: '',
  });
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const { events, location } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMovies = async () => {
      const { fetchNowPlayingMovies } = await import('../services/tmdb');
      const fetchedMovies = await fetchNowPlayingMovies(location.city);
      setTmdbMovies(fetchedMovies);
    };
    loadMovies();
  }, [location.city]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [query]);

  const allEvents = useMemo(() => {
    const localNonMovies = events.filter(e => e.type !== 'movie');
    return [...tmdbMovies, ...localNonMovies];
  }, [events, tmdbMovies]);

  const uniqueDates = useMemo(() => {
    const dates = allEvents.map(e => e.date.split(' • ')[0].split(', ')[0]);
    return Array.from(new Set(dates)).filter(Boolean);
  }, [allEvents]);

  const uniqueGenres = useMemo(() => {
    const genres = allEvents.flatMap(e => e.genre);
    return Array.from(new Set(genres)).filter(Boolean);
  }, [allEvents]);

  const uniqueLocations = useMemo(() => {
    const locations = allEvents.map(e => e.location);
    return Array.from(new Set(locations)).filter(Boolean);
  }, [allEvents]);

  const filteredEvents = allEvents.filter((e) => {
    const matchesQuery =
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.genre.some((g) => g.toLowerCase().includes(query.toLowerCase())) ||
      e.location.toLowerCase().includes(query.toLowerCase());

    const matchesDate = filters.date ? e.date.includes(filters.date) : true;
    const matchesGenre = filters.genre ? e.genre.includes(filters.genre) : true;
    const matchesLocation = filters.location ? e.location === filters.location : true;
    const matchesLanguage = selectedLanguage ? e.language === selectedLanguage : true;
    const matchesFormat = selectedFormat ? e.format?.includes(selectedFormat) : true;

    return matchesQuery && matchesDate && matchesGenre && matchesLocation && matchesLanguage && matchesFormat;
  });

  const autocompleteResults = useMemo(() => {
    if (!query) return [];
    return allEvents.filter(e => e.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }, [query, allEvents]);

  const isFiltering = query || filters.date || filters.genre || filters.location || selectedLanguage || selectedFormat;
  const activeFilterCount = (filters.date ? 1 : 0) + (filters.genre ? 1 : 0) + (filters.location ? 1 : 0) + (selectedLanguage ? 1 : 0) + (selectedFormat ? 1 : 0);

  const saveRecentSearch = (term: string) => {
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(t => t !== term)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const trendingEvents = allEvents.filter(e => e.isTrending).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-vibe-bg bg-noise text-zinc-50 pb-24"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/90 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <SearchIcon className="absolute left-4 w-5 h-5 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder={PLACEHOLDERS[placeholderIndex]}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="w-full bg-vibe-card border border-white/10 rounded-full py-3 pl-12 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-vibe-primary transition-colors"
              />
              {isFocused && (
                <motion.div 
                  className="absolute left-[44px] w-[1px] h-5 bg-vibe-primary"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 w-5 h-5 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute right-4 flex items-center justify-center w-5 h-5">
                  <Mic className="w-4 h-4 text-zinc-500" />
                  {isFocused && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-vibe-primary"
                      animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-3 rounded-full border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-vibe-primary border-vibe-primary text-white'
                  : 'bg-vibe-card border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full border-2 border-vibe-primary" />
              )}
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isFocused && query && autocompleteResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-4 right-16 mt-2 bg-vibe-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {autocompleteResults.map(result => (
                  <div
                    key={result.id}
                    onClick={() => {
                      setQuery(result.title);
                      saveRecentSearch(result.title);
                      setIsFocused(false);
                      navigate(`/event/${result.id}`);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                  >
                    <img src={result.imageUrl} alt={result.title} className="w-10 h-14 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{result.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{result.genre.join(', ')}</p>
                    </div>
                    {result.rating && (
                      <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-white">{result.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Filter Strip */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4 pb-1">
            {['Hindi', 'English', 'Tamil', 'IMAX', '4DX', 'Dolby'].map(filter => {
              const isLang = ['Hindi', 'English', 'Tamil'].includes(filter);
              const isSelected = isLang ? selectedLanguage === filter : selectedFormat === filter;
              return (
                <button
                  key={filter}
                  onClick={() => {
                    if (isLang) setSelectedLanguage(isSelected ? '' : filter);
                    else setSelectedFormat(isSelected ? '' : filter);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    isSelected 
                      ? 'bg-vibe-primary/20 border-vibe-primary text-vibe-primary' 
                      : 'bg-vibe-card border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Full Filters Bottom Sheet (Simulated) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={filters.genre}
                      onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                      className="bg-vibe-card border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                    >
                      <option value="">All Genres</option>
                      {uniqueGenres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={filters.date}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="bg-vibe-card border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
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
                    className="w-full bg-vibe-card border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vibe-primary appearance-none"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        setFilters({ date: '', genre: '', location: '' });
                        setSelectedLanguage('');
                        setSelectedFormat('');
                      }}
                      className="text-xs text-zinc-400 font-medium hover:text-white"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 bg-vibe-primary text-white text-xs font-bold rounded-full"
                    >
                      Show {filteredEvents.length} results
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="p-4">
        {isFiltering ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                Search Results
              </h2>
              {!isLoading && <span className="text-xs text-zinc-500">{filteredEvents.length} found</span>}
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-24 h-32 bg-white/10 rounded-xl" />
                    <div className="flex-1 py-2 space-y-3">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                      <div className="h-3 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>No results found</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setFilters({ date: '', genre: '', location: '' });
                    setSelectedLanguage('');
                    setSelectedFormat('');
                  }}
                  className="mt-4 text-vibe-primary text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <CitySelector isOpen={showCitySelector} onClose={() => setShowCitySelector(false)} />
            
            {/* Location Context */}
            <section>
              <div 
                className="bg-vibe-card border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setShowCitySelector(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vibe-primary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-vibe-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{location.city}</h3>
                    <p className="text-xs text-zinc-400">3 shows near you tonight</p>
                  </div>
                </div>
                <span className="text-vibe-primary text-lg">→</span>
              </div>
            </section>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Recent Searches
                  </h2>
                  <button 
                    onClick={() => setRecentSearches([])}
                    className="text-xs text-vibe-primary font-medium hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                  {recentSearches.map((term, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={term}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-vibe-card border border-white/5 text-sm font-medium text-zinc-300 whitespace-nowrap group"
                    >
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span onClick={() => setQuery(term)} className="cursor-pointer">{term}</span>
                      <button 
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Now */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                  Trending in {location.city}
                </h2>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4">
                {trendingEvents.map(event => (
                  <Link key={event.id} to={`/event/${event.id}`} onClick={() => saveRecentSearch(event.title)} className="block min-w-[140px] w-[140px] group">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Hot
                      </div>
                      {event.rating && (
                        <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-bold text-white">{event.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 truncate">{event.title}</h3>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{event.genre.join(', ')} • {event.language || 'English'}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Genres Grid */}
            <section>
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                Popular Genres
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Movies', count: '24 Shows', image: 'https://picsum.photos/seed/movies/400/600', color: 'from-orange-500/80 to-red-600/80', height: 'h-40' },
                  { name: 'Live Music', count: '12 Events', image: 'https://picsum.photos/seed/concert/400/600', color: 'from-emerald-500/80 to-teal-600/80', height: 'h-32' },
                  { name: 'Comedy', count: '8 Shows', image: 'https://picsum.photos/seed/comedy/400/600', color: 'from-purple-500/80 to-pink-600/80', height: 'h-32' },
                  { name: 'Sports', count: '5 Matches', image: 'https://picsum.photos/seed/sports/400/600', color: 'from-blue-500/80 to-indigo-600/80', height: 'h-40' },
                  { name: 'Theatre', count: '3 Plays', image: 'https://picsum.photos/seed/theatre/400/600', color: 'from-amber-500/80 to-yellow-600/80', height: 'h-32' },
                  { name: 'Kids', count: '10 Events', image: 'https://picsum.photos/seed/kids/400/600', color: 'from-cyan-500/80 to-blue-600/80', height: 'h-32' },
                ].map((genre, i) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={genre.name}
                    onClick={() => setQuery(genre.name)}
                    className={`${genre.height} rounded-2xl p-4 flex flex-col justify-end relative overflow-hidden group ${i % 2 !== 0 ? 'mt-8 -mb-8' : ''}`}
                  >
                    <img src={genre.image} alt={genre.name} className="absolute inset-0 w-full h-full object-cover blur-sm group-hover:blur-none transition-all duration-500 group-hover:scale-110" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="relative z-10 text-left">
                      <span className="block font-bold text-white text-lg tracking-wide mb-1">
                        {genre.name}
                      </span>
                      <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white">
                        {genre.count}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );
}
