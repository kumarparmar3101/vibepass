import { Home, Search, Ticket, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/wallet', icon: Ticket, label: 'Wallet' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-vibe-bg/90 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-2 pb-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center w-full h-full pt-2"
            >
              <div className={clsx(
                "p-2.5 px-5 rounded-full transition-all duration-300 relative flex items-center justify-center",
                isActive ? "text-vibe-primary" : "text-zinc-500 hover:text-zinc-300"
              )}>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 bg-vibe-primary/15 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon 
                  className="w-6 h-6 relative z-10" 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span 
                className={clsx(
                  "text-[10px] font-bold tracking-wide mt-1 transition-colors duration-300",
                  isActive ? "text-vibe-primary" : "text-zinc-500"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
