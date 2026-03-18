import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Trash2, Loader2, Bookmark } from 'lucide-react';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { fetchMovieDetails } from '../services/tmdb';

export default function Watchlist() {
  const navigate = useNavigate();
  const { user, location } = useStore();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchWatchlist();
  }, [user, navigate, location.city]);

  const fetchWatchlist = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'watchlist'), where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      const items = [];
      for (const d of querySnapshot.docs) {
        const data = d.data();
        let details = null;
        
        if (data.movieId.startsWith('tmdb-') || data.movieId.startsWith('paytm-')) {
          details = await fetchMovieDetails(data.movieId, location.city);
        } else {
          // Fallback for mock data events if any
          details = useStore.getState().events.find(e => e.id === data.movieId);
        }
        
        if (details) {
          items.push({ id: d.id, ...data, details });
        }
      }
      
      setWatchlist(items);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'watchlist', id));
      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24 relative"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">My Watchlist</h1>
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-vibe-primary" />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-12 bg-vibe-card rounded-3xl border border-white/5">
            <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Your watchlist is empty</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-[200px] mx-auto">
              Save movies you want to watch later by tapping the bookmark icon.
            </p>
            <button 
              onClick={() => navigate('/stream')}
              className="bg-vibe-primary text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-vibe-primary-hover transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlist.map((item) => (
              <div key={item.id} className="bg-vibe-card border border-white/5 rounded-2xl p-3 flex space-x-4">
                <div 
                  className="w-24 h-36 rounded-xl overflow-hidden shrink-0 relative cursor-pointer"
                  onClick={() => navigate(`/event/${item.movieId}`)}
                >
                  <img src={item.details.imageUrl} alt={item.details.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
                
                <div className="flex-1 py-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white line-clamp-2 leading-tight mb-1">
                      {item.details.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-zinc-400 mb-2">
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-current mr-1" />
                        {item.details.rating}
                      </span>
                      <span>•</span>
                      <span>{item.details.genre[0]}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => navigate(`/event/${item.movieId}`)}
                      className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Book Tickets
                    </button>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
