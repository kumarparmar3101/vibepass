import { MapPin, Navigation } from 'lucide-react';

interface VenueMapProps {
  location: string;
}

export default function VenueMap({ location }: VenueMapProps) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <a 
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 mt-4 group cursor-pointer"
    >
      <img
        src={`https://picsum.photos/seed/${location.replace(/[^a-zA-Z0-9]/g, '')}/800/400?grayscale&blur=2`}
        alt="Map"
        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-rose-500/20 rounded-full animate-ping" />
          <div className="bg-rose-500 p-3 rounded-full shadow-lg shadow-rose-500/50 relative z-10">
            <MapPin className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20">
        <Navigation className="w-4 h-4 text-white" />
      </div>
    </a>
  );
}
