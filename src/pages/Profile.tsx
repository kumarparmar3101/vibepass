import { User as UserIcon, Settings, CreditCard, HelpCircle, LogOut, ChevronRight, Star, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, setFirebaseUser } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState({ events: 0, movies: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        // Fetch latest user data
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirebaseUser({
            ...user,
            name: data.name || user.name,
            avatarUrl: data.avatarUrl || user.avatarUrl,
            memberTier: data.tier || 'Standard',
            points: data.loyaltyPoints || 0,
            role: data.role || 'user'
          });
        }

        // Fetch orders to calculate stats
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.id));
        const ordersSnap = await getDocs(ordersQuery);
        
        // Fetch watchlist count
        const watchlistQuery = query(collection(db, 'watchlist'), where('userId', '==', user.id));
        const watchlistSnap = await getDocs(watchlistQuery);
        
        const totalOrders = ordersSnap.docs.length;
        const totalWatchlist = watchlistSnap.docs.length;
        
        setStats({
          events: totalOrders, // Simplified for demo
          movies: totalWatchlist // Simplified for demo
        });

      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [user?.id, navigate]);

  const menuItems = [
    { icon: UserIcon, label: 'Edit Profile', action: () => navigate('/profile/edit') },
    ...(user?.role === 'organizer' || user?.role === 'admin' ? [{ icon: PlusCircle, label: 'Organizer Dashboard', action: () => navigate('/organizer') }] : []),
    { icon: CreditCard, label: 'Payment Methods', action: () => navigate('/profile/payments') },
    { icon: Settings, label: 'Settings', action: () => navigate('/profile/settings') },
    { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/profile/support') },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      showToast("Error signing out");
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24 relative"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* User Info */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/profile/edit')}
            className="w-20 h-20 rounded-full bg-vibe-card overflow-hidden border-2 border-vibe-primary relative group"
          >
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Edit</span>
            </div>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-sm text-zinc-400">{user.email}</p>
            <div className={`flex items-center space-x-1 mt-2 px-2 py-1 rounded-full w-max ${
              user.memberTier === 'VIP' ? 'text-purple-400 bg-purple-400/10' :
              user.memberTier === 'Premium' ? 'text-yellow-400 bg-yellow-400/10' :
              'text-zinc-400 bg-zinc-400/10'
            }`}>
              <Star className={`w-3 h-3 ${
                user.memberTier === 'VIP' ? 'fill-purple-400' :
                user.memberTier === 'Premium' ? 'fill-yellow-400' :
                'fill-zinc-400'
              }`} />
              <span className="text-xs font-bold">{user.memberTier || 'Standard'} Member</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => navigate('/wallet')} className="bg-vibe-card rounded-2xl p-4 text-center border border-white/5 hover:bg-zinc-800 transition-colors">
            <p className="text-2xl font-black text-white mb-1">{stats.events}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Events</p>
          </button>
          <button onClick={() => navigate('/profile/watchlist')} className="bg-vibe-card rounded-2xl p-4 text-center border border-white/5 hover:bg-zinc-800 transition-colors">
            <p className="text-2xl font-black text-white mb-1">{stats.movies}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Watchlist</p>
          </button>
          <button onClick={() => navigate('/profile/rewards')} className="bg-vibe-card rounded-2xl p-4 text-center border border-white/5 hover:bg-zinc-800 transition-colors">
            <p className="text-2xl font-black text-white mb-1">{user.points || 0}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Points</p>
          </button>
        </div>

        {/* Menu */}
        <div className="bg-vibe-card rounded-3xl overflow-hidden border border-white/5">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-zinc-200">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 p-4 text-vibe-primary font-bold hover:bg-vibe-primary/10 rounded-2xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-2xl shadow-black/50 border border-white/10 z-50 whitespace-nowrap text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
