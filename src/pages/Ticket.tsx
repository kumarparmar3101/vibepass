import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, MapPin, Calendar, Sun, Instagram, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShareModal from '../components/ShareModal';
import { useStore } from '../store/useStore';
import { fetchMovieDetails } from '../services/tmdb';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Ticket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cart, events, location, user } = useStore();
  const [event, setEvent] = useState<any>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBrightnessBoosted, setIsBrightnessBoosted] = useState(false);
  const [cachedTicket, setCachedTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  const movieId = id?.split('|')[0];
  const showTime = id?.split('|')[1] ? decodeURIComponent(id.split('|')[1]) : null;
  const cinemaName = id?.split('|')[4] ? decodeURIComponent(id.split('|')[4]) : null;

  useEffect(() => {
    const loadEventAndOrder = async () => {
      setIsLoading(true);
      
      // Load event details
      if (movieId?.startsWith('paytm-') || movieId?.startsWith('tmdb-')) {
        const fetchedEvent = await fetchMovieDetails(movieId, location.city);
        if (fetchedEvent && showTime) {
          fetchedEvent.date = `${fetchedEvent.date} • ${showTime}`;
        }
        if (fetchedEvent && cinemaName) {
          fetchedEvent.location = cinemaName;
        }
        setEvent(fetchedEvent);
      } else {
        const found = events.find((e) => e.id === movieId);
        setEvent(found || null);
      }

      // Load order details from Firebase
      if (user && movieId) {
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.id)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            // Filter by eventId and sort in memory to avoid composite index requirement
            const docs = querySnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() as any }))
              .filter(doc => doc.eventId === id);
              
            if (docs.length > 0) {
              docs.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
              });
              setOrderData(docs[0]);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'orders');
        }
      }

      setIsLoading(false);
    };
    loadEventAndOrder();
  }, [movieId, showTime, events, location.city, user, id]);

  // Generate a mock order ID based on the event id if not found in Firebase
  const fallbackOrderId = `VB-${Math.floor(Math.random() * 900000) + 100000}`;
  const displayOrderId = orderData?.id || fallbackOrderId;
  const displaySeats = orderData?.seats || (cart.eventId === id ? cart.seats : []);

  const [showCashbackOffer, setShowCashbackOffer] = useState(false);

  // Local caching logic
  useEffect(() => {
    if (event) {
      const ticketData = {
        eventId: id,
        title: event.title,
        date: event.date,
        location: event.location,
        seats: displaySeats,
        orderId: displayOrderId,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VibePass-Ticket-${displayOrderId}`
      };
      localStorage.setItem(`ticket_${id}`, JSON.stringify(ticketData));
      setCachedTicket(ticketData);
      
      // Clear cart after successful booking
      if (cart.eventId === id) {
        useStore.getState().clearCart();
      }

      // Show cashback offer after a short delay
      setTimeout(() => {
        setShowCashbackOffer(true);
      }, 1500);

    } else if (!isLoading) {
      const cached = localStorage.getItem(`ticket_${id}`);
      if (cached) {
        setCachedTicket(JSON.parse(cached));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, id, isLoading, displayOrderId]); // Removed cart to prevent infinite loops

  // Brightness boost logic
  useEffect(() => {
    // Simulate brightness boost by adding a class to body or just showing a visual indicator
    setIsBrightnessBoosted(true);
    
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        // Ignore NotAllowedError as it's expected in some environments (like iframes)
        if (err.name !== 'NotAllowedError') {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };
    
    // Only request wake lock if the document is visible and focused
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  const displayEvent = event || cachedTicket;

  if (!displayEvent) return <div className="p-8 text-center text-zinc-500">Ticket not found</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24 relative"
    >
      {/* Brightness Boost Overlay Indicator */}
      <AnimatePresence>
        {isBrightnessBoosted && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-safe left-1/2 -translate-x-1/2 z-50 mt-4 bg-white text-black px-4 py-2 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center space-x-2 pointer-events-none"
          >
            <Sun className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Max Brightness</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-vibe-card flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Your Ticket</h1>
          <button 
            onClick={() => setIsShareOpen(true)}
            className="w-10 h-10 rounded-full bg-vibe-card flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-white/5"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Ticket Card */}
      <div className="p-6">
        <div className="bg-vibe-card rounded-[32px] overflow-hidden shadow-2xl shadow-black/50 border border-white/5 relative">
          
          {/* Top Section - Image */}
          <div className="relative h-48 w-full">
            {displayEvent.imageUrl ? (
              <img
                src={displayEvent.imageUrl}
                alt={displayEvent.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-500">Offline Mode</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-vibe-card via-vibe-card/40 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-vibe-primary/20 backdrop-blur-md rounded-full border border-vibe-primary/20">
                  {displayEvent.type || 'Event'}
                </span>
                {!event && (
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-200 bg-yellow-500/20 backdrop-blur-md rounded-full border border-yellow-500/20">
                    Offline
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">{displayEvent.title}</h2>
            </div>
          </div>

          {/* Middle Section - Details */}
          <div className="p-6 border-b border-dashed border-zinc-700 relative bg-vibe-card">
            {/* Cutouts */}
            <div className="absolute -left-4 -bottom-4 w-8 h-8 rounded-full bg-vibe-bg border-r border-t border-white/5" />
            <div className="absolute -right-4 -bottom-4 w-8 h-8 rounded-full bg-vibe-bg border-l border-t border-white/5" />

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Calendar className="w-5 h-5 text-vibe-primary mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-sm font-semibold text-zinc-200">{displayEvent.date}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="w-5 h-5 text-vibe-primary mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Venue</p>
                  <p className="text-sm font-semibold text-zinc-200">{displayEvent.location}</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayEvent.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-vibe-primary mt-1 hover:text-vibe-primary-hover"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Seats / Type</p>
                  <p className="text-sm font-bold text-zinc-200">
                    {displayEvent.seats && displayEvent.seats.length > 0 
                      ? displayEvent.seats.join(', ') 
                      : (displayEvent.type === 'movie' ? 'F12, F13' : 'General Admission')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-sm font-bold text-zinc-200">#{displayEvent.orderId || displayOrderId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - QR Code */}
          <div className="p-8 flex flex-col items-center justify-center bg-white relative">
            <div className="w-48 h-48 bg-zinc-100 rounded-xl flex items-center justify-center mb-4 p-2 relative z-10">
              <img 
                src={displayEvent.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VibePass-Ticket-${displayOrderId}`} 
                alt="QR Code"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center relative z-10">Scan at Entry</p>
            {/* Brightness glow effect behind QR */}
            <div className="absolute inset-0 bg-white shadow-[0_0_100px_rgba(255,255,255,1)] pointer-events-none z-0"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <button className="w-full py-4 rounded-2xl font-bold tracking-wide bg-vibe-card hover:bg-zinc-800 text-white border border-white/10 flex items-center justify-center space-x-2 transition-colors">
            <Download className="w-5 h-5" />
            <span>Add to Apple Wallet</span>
          </button>
        </div>
      </div>
      
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        title={displayEvent.title} 
      />

      {/* Cashback Bottom Sheet */}
      <AnimatePresence>
        {showCashbackOffer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCashbackOffer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900 rounded-t-[32px] p-6 z-50 border-t border-white/10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <button 
                  onClick={() => setShowCashbackOffer(false)}
                  className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-black text-white mb-2">Your ticket is confirmed! 🎬</h2>
              <p className="text-zinc-400 mb-6">
                Post about it on Instagram and earn <span className="text-emerald-400 font-bold">₹50–₹150 cashback</span> to your VibePass Wallet — automatically verified.
              </p>

              <div className="bg-zinc-950 rounded-2xl p-4 border border-white/5 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">Story tagged @VibePassIndia</span>
                  <span className="text-sm font-bold text-emerald-400">₹50</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">Story + Highlight</span>
                  <span className="text-sm font-bold text-emerald-400">₹100</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-300">Feed Post</span>
                  <span className="text-sm font-bold text-emerald-400">₹100</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-300">Reel</span>
                  <span className="text-sm font-bold text-emerald-400">₹150</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowCashbackOffer(false);
                    // Could save intent here
                  }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/25 hover:opacity-90 transition-opacity"
                >
                  Claim After I Post
                </button>
                <button 
                  onClick={() => setShowCashbackOffer(false)}
                  className="w-full py-4 bg-transparent text-zinc-400 font-bold rounded-2xl hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
