import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, MessageCircle, Instagram, Twitter } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ShareModal({ isOpen, onClose, title }: ShareModalProps) {
  const shareOptions = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', hover: 'hover:bg-green-400' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', hover: 'hover:bg-pink-500' },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500', hover: 'hover:bg-sky-400' },
    { name: 'Copy Link', icon: Link2, color: 'bg-zinc-700', hover: 'hover:bg-zinc-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] p-6 border border-white/10 shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Share Event</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Invite your friends to <span className="text-white font-semibold">{title}</span>
            </p>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button key={option.name} className="flex flex-col items-center space-y-2 group">
                  <div className={`w-14 h-14 rounded-full ${option.color} ${option.hover} flex items-center justify-center text-white transition-colors shadow-lg`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-200">{option.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
