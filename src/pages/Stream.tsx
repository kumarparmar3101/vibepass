import { Play, Star, Clock, Info } from 'lucide-react';
import { mockEvents } from '../data/mockData';
import { motion } from 'framer-motion';

export default function Stream() {
  const streamEvents = mockEvents.filter(e => e.type === 'movie');
  const featured = streamEvents[0];
  const trending = streamEvents.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-950 text-zinc-50 pb-24"
    >
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Stream</h1>
        </div>
      </header>

      {/* Featured Hero */}
      {featured && (
        <div className="relative h-[50vh] w-full group cursor-pointer">
          <img
            src={featured.imageUrl}
            alt={featured.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/60" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-rose-600/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg shadow-rose-600/50 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 ml-1" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-rose-500/20 backdrop-blur-md rounded-md border border-rose-500/20">
                Rent
              </span>
              <span className="text-xs font-medium text-zinc-300 flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                {featured.rating}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-1">{featured.title}</h2>
            <p className="text-sm text-zinc-400 line-clamp-2">{featured.description}</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-8 mt-4">
        {/* Trending Now */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">Trending Rentals</h2>
            <button className="text-xs font-semibold text-rose-500 hover:text-rose-400">See All</button>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-4">
            {trending.map((movie) => (
              <div key={movie.id} className="min-w-[140px] w-[140px] group cursor-pointer">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3">
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-white">₹{(movie.price * 0.4).toFixed(2)}</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 truncate">{movie.title}</h3>
                <div className="flex items-center text-xs text-zinc-500 mt-1 space-x-2">
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{movie.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-lg font-bold tracking-tight mb-4">Browse by Genre</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Action', 'Comedy', 'Drama', 'Sci-Fi'].map((genre) => (
              <button
                key={genre}
                className="h-20 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors group"
              >
                <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{genre}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
