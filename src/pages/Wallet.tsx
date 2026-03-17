import { mockEvents, Event } from '../data/mockData';
import { Share2, CalendarPlus, Download, Navigation, Car, Popcorn, Star, Ticket as TicketIcon, Clock, MapPin, QrCode, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { fetchMovieDetails } from '../services/tmdb';
import { useStore } from '../store/useStore';

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

// Countdown Timer Component
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    // Mock target date for demonstration (e.g., 1 hour from now)
    const target = new Date();
    target.setHours(target.getHours() + 1);
    target.setMinutes(target.getMinutes() + 14);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Show started');
        setIsUrgent(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      setTimeLeft(`Starts in ${hours}h ${minutes}m`);
      setIsUrgent(hours < 2);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${isUrgent ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
      <Clock className="w-3 h-3 mr-1" />
      {timeLeft || 'Calculating...'}
    </div>
  );
};

const TicketCard = ({ order }: { order: any; key?: string }) => {
  const [showQR, setShowQR] = useState(false);
  const event = order.eventDetails;

  if (!event) return null;

  // Mock data for the new features
  const format = 'IMAX 3D';
  const seats = order.seats?.join(', ') || 'General Admission';
  const screen = 'Screen 3';
  const distance = '2.4 km';
  const hasParking = true;

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
        {/* Background Poster */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-md"
          style={{ backgroundImage: `url(${event.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-zinc-900/40" />

        <div className="relative z-10">
          {/* Top Section: Movie Info */}
          <div className="p-5 pb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-[10px] font-black tracking-wider uppercase rounded mb-2">
                  {format}
                </span>
                <h3 className="text-2xl font-black text-white leading-tight mb-1">{event.title}</h3>
                <CountdownTimer targetDate={event.date} />
              </div>
              <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-lg">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Date & Time</p>
                <p className="text-sm font-bold text-white">{event.date}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Seats</p>
                <p className="text-xl font-black text-vibe-primary">{seats}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">{event.location}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{screen}</span>
                    <span>•</span>
                    <span>{distance}</span>
                    {hasParking && (
                      <>
                        <span>•</span>
                        <span className="flex items-center"><Car className="w-3 h-3 mr-1" /> Parking</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="relative flex items-center px-2">
            <div className="w-4 h-8 bg-zinc-950 rounded-r-full absolute left-0 -translate-y-1/2 top-1/2 border-r border-y border-white/10" />
            <div className="flex-1 border-t-2 border-dashed border-white/20" />
            <div className="w-4 h-8 bg-zinc-950 rounded-l-full absolute right-0 -translate-y-1/2 top-1/2 border-l border-y border-white/10" />
          </div>

          {/* Bottom Section: Actions & QR */}
          <div className="p-5 pt-6 bg-zinc-900/50 backdrop-blur-sm">
            <button 
              onClick={() => setShowQR(true)}
              className="w-full py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:bg-zinc-200 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              Show Ticket at Gate
            </button>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors">
                <Navigation className="w-4 h-4 text-blue-400" />
                Get Directions
              </button>
              <button className="flex items-center justify-center gap-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-xs font-medium text-amber-500 transition-colors">
                <span className="text-base">🍿</span>
                Pre-order snacks
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                <CalendarPlus className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">Calendar</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6"
          >
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-safe-pt right-4 p-2 bg-white/10 rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center">
              <h3 className="text-2xl font-black text-black mb-2">{event.title}</h3>
              <p className="text-zinc-500 font-medium mb-6">{event.date}</p>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-6">
                <QRCodeSVG value={`ticket:${order.id}`} size={200} level="H" />
              </div>
              
              <div className="w-full bg-zinc-100 rounded-xl p-4 mb-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Seats</p>
                <p className="text-3xl font-black text-black">{seats}</p>
              </div>
              <p className="text-xs text-zinc-400 mt-4">Screen brightness is maximized</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const PastTicketCard = ({ order }: { order: any; key?: string }) => {
  const event = order.eventDetails;
  if (!event) return null;

  return (
    <div className="relative bg-zinc-900/50 rounded-2xl p-4 border border-white/5 flex space-x-4 overflow-hidden opacity-60 hover:opacity-100 transition-opacity group">
      {/* USED Watermark */}
      <div className="absolute -right-4 -top-4 border-4 border-zinc-500/30 text-zinc-500/30 font-black text-2xl uppercase tracking-widest px-4 py-1 rounded-lg transform rotate-12 pointer-events-none">
        Watched
      </div>

      <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-bold text-white mb-1 line-clamp-1">{event.title}</h3>
          <div className="flex items-center space-x-1 text-xs text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>{event.date}</span>
          </div>
        </div>
        
        <button className="flex items-center gap-1.5 text-xs font-bold text-vibe-primary mt-3 py-1.5 px-3 bg-vibe-primary/10 rounded-lg w-fit hover:bg-vibe-primary/20 transition-colors">
          <Star className="w-3.5 h-3.5 fill-current" />
          Rate & Review
        </button>
      </div>
    </div>
  );
};

const StatsBar = ({ orders }: { orders: any[] }) => {
  const pastOrders = orders.filter(order => {
    if (!order.eventDetails?.date) return true;
    const eventDateStr = order.eventDetails.date.split(' • ')[0];
    const eventDate = new Date(eventDateStr);
    return eventDate < new Date();
  });

  const totalSpent = pastOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalSaved = pastOrders.length * 30; // Mock savings

  return (
    <div className="bg-gradient-to-r from-vibe-primary/20 to-purple-500/20 border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-vibe-primary/20 flex items-center justify-center text-xl">
          🎬
        </div>
        <div>
          <p className="text-sm font-bold text-white">{pastOrders.length} movies watched</p>
          <p className="text-xs text-zinc-400">₹{totalSpent} spent · <span className="text-emerald-400 font-medium">₹{totalSaved} saved</span></p>
        </div>
      </div>
    </div>
  );
};

export default function Wallet() {
  const { events, location, user } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.id)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedOrders: any[] = [];
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          let eventDetails = null;
          
          const movieId = data.eventId?.split('|')[0];
          const showTime = data.eventId?.split('|')[1] ? decodeURIComponent(data.eventId.split('|')[1]) : null;
          const cinemaName = data.eventId?.split('|')[4] ? decodeURIComponent(data.eventId.split('|')[4]) : null;

          if (movieId?.startsWith('paytm-') || movieId?.startsWith('tmdb-')) {
            eventDetails = await fetchMovieDetails(movieId, location.city);
            if (eventDetails && showTime) {
              eventDetails.date = `${eventDetails.date} • ${showTime}`;
            }
            if (eventDetails && cinemaName) {
              eventDetails.location = cinemaName;
            }
          } else {
            eventDetails = events.find((e) => e.id === movieId);
          }

          fetchedOrders.push({
            id: doc.id,
            ...data,
            eventDetails
          });
        }
        
        // Sort orders by createdAt descending
        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setOrders(fetchedOrders);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [events, location.city, user]);

  const upcomingOrders = orders.filter(o => o.status === 'confirmed');
  const pastOrders = orders.filter(o => o.status !== 'confirmed');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-950 text-zinc-50 pb-24"
    >
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Your Wallet</h1>
        </div>
      </header>

      <div className="p-4">
        <StatsBar orders={orders} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-vibe-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No tickets found.</p>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4 text-zinc-300">Upcoming</h2>
              <div className="space-y-6">
                {upcomingOrders.map((order) => (
                  <TicketCard key={order.id} order={order} />
                ))}
              </div>
            </section>

            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-zinc-500">Past Events</h2>
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <PastTicketCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
