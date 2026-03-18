import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Settings, Users, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function Organizer() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'event',
    date: '',
    location: '',
    price: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop',
    genres: [] as string[],
    status: 'Scheduled' as 'Scheduled' | 'Cancelled' | 'Postponed',
  });

  const predefinedGenres = [
    'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 
    'Music', 'Sports', 'Technology', 'Food', 'Art', 'EDM', 'Live Music', 'Festival'
  ];

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchMyEvents();
  }, [user, navigate]);

  const fetchMyEvents = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'events'), where('organizerId', '==', user.id));
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyEvents(events);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.genres.length === 0) {
      alert('Please select at least one genre.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEvent = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: formData.date, // Should be a timestamp in a real app
        location: formData.location,
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        genre: formData.genres,
        status: formData.status,
        organizerId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rating: 0,
        isTrending: true,
      };

      await addDoc(collection(db, 'events'), newEvent);
      alert('Event created successfully!');
      setFormData({
        title: '',
        type: 'event',
        date: '',
        location: '',
        price: '',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop',
        genres: [],
        status: 'Scheduled',
      });
      setActiveTab('dashboard');
      fetchMyEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      alert('Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-vibe-card border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Organizer Dashboard</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 space-x-4 border-b border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === 'dashboard' ? 'text-vibe-primary' : 'text-zinc-500 hover:text-white'
            }`}
          >
            My Events
            {activeTab === 'dashboard' && (
              <motion.div layoutId="org-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vibe-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === 'create' ? 'text-vibe-primary' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Create Event
            {activeTab === 'create' && (
              <motion.div layoutId="org-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vibe-primary" />
            )}
          </button>
        </div>
      </header>

      <div className="p-4">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-vibe-card border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Events</h3>
                  <Calendar className="w-4 h-4 text-vibe-primary" />
                </div>
                <p className="text-2xl font-black text-white">{myEvents.length}</p>
              </div>
              <div className="bg-vibe-card border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Revenue</h3>
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">₹0</p>
              </div>
            </div>

            {/* Events List */}
            <div>
              <h2 className="text-lg font-bold mb-4">Your Events</h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-vibe-primary" />
                </div>
              ) : myEvents.length === 0 ? (
                <div className="text-center py-12 bg-vibe-card rounded-2xl border border-white/5">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 mb-4">You haven't created any events yet.</p>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="bg-vibe-primary text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-vibe-primary-hover transition-colors"
                  >
                    Create Your First Event
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEvents.map(event => (
                    <div key={event.id} className="bg-vibe-card border border-white/5 rounded-2xl p-4 flex items-center space-x-4">
                      <img src={event.imageUrl} alt={event.title} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h3 className="font-bold text-white line-clamp-1">{event.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{event.date} • {event.location}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            event.status === 'Scheduled' ? 'bg-emerald-500/10 text-emerald-400' :
                            event.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {event.status}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            ₹{event.price}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-vibe-card border border-white/5 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-2">Create New Event</h2>
            <p className="text-sm text-zinc-400 mb-6">Add a new event to the VibePass catalog.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors"
                  placeholder="e.g., Neon Nights Festival"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors appearance-none"
                  >
                    <option value="event">Event</option>
                    <option value="movie">Movie</option>
                    <option value="sports">Sports</option>
                    <option value="play">Play</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedGenres.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGenreToggle(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          formData.genres.includes(g)
                            ? 'bg-vibe-primary/20 text-rose-200 border-vibe-primary/50'
                            : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Date & Time</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors"
                    placeholder="e.g., Oct 24 • 8:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Scheduled' | 'Cancelled' | 'Postponed' })}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors appearance-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors"
                    placeholder="Venue Name, City"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors resize-none"
                  placeholder="Describe the event..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold tracking-wide transition-all bg-vibe-primary hover:bg-vibe-primary-hover text-white shadow-[0_0_20px_rgba(255,0,60,0.3)] mt-4 flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Publish Event
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}
