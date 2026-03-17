import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockEvents } from '../data/mockData';
import { ArrowLeft, Clock, Info, ChevronRight, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { fetchMovieDetails } from '../services/tmdb';

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cart, setCart, events, location, user } = useStore();
  const [event, setEvent] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const [donation, setDonation] = useState(1);

  const movieId = id?.split('|')[0];
  const showTime = id?.split('|')[1] ? decodeURIComponent(id.split('|')[1]) : null;
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

  // Redirect if no cart data
  useEffect(() => {
    if (cart.eventId !== id && !isLoading) {
      navigate(`/book/${encodeURIComponent(id || '')}`);
    }
  }, [cart.eventId, id, navigate, isLoading]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Your seat reservation has expired. Please select your seats again.');
      navigate(`/book/${encodeURIComponent(id || '')}`);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, id]);

  if (isLoading) return <div className="p-8 text-center text-zinc-500 mt-20">Loading...</div>;
  if (!event) return <div className="p-8 text-center text-zinc-500 mt-20">Event not found</div>;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ticketPrice = cart.total || (event.type === 'movie' ? Number(event.price || 230) * cart.seats.length : Number(event.price || 230) * cart.seats.length);
  const convenienceFee = 40.12;
  const totalAmount = ticketPrice + convenienceFee + donation;

  const handleContinue = () => {
    setCart({
      ...cart,
      total: totalAmount,
      ticketPrice,
      convenienceFee,
      donation
    });
    navigate(`/payment/${encodeURIComponent(id || '')}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-[#f5f5f5] text-zinc-900 pb-32 font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center text-zinc-700 mr-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-medium text-zinc-900">Confirm booking</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Booking Details Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-lg font-medium text-zinc-900">{event.title}</h2>
            <div className="flex flex-col items-end">
              <span className="text-lg font-medium">{cart.seats.length}</span>
              <span className="text-xs text-red-500 flex items-center"><TicketIcon className="w-3 h-3 mr-1" /> M-Ticket</span>
            </div>
          </div>
          <p className="text-sm text-zinc-600 mb-1">{event.date}</p>
          <p className="text-sm text-zinc-500 mb-1">Hindi (2D)</p>
          <p className="text-sm text-zinc-500 mb-1">{cart.seats.join(', ')}</p>
          <p className="text-sm text-zinc-500 mb-4">{event.location || event.venue || 'Cinema'}</p>

          <div className="flex items-start space-x-2 mb-4 bg-orange-50/50 p-2 rounded-lg">
            <div className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center text-[10px] text-red-500 font-bold shrink-0 mt-0.5">18+</div>
            <p className="text-sm text-zinc-700">This movie is only for audience above the age of 18</p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-900 mb-1">Cancellation Unavailable</h3>
            <p className="text-sm text-zinc-600">This venue does not support booking cancellation.</p>
          </div>
        </div>

        {/* Price Details */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-zinc-600">Ticket(s) price</span>
            <span className="text-sm font-medium">₹{ticketPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-zinc-600 flex items-center">Convenience fees <ChevronRight className="w-4 h-4 ml-1 rotate-90" /></span>
            <span className="text-sm font-medium">₹{convenienceFee.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-zinc-100 pt-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium text-zinc-900 block">Give to Underprivileged Musicians</span>
                <span className="text-xs text-zinc-500">(₹1 per ticket) <span className="text-zinc-400 underline ml-1">VIEW T&C</span></span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">₹{donation.toFixed(2)}</span>
                <button 
                  onClick={() => setDonation(prev => prev === 0 ? 1 : 0)}
                  className="text-xs text-red-500 font-medium mt-1"
                >
                  {donation > 0 ? 'Remove' : 'Add ₹1.00'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 flex justify-between items-center">
            <span className="text-base font-medium text-zinc-900">Order total</span>
            <span className="text-base font-medium text-zinc-900">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-zinc-900">For Sending Booking Details</span>
            <button className="text-sm text-red-500 font-medium flex items-center"><Edit2 className="w-3 h-3 mr-1" /> Edit</button>
          </div>
          <p className="text-sm text-zinc-600 mb-1">+91-9512787670 | {user?.email || 'user@example.com'}</p>
          <p className="text-sm text-zinc-500">Gujarat (for GST purposes)</p>
        </div>

        {/* Offers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 flex justify-between items-center">
          <div className="flex items-center text-orange-500 font-medium">
            <span className="mr-2">%</span> Apply Offers
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </div>

        {/* Consent */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
          <p className="text-sm text-zinc-700">By proceeding, I express my consent to complete this transaction.</p>
        </div>
      </div>

      {/* Fixed Bottom Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 pb-safe">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total</p>
            <p className="text-xl font-bold text-zinc-900">₹{totalAmount.toFixed(2)}</p>
          </div>
          <button
            onClick={handleContinue}
            className="bg-[#f84464] hover:bg-[#e03c5a] text-white px-12 py-3 rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TicketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}
