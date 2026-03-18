import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share, Heart, Calendar, MapPin, Clock, Star, Play, X } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import VenueMap from '../components/VenueMap';
import ShareModal from '../components/ShareModal';
import { useStore } from '../store/useStore';
import { fetchMovieDetails, fetchTrailerFromTMDB, fetchMovieCredits } from '../services/tmdb';
import { Event } from '../data/mockData';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, location, user } = useStore();
  const [localEvent, setLocalEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [dynamicTrailerUrl, setDynamicTrailerUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState<{cast: any[], crew: any[]}>({ cast: [], crew: [] });
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistDocId, setWatchlistDocId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      let eventData: Event | null = null;
      if (id?.startsWith('paytm-') || id?.startsWith('tmdb-')) {
        eventData = await fetchMovieDetails(id, location.city);
        setLocalEvent(eventData);
      } else {
        const found = events.find((e) => e.id === id);
        eventData = found || null;
        setLocalEvent(eventData);
      }
      
      // Always fetch a fresh, reliable trailer from TMDB/YouTube
      // Ignore the Paytm trailer as it's often broken or "NA"
      if (eventData) {
        const trailer = await fetchTrailerFromTMDB(eventData.title);
        if (trailer) {
          setDynamicTrailerUrl(trailer);
        }
        
        if (eventData.type === 'movie') {
          const movieCredits = await fetchMovieCredits(eventData.title);
          setCredits(movieCredits);
        }
      }
      
      setIsLoading(false);
    };
    loadEvent();
  }, [id, events, location.city]);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user || !id) return;
      try {
        const q = query(collection(db, 'watchlist'), where('userId', '==', user.id), where('movieId', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsWatchlisted(true);
          setWatchlistDocId(snap.docs[0].id);
        } else {
          setIsWatchlisted(false);
          setWatchlistDocId(null);
        }
      } catch (error) {
        console.error("Error checking watchlist:", error);
      }
    };
    checkWatchlist();
  }, [user, id]);

  const toggleWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;

    try {
      if (isWatchlisted && watchlistDocId) {
        await deleteDoc(doc(db, 'watchlist', watchlistDocId));
        setIsWatchlisted(false);
        setWatchlistDocId(null);
      } else {
        const docRef = await addDoc(collection(db, 'watchlist'), {
          userId: user.id,
          movieId: id,
          createdAt: serverTimestamp()
        });
        setIsWatchlisted(true);
        setWatchlistDocId(docRef.id);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    }
  };

  const { scrollYProgress } = useScroll({
    container: containerRef
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  const getYoutubeId = (url: string) => {
    if (!url || url === 'NA') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Force using the dynamic trailer URL we fetched, ignoring localEvent.trailerUrl
  const activeTrailerUrl = dynamicTrailerUrl;
  const youtubeId = activeTrailerUrl ? getYoutubeId(activeTrailerUrl) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-screen bg-vibe-bg text-zinc-50 overflow-y-auto hide-scrollbar relative"
      ref={containerRef}
    >
      {isLoading ? (
        <div className="p-8 text-center text-zinc-500 mt-20">Loading...</div>
      ) : !localEvent ? (
        <div className="p-8 text-center text-zinc-500 mt-20">Event not found</div>
      ) : (
        <>
          {/* Immersive Header with Parallax */}
          <div className="relative h-[70vh] w-full overflow-hidden">
            <motion.div 
              layoutId={`event-image-${localEvent.id}`}
              className="absolute inset-0 w-full h-full"
              style={{ y: imageY, opacity: imageOpacity }}
            >
              {localEvent.videoUrl ? (
                <video
                  src={localEvent.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={localEvent.imageUrl}
                  alt={localEvent.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-vibe-bg via-vibe-bg/40 to-black/60" />
            </motion.div>
            
            {/* Play Button Overlay (Simulating Video Trailer) */}
            {(youtubeId || localEvent.videoUrl) && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Play button clicked! Opening modal...');
                    setIsPlayingTrailer(true);
                  }}
                  className="w-20 h-20 rounded-full bg-vibe-primary/80 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,0,60,0.5)] cursor-pointer hover:scale-110 transition-transform"
                >
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </button>
              </div>
            )}
            
            {/* Top Nav */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center z-10">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleWatchlist}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-vibe-primary text-vibe-primary' : ''}`} />
                </button>
              </div>
            </div>

            {/* Title Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <div className="flex flex-wrap gap-2 mb-3">
                {localEvent.genre.map((g) => (
                  <span key={g} className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-200 bg-vibe-primary/20 backdrop-blur-md rounded-full border border-vibe-primary/20">
                    {g}
                  </span>
                ))}
                {localEvent.status && localEvent.status !== 'Scheduled' && (
                  <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border backdrop-blur-md ${
                    localEvent.status === 'Cancelled' 
                      ? 'text-rose-200 bg-rose-500/20 border-rose-500/20' 
                      : 'text-yellow-200 bg-yellow-500/20 border-yellow-500/20'
                  }`}>
                    {localEvent.status}
                  </span>
                )}
              </div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-black text-white leading-tight mb-2"
              >
                {localEvent.title}
              </motion.h1>
              {localEvent.rating && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  <span className="font-bold text-lg">{localEvent.rating}</span>
                  <span className="text-sm text-zinc-400 font-medium">/ 5</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 relative z-10 bg-vibe-bg pb-32">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 bg-vibe-card p-4 rounded-2xl border border-white/5">
                <Calendar className="w-5 h-5 text-vibe-primary mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-sm font-semibold text-zinc-200">{localEvent.date}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-vibe-card p-4 rounded-2xl border border-white/5">
                <MapPin className="w-5 h-5 text-vibe-primary mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-semibold text-zinc-200 line-clamp-2">{localEvent.location}</p>
                </div>
              </div>
            </div>

            {/* Venue Map */}
            <div>
              <h3 className="text-lg font-bold mb-1">Venue</h3>
              <p className="text-sm text-zinc-400">{localEvent.location}</p>
              <VenueMap location={localEvent.location} />
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-bold mb-3">About</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{localEvent.description}</p>
            </div>

            {/* Cast */}
            {credits.cast.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">Cast</h3>
                <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-2">
                  {credits.cast.map((person: any) => (
                    <div key={person.id} className="flex-shrink-0 w-24 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden mb-2 bg-zinc-800">
                        {person.profile_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            No Image
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 truncate">{person.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">as {person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crew */}
            {credits.crew.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">Crew</h3>
                <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-2">
                  {credits.crew.map((person: any) => (
                    <div key={person.credit_id} className="flex-shrink-0 w-24 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden mb-2 bg-zinc-800">
                        {person.profile_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            No Image
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 truncate">{person.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{person.job}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-vibe-bg/90 backdrop-blur-xl border-t border-white/10 pb-safe z-20">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-0.5">Price</p>
                <p className="text-2xl font-black text-white">₹{localEvent.price}</p>
              </div>
              <button
                onClick={() => {
                  if (localEvent.type === 'movie') {
                    navigate(`/movie/${localEvent.id}/showtimes/${encodeURIComponent(localEvent.title)}`);
                  } else {
                    navigate(`/book/${localEvent.id}`);
                  }
                }}
                disabled={localEvent.status === 'Cancelled'}
                className={`px-8 py-4 rounded-full font-bold tracking-wide transition-colors shadow-[0_0_20px_rgba(255,0,60,0.3)] ${
                  localEvent.status === 'Cancelled' 
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed shadow-none' 
                    : 'bg-vibe-primary hover:bg-vibe-primary-hover text-white'
                }`}
              >
                {localEvent.status === 'Cancelled' ? 'Unavailable' : 'Book Now'}
              </button>
            </div>
          </div>
          
          <ShareModal 
            isOpen={isShareOpen} 
            onClose={() => setIsShareOpen(false)} 
            title={localEvent.title} 
          />

          {/* Trailer Modal */}
          {createPortal(
            <AnimatePresence>
              {isPlayingTrailer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm pointer-events-auto"
                >
                  <button
                    onClick={() => {
                      console.log('Closing modal...');
                      setIsPlayingTrailer(false);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[100000]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-full max-w-4xl aspect-video px-4 relative z-[99999] flex flex-col items-center">
                    {youtubeId ? (
                      <>
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="rounded-xl shadow-2xl bg-black"
                        ></iframe>
                        <a 
                          href={`https://www.youtube.com/watch?v=${youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 text-white/60 hover:text-white text-sm underline transition-colors"
                        >
                          Video blocked by your browser? Watch directly on YouTube
                        </a>
                      </>
                    ) : localEvent?.videoUrl ? (
                      <video
                        src={localEvent.videoUrl}
                        className="w-full h-full rounded-xl shadow-2xl bg-black"
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </motion.div>
  );
}
