import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Organizer() {
  const navigate = useNavigate();
  const { addEvent } = useStore();

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

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.genres.length === 0) {
      alert('Please select at least one genre.');
      return;
    }

    const newEvent = {
      id: `evt-${Date.now()}`,
      ...formData,
      price: Number(formData.price),
      genre: formData.genres,
      rating: 0,
      isTrending: true,
    };

    addEvent(newEvent);
    navigate('/');
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
      </header>

      <div className="p-4">
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
              className="w-full py-4 rounded-xl font-bold tracking-wide transition-all bg-vibe-primary hover:bg-vibe-primary-hover text-white shadow-[0_0_20px_rgba(255,0,60,0.3)] mt-4 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publish Event
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
