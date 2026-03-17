import { useState, useEffect } from 'react';
import { MapPin, Star, Phone, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Theatre {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  rating: string;
}

export default function TheatreList({ city }: { city: string }) {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTheatres = async () => {
      if (!city) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/theatres?city=${encodeURIComponent(city)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch theatres');
        }
        const data = await response.json();
        setTheatres(data);
      } catch (err) {
        console.error('Error fetching theatres:', err);
        setError('Could not load theatres for this city.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheatres();
  }, [city]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (theatres.length === 0) {
    return (
      <div className="p-4 bg-white/5 rounded-2xl text-zinc-400 text-sm text-center">
        No theatres found in {city}.
      </div>
    );
  }

  const filteredTheatres = theatres.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedTheatres = isExpanded ? filteredTheatres : filteredTheatres.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search theatres..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-vibe-primary transition-colors"
        />
      </div>

      {/* Theatre List */}
      <div className="space-y-4">
        {displayedTheatres.length > 0 ? (
          displayedTheatres.map((theatre, index) => (
            <div 
              key={index} 
              onClick={() => navigate(`/theatre/${theatre.id}/${encodeURIComponent(theatre.name)}`)}
              className="bg-zinc-900 rounded-2xl p-4 border border-white/5 cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white">{theatre.name}</h3>
                {theatre.rating !== 'N/A' && (
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {theatre.rating}
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-sm text-zinc-400">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{theatre.address}</span>
                </div>
                {theatre.phone !== 'N/A' && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{theatre.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 bg-white/5 rounded-2xl text-zinc-400 text-sm text-center">
            No theatres found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {filteredTheatres.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-vibe-primary hover:text-vibe-primary-hover transition-colors bg-vibe-primary/10 rounded-xl"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>See All {filteredTheatres.length} Theatres <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
