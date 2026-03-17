import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { fetchMovieDetails } from '../services/tmdb';
import { Event } from '../data/mockData';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

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

interface SeatSection {
  name: string;
  price: number;
  rows: string[];
  blocks: number[];
}

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCart, events, location } = useStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketCount, setTicketCount] = useState(1);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [showSeatQuantityModal, setShowSeatQuantityModal] = useState(true);
  const [targetSeatCount, setTargetSeatCount] = useState(2);
  const [isReserving, setIsReserving] = useState(false);

  const movieId = id?.split('|')[0];
  const showTime = id?.split('|')[1] ? decodeURIComponent(id.split('|')[1]) : null;
  const cinemaId = id?.split('|')[2];
  const dateStr = id?.split('|')[3];
  const cinemaName = id?.split('|')[4] ? decodeURIComponent(id.split('|')[4]) : null;

  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
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
      setIsLoading(false);
    };
    loadEvent();
  }, [movieId, showTime, cinemaName, events, location.city]);

  // Fetch seat map and listen for real-time updates
  useEffect(() => {
    if (event?.type !== 'movie' || !id) return;

    // Use full id (including showtime) for seat map to ensure unique layouts per showtime
    const seatMapId = encodeURIComponent(id);

    // Initial fetch
    fetch(`/api/events/${seatMapId}/seats`)
      .then(res => res.json())
      .then(data => setSeatMap(data))
      .catch(err => console.error("Failed to fetch seats", err));

    // Listen to real booked seats from Firestore
    const q = query(collection(db, 'orders'), where('eventId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booked: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'confirmed' && data.seats) {
          booked.push(...data.seats);
        }
      });
      setBookedSeats(booked);
      
      // If a selected seat becomes booked, deselect it
      setSelectedSeats(prev => prev.filter(seatId => !booked.includes(seatId)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    // SSE for real-time updates (reservations)
    const eventSource = new EventSource(`/api/events/${seatMapId}/seats/stream`);
    
    eventSource.onmessage = (e) => {
      try {
        const updatedSeats = JSON.parse(e.data);
        setSeatMap(updatedSeats);
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    return () => {
      unsubscribe();
      eventSource.close();
    };
  }, [event?.type, id]);

  if (isLoading) return <div className="p-8 text-center text-zinc-500 mt-20">Loading...</div>;
  if (!event) return <div className="p-8 text-center text-zinc-500 mt-20">Event not found</div>;

  const handleSeatClick = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < targetSeatCount) {
        setSelectedSeats([...selectedSeats, seatId]);
      } else {
        // Replace the oldest selected seat
        setSelectedSeats([...selectedSeats.slice(1), seatId]);
      }
    }
  };

  const renderSeatQuantityModal = () => {
    if (!showSeatQuantityModal || !isMovie) return null;

    if (seatMap.length === 0) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vibe-bg/90 backdrop-blur-md p-4">
          <div className="bg-vibe-card border border-white/10 rounded-2xl p-6 text-white">Loading...</div>
        </div>
      );
    }

    // Extract unique sections and prices from seatMap
    const sectionsMap = new Map<string, number>();
    seatMap.forEach(seat => {
      if (seat.type === 'seat' && !sectionsMap.has(seat.section)) {
        sectionsMap.set(seat.section, seat.price);
      }
    });
    
    const layout = Array.from(sectionsMap.entries()).map(([name, price]) => ({ name, price }));

    const getAvatarLayout = (n: number) => {
      if (n <= 5) return [n];
      if (n === 6) return [3, 3];
      if (n === 7) return [4, 3];
      if (n === 8) return [4, 4];
      if (n === 9) return [5, 4];
      return [5, 5];
    };

    const avatarRows = getAvatarLayout(targetSeatCount);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-vibe-card border border-white/10 rounded-3xl w-full max-w-md overflow-hidden text-white shadow-2xl"
        >
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">How many seats?</h2>
            
            {/* Dynamic Avatars */}
            <div className="flex flex-col items-center justify-center space-y-3 h-32 mb-8">
              <AnimatePresence mode="popLayout">
                {avatarRows.map((rowCount, rowIndex) => (
                  <motion.div 
                    key={`row-${targetSeatCount}-${rowIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex space-x-3"
                  >
                    {Array.from({ length: rowCount }).map((_, i) => (
                      <motion.div
                        key={`person-${targetSeatCount}-${rowIndex}-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-1"></div>
                        <div className="w-8 h-6 rounded-t-xl bg-white/80"></div>
                      </motion.div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Number Selector */}
            <div className="flex justify-between items-center bg-zinc-900/80 p-2 rounded-2xl mb-8 border border-white/5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setTargetSeatCount(num)}
                  className={`w-9 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    targetSeatCount === num 
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110' 
                      : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="flex justify-center space-x-8 mb-8 border-t border-b border-white/10 py-5">
              {layout.map(section => (
                <div key={section.name} className="flex flex-col items-center">
                  <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase mb-1">{section.name}</span>
                  <span className="text-lg font-bold text-white">₹{section.price}</span>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1">AVAILABLE</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSeatQuantityModal(false)}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Select Seats
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderSeatMap = () => {
    if (seatMap.length === 0) return <div className="p-8 text-center text-zinc-500">Loading seats...</div>;

    // Group by section
    const sections = [...new Set(seatMap.map(s => s.section))];
    
    return (
      <div className="w-full overflow-x-auto hide-scrollbar pb-8">
        <div className="w-max mx-auto flex flex-col items-center space-y-8 px-4">
          
          {/* Screen */}
          <div className="w-full max-w-lg mb-8 flex flex-col items-center">
            <div className="w-full h-8 border-t-2 border-blue-400/30 rounded-t-[50%] bg-gradient-to-t from-transparent to-blue-400/5 shadow-[0_-10px_20px_rgba(96,165,250,0.05)]"></div>
            <span className="text-[10px] text-zinc-500 mt-2 tracking-widest uppercase">All eyes this way please</span>
          </div>

          {/* Sections */}
          {sections.map((sectionName) => {
            const sectionSeats = seatMap.filter(s => s.section === sectionName);
            const price = sectionSeats.find(s => s.type === 'seat')?.price || 0;
            // Get unique rows, preserving the order they appear in the seatMap (which is top-to-bottom from server)
            const rows = [...new Set(sectionSeats.map(s => s.row))];

            return (
              <div key={sectionName as string} className="w-full flex flex-col items-start space-y-3 mb-4">
                <div className="w-full flex items-center justify-start border-b border-white/10 pb-2 mb-2">
                  <span className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">{sectionName as string} - ₹{price}</span>
                </div>
                
                {rows.map((row) => {
                  const rowSeats = sectionSeats.filter(s => s.row === row);
                  return (
                    <div key={row as string} className="flex items-center justify-start space-x-2 w-full">
                      <span className="w-6 text-xs font-medium text-zinc-400 text-right mr-4">{row as string}</span>
                      
                      <div className="flex space-x-2">
                        {rowSeats.map((seat, index) => {
                          if (seat.type === 'empty') {
                            return <div key={`gap-${row}-${index}`} className="w-6" />; // Gap
                          }

                          const isSelected = selectedSeats.includes(seat.id);
                          const isBooked = bookedSeats.includes(seat.id);
                          const isReserved = seat.status === 'reserved';
                          const isAvailable = !isBooked && !isReserved;

                          return (
                            <button
                              key={seat.id}
                              disabled={!isAvailable}
                              onClick={() => handleSeatClick(seat.id)}
                              className={`
                                w-7 h-7 rounded-t-md rounded-b-sm flex items-center justify-center text-[10px] font-medium transition-all
                                ${!isAvailable ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 
                                  isSelected ? 'bg-emerald-500 text-white border border-emerald-500' : 
                                  'bg-transparent text-emerald-500 border border-emerald-500 hover:bg-emerald-500/10'}
                              `}
                            >
                              {seat.col}
                            </button>
                          );
                        })}
                      </div>
                      
                      <span className="w-6 text-xs font-medium text-zinc-400 text-left ml-4">{row as string}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTicketTiers = () => {
    const tiers = [
      { id: 'ga', name: 'General Admission', price: event.price, desc: 'Entry to the event area.', tag: 'Selling Fast', tagColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
      { id: 'vip', name: 'VIP Access', price: event.price * 2.5, desc: 'Front row access, dedicated bar, and fast-track entry.', tag: 'Popular', tagColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
      { id: 'meet', name: 'Meet & Greet', price: event.price * 5, desc: 'All VIP perks plus a 15-minute meet and greet with the artist.', tag: 'Only 5 Left', tagColor: 'text-red-400 bg-red-400/10 border-red-400/20' }
    ];

    return (
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-orange-500 opacity-50" />
            <div className="flex-1 pl-2">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                {tier.tag && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${tier.tagColor}`}>
                    {tier.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mb-2 pr-4">{tier.desc}</p>
              <p className="text-rose-400 font-bold">₹{tier.price}</p>
            </div>
            <div className="flex items-center space-x-3 ml-2">
              <button 
                onClick={() => setTicketCount(Math.max(0, ticketCount - 1))}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 border border-white/5"
              >
                -
              </button>
              <span className="font-bold w-4 text-center">{ticketCount}</span>
              <button 
                onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getSeatPrice = (seatId: string) => {
    const seat = seatMap.find(s => s.id === seatId);
    if (seat) return seat.price;
    return event.price || 150;
  };

  const isMovie = event.type === 'movie';
  const totalAmount = isMovie 
    ? selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0)
    : ticketCount * event.price;
  const canProceed = isMovie ? selectedSeats.length > 0 : ticketCount > 0;

  const handleContinue = async () => {
    if (isMovie) {
      setIsReserving(true);
      try {
        const seatMapId = encodeURIComponent(id || '');
        const response = await fetch(`/api/events/${seatMapId}/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-123', // Placeholder user ID
            seatIds: selectedSeats
          })
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Failed to reserve seats. They might have been taken.');
          setIsReserving(false);
          return;
        }

        const data = await response.json();
        
        setCart({
          eventId: id, // Store full id in cart
          seats: selectedSeats,
          addons: {},
          total: totalAmount,
          reservationId: data.reservationId // Store reservation ID in cart
        });
        navigate(`/checkout/${seatMapId}`);
      } catch (err) {
        console.error("Reservation error", err);
        alert('An error occurred while reserving seats.');
        setIsReserving(false);
      }
    } else {
      setCart({
        eventId: id,
        seats: Array.from({ length: ticketCount }, (_, i) => `GA-${i + 1}`),
        addons: {},
        total: totalAmount,
      });
      navigate(`/checkout/${encodeURIComponent(id || '')}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-32"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-vibe-card flex items-center justify-center text-white hover:bg-zinc-800 transition-colors mr-4 border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{event.title}</h1>
            <p className="text-xs text-zinc-400 font-medium">{event.date} • {event.location}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {renderSeatQuantityModal()}
        {isMovie ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Select Seats</h2>
              <div className="flex space-x-4 text-xs font-medium text-zinc-400">
                <div className="flex items-center space-x-1"><div className="w-4 h-4 rounded-t-md rounded-b-sm border border-emerald-500"></div><span>Available</span></div>
                <div className="flex items-center space-x-1"><div className="w-4 h-4 rounded-t-md rounded-b-sm bg-emerald-500"></div><span>Selected</span></div>
                <div className="flex items-center space-x-1"><div className="w-4 h-4 rounded-t-md rounded-b-sm bg-zinc-800"></div><span>Sold</span></div>
              </div>
            </div>
            {renderSeatMap()}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold tracking-tight mb-6">Select Tickets</h2>
            {renderTicketTiers()}
          </>
        )}
      </div>

      {/* Fixed Bottom Checkout */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-vibe-bg/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-zinc-400 font-medium">
              {isMovie ? `${selectedSeats.length} Seats Selected` : `${ticketCount} Tickets Selected`}
            </div>
            <div className="text-xl font-black text-white">₹{totalAmount}</div>
          </div>
          <button
            disabled={!canProceed || isReserving}
            onClick={handleContinue}
            className={`w-full py-4 rounded-2xl font-bold tracking-wide transition-all ${
              canProceed && !isReserving
                ? 'bg-vibe-primary hover:bg-vibe-primary-hover text-white shadow-[0_0_20px_rgba(255,0,60,0.3)]' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isReserving ? 'Reserving...' : 'Continue to Add-ons'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
