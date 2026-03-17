import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-rose-500/20">
          <span className="text-5xl font-black text-white tracking-tighter">V</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">VibePass</h1>
        
        <div className="mt-12 flex space-x-2">
          <div className="w-2 h-2 bg-vibe-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-vibe-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-vibe-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
