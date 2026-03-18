import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);
  const isOnboarded = useStore((state) => state.isOnboarded);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (providerName: string) => {
    setIsLoading(true);
    try {
      if (providerName === 'Google') {
        await signInWithPopup(auth, googleProvider);
      } else if (providerName === 'Apple') {
        await signInWithPopup(auth, appleProvider);
      }
      // Note: App.tsx's onAuthStateChanged will handle updating the store and redirecting
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Logo/Branding */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-rose-500/20">
            <span className="text-4xl font-black text-white tracking-tighter">V</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">VibePass</h1>
          <p className="text-zinc-400 font-medium">Your ticket to the best experiences.</p>
        </div>

        {/* Login Options */}
        <div className="w-full space-y-4">
          <button
            onClick={() => handleLogin('Google')}
            disabled={isLoading}
            className="w-full bg-white hover:bg-zinc-100 text-zinc-900 py-4 px-6 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleLogin('Apple')}
            disabled={isLoading}
            className="w-full bg-black hover:bg-zinc-900 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-colors border border-zinc-800 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.82 1.5-.06 2.59.45 3.37 1.22-2.95 1.8-2.45 5.83.44 7.06-1.05 2.54-2.29 4.67-2.47 4.71zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <p className="mt-8 text-xs text-zinc-500 text-center max-w-[280px]">
          By continuing, you agree to VibePass's{' '}
          <a href="#" className="text-zinc-300 hover:text-white underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-zinc-300 hover:text-white underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </motion.div>
  );
}
