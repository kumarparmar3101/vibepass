import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../data/mockData';
import { MapPin, Star, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: Event;
  variant?: 'large' | 'horizontal' | 'compact';
  key?: React.Key;
}

export default function EventCard({ event, variant = 'large' }: EventCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Ignore autoplay errors
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  if (variant === 'horizontal') {
    return (
      <Link to={`/event/${event.id}`} className="block min-w-[140px] w-[140px] group">
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {event.rating && (
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{event.rating}</span>
            </div>
          )}
          {event.status && event.status !== 'Scheduled' && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${event.status === 'Cancelled' ? 'text-rose-500' : 'text-yellow-500'}`}>
                {event.status}
              </span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 truncate">{event.title}</h3>
        <div className="flex items-center text-xs text-zinc-400 mt-0.5 truncate">
          <MapPin className="w-3 h-3 mr-1 text-vibe-primary flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
        {event.type === 'movie' && event.language && (
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">Lang: {event.language}</p>
        )}
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{event.genre.join(', ')}</p>
      </Link>
    );
  }

  const cardClass = variant === 'compact'
    ? 'relative aspect-[16/9] rounded-2xl overflow-hidden mb-3 shadow-xl shadow-black/40'
    : 'relative aspect-[4/5] rounded-3xl overflow-hidden mb-4 shadow-2xl shadow-black/50';

  const contentClass = variant === 'compact' ? 'absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end' : 'absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end';

  const titleClass = variant === 'compact'
    ? 'text-xl font-bold text-white mb-1 leading-tight'
    : 'text-2xl font-bold text-white mb-2 leading-tight';

  return (
    <Link to={`/event/${event.id}`} className="block w-full group mb-6">
      <motion.div 
        layoutId={`event-image-${event.id}`}
        className={cardClass}
      >
        {event.videoUrl ? (
          <video
            ref={videoRef}
            src={event.videoUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-vibe-bg via-vibe-bg/20 to-transparent" />
        
        <div className={contentClass}>
          <div className="flex items-center space-x-2 mb-3">
            {event.videoUrl && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md rounded-full border border-white/20 flex items-center">
                <Play className="w-3 h-3 mr-1 fill-white" /> Preview
              </span>
            )}
            {event.genre.slice(0, 2).map((g) => (
              <span key={g} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-vibe-primary/20 backdrop-blur-md rounded-full border border-vibe-primary/20">
                {g}
              </span>
            ))}
            {event.status && event.status !== 'Scheduled' && (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border backdrop-blur-md ${
                event.status === 'Cancelled' 
                  ? 'text-rose-200 bg-rose-500/20 border-rose-500/20' 
                  : 'text-yellow-200 bg-yellow-500/20 border-yellow-500/20'
              }`}>
                {event.status}
              </span>
            )}
          </div>
          <h2 className={titleClass}>{event.title}</h2>
          {event.type === 'movie' && event.language && (
            <p className="text-xs text-zinc-300 mb-2">Languages: {event.language}</p>
          )}
          <div className="flex items-center text-sm text-zinc-300 space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-vibe-primary" />
              <span className="truncate max-w-[150px]">{event.location}</span>
            </div>
            <span className="text-zinc-500">•</span>
            <span className="font-medium text-vibe-primary">₹{event.price}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
