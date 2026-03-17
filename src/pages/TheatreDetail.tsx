import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Phone, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { fetchNowPlayingMovies } from '../services/tmdb';
import { Event } from '../data/mockData';

export default function TheatreDetail() {
  const { id, name } = useParams<{ id: string, name: string }>();
  const decodedName = decodeURIComponent(name || '');
  const navigate = useNavigate();
  const { location } = useStore();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate dates array based on availableDates or fallback to next 5 days
  const dates = availableDates.length > 0 
    ? availableDates.map(dateStr => {
        // Parse date string as local date to avoid timezone issues
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let dayStr = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        if (date.getTime() === today.getTime()) dayStr = 'TODAY';
        else if (date.getTime() === tomorrow.getTime()) dayStr = 'TOM';

        return {
          day: dayStr,
          date: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          fullDate: date,
          apiDate: dateStr
        };
      })
    : Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          day: i === 0 ? 'TODAY' : i === 1 ? 'TOM' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          date: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          fullDate: date,
          apiDate: date.toISOString().split('T')[0] // YYYY-MM-DD
        };
      });

  const apiDate = dates[selectedDateIndex]?.apiDate;

  useEffect(() => {
    const loadShowtimes = async () => {
      if (!id || !apiDate) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/theatres/${id}/showtimes?city=${encodeURIComponent(location.city)}&date=${apiDate}`);
        if (response.ok) {
          const data = await response.json();
          setMovies(data.movies || []);
          
          if (data.availableDates && data.availableDates.length > 0) {
            // Only update if the dates actually changed to prevent unnecessary re-renders
            const newDates = [...data.availableDates].sort();
            setAvailableDates(prev => {
              if (prev.length !== newDates.length || !prev.every((val, index) => val === newDates[index])) {
                return newDates;
              }
              return prev;
            });
          }
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error('Error fetching showtimes:', error);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadShowtimes();
  }, [id, location.city, apiDate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-vibe-bg/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-vibe-card flex items-center justify-center text-white hover:bg-zinc-800 transition-colors mr-4 border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white leading-tight truncate pr-4">{decodedName}</h1>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 space-x-3 border-t border-white/5">
          {dates.map((date, index) => (
            <button
              key={index}
              onClick={() => setSelectedDateIndex(index)}
              className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-xl border transition-all ${
                selectedDateIndex === index
                  ? 'bg-vibe-primary border-vibe-primary text-white shadow-[0_0_15px_rgba(255,0,60,0.3)]'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider mb-1">{date.day}</span>
              <span className={`text-lg font-black leading-none ${selectedDateIndex === index ? 'text-white' : 'text-zinc-200'}`}>
                {date.date}
              </span>
              <span className="text-[10px] font-medium mt-1">{date.month}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Theatre Info */}
      <div className="px-4 py-4 bg-zinc-900/50 border-b border-white/5 mb-4">
        <div className="flex items-start gap-3 text-sm text-zinc-400 mb-2">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-vibe-primary" />
          <span>Located in {location.city}. Tap for directions.</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>M-Ticket</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>F&B Available</span>
          </div>
        </div>
      </div>

      {/* Movies List */}
      <div className="px-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 bg-zinc-900/50 rounded-2xl border border-white/5">
            No movies currently playing at this theatre.
          </div>
        ) : (
          movies.map(movie => {
            const showtimes = movie.showtimes || [];
            
            return (
              <div key={movie.id} className="bg-zinc-900 rounded-2xl p-4 border border-white/5">
                <div className="flex gap-4 mb-4">
                  <img 
                    src={movie.imageUrl} 
                    alt={movie.title} 
                    className="w-20 h-28 object-cover rounded-lg shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg leading-tight mb-1">{movie.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-zinc-300 uppercase">
                        {movie.language || 'Hindi'}
                      </span>
                      {movie.genre && movie.genre.length > 0 && (
                        <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-zinc-300 uppercase">
                          {movie.genre[0]}
                        </span>
                      )}
                    </div>
                    {movie.rating && (
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {movie.rating}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {showtimes.map((show, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/book/${movie.id}|${encodeURIComponent(show.time)}|${id}|${dates[selectedDateIndex].apiDate}`)}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-white/10 bg-zinc-800/50 hover:bg-zinc-800 hover:border-vibe-primary/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 mb-0.5">
                        {show.time}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                        {show.format}
                      </span>
                      {show.status === 'Filling Fast' && (
                        <span className="text-[9px] font-bold text-orange-400 mt-1">
                          Filling Fast
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
