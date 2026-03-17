import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CinematicPreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const navigate = useNavigate();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2); // -1 to 1
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2); // -1 to 1
    setMousePos({ x, y });
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 800);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-safe-pt left-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors mt-4"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Background Poster */}
      <div 
        className="absolute inset-0 z-0 opacity-60 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: 'url(https://picsum.photos/seed/dune2/1920/1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: isClicked ? 'blur(4px)' : 'blur(20px)',
          transform: isClicked ? 'scale(1.02)' : 'scale(1)',
        }}
      />
      
      {/* Film Grain & Scanlines */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>

      {/* Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

      {/* Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              filter: 'blur(1px)',
              boxShadow: '0 0 10px 2px rgba(255,255,255,0.8)'
            }}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 10,
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: -50,
              opacity: [0, Math.random() * 0.5 + 0.2, 0],
              x: `+=${Math.random() * 100 - 50}`
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div 
        ref={cardRef}
        className="relative z-10 w-full max-w-[400px] rounded-[32px] p-8 overflow-hidden group/card"
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)', // Slate Graphite 80%
          backdropFilter: isClicked ? 'blur(4px) saturate(160%)' : 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: isClicked ? 'blur(4px) saturate(160%)' : 'blur(20px) saturate(160%)',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05) inset',
          transition: 'backdrop-filter 0.5s ease, -webkit-backdrop-filter 0.5s ease',
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Hairline Gradient Border */}
        <div className="absolute inset-0 rounded-[32px] pointer-events-none p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>

        {/* Content */}
        <div className="relative z-20">
          <div className="flex justify-between items-start mb-8">
            <div>
              <motion.div 
                className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white tracking-widest uppercase mb-4 backdrop-blur-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                IMAX 70mm
              </motion.div>
              <motion.h2 
                className="text-4xl font-black text-white tracking-tight mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Dune: Part Two
              </motion.h2>
              <motion.p 
                className="text-indigo-300 font-medium tracking-wide text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Epic Sci-Fi • 2h 46m
              </motion.p>
            </div>
          </div>

          <motion.div 
            className="space-y-5 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center text-zinc-300 text-[15px] font-medium">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mr-4 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              Fri, Oct 24 • 8:30 PM
            </div>
            <div className="flex items-center text-zinc-300 text-[15px] font-medium">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mr-4 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              TCL Chinese Theatre
            </div>
            <div className="flex items-center text-zinc-300 text-[15px] font-medium">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mr-4 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              Row J, Seats 14-15
            </div>
          </motion.div>

          {/* Button Container */}
          <motion.div 
            className="relative perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setMousePos({ x: 0, y: 0 }); }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {/* Lens flare / Refraction behind button */}
            <motion.div 
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none mix-blend-screen"
              animate={{ opacity: isHovering ? 0.5 : 0 }}
              style={{
                transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
              }}
            />

            <motion.button
              ref={buttonRef}
              onClick={handleClick}
              className="relative w-full py-5 rounded-2xl font-bold text-white text-lg tracking-wide overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                boxShadow: `
                  inset 0 0 0 1px rgba(255,255,255,0.4),
                  inset 0 2px 10px rgba(255,255,255,0.5),
                  0 15px 35px -10px rgba(99, 102, 241, 0.6)
                `,
                textShadow: '0 2px 10px rgba(255,255,255,0.4)',
                transformStyle: 'preserve-3d',
              }}
              animate={{
                scale: isHovering ? 1.05 : 1,
                y: isHovering ? -2 : 0,
                rotateX: isHovering ? mousePos.y * -5 : 0,
                rotateY: isHovering ? mousePos.x * 5 : 0,
                boxShadow: isHovering ? `
                  inset 0 0 0 1px rgba(255,255,255,0.6),
                  inset 0 2px 15px rgba(255,255,255,0.7),
                  ${mousePos.x * -10}px ${mousePos.y * -10 + 25}px 50px -10px rgba(168, 85, 247, 0.8)
                ` : `
                  inset 0 0 0 1px rgba(255,255,255,0.4),
                  inset 0 2px 10px rgba(255,255,255,0.5),
                  0 15px 35px -10px rgba(99, 102, 241, 0.6)
                `
              }}
              whileTap={{ 
                scale: 0.95,
                rotateX: 0,
                rotateY: 0,
                boxShadow: `
                  inset 0 0 0 1px rgba(255,255,255,0.2),
                  inset 0 2px 5px rgba(255,255,255,0.3),
                  0 5px 15px -5px rgba(99, 102, 241, 0.4)
                `,
                transition: { type: 'spring', cubicBezier: [0.34, 1.56, 0.64, 1], duration: 0.4 }
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Shimmer Sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
              
              <span className="relative z-10 flex items-center justify-center drop-shadow-md">
                {isClicked ? 'Confirmed!' : 'Book Now'}
                {!isClicked && (
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                )}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
    </div>
  );
}
