import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Gift, Ticket, Coffee, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LoyaltyRewards() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

  const points = user?.points || 0;
  const tier = user?.memberTier || 'Standard';

  const rewards = [
    { id: 1, title: 'Free Popcorn (Medium)', points: 500, icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 2, title: '1 Free Movie Ticket', points: 1500, icon: Ticket, color: 'text-vibe-primary', bg: 'bg-vibe-primary/10' },
    { id: 3, title: 'VIP Lounge Access', points: 3000, icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 4, title: 'Exclusive Premiere Invite', points: 5000, icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const history = [
    { id: 1, action: 'Booked Avengers: Secret Wars', points: '+150', date: 'Oct 24, 2023' },
    { id: 2, action: 'Redeemed Free Popcorn', points: '-500', date: 'Oct 15, 2023' },
    { id: 3, action: 'Profile Completion Bonus', points: '+200', date: 'Oct 10, 2023' },
  ];

  const progressToNextTier = tier === 'Standard' ? (points / 2000) * 100 : tier === 'Premium' ? (points / 5000) * 100 : 100;
  const nextTier = tier === 'Standard' ? 'Premium' : tier === 'Premium' ? 'VIP' : 'Max Tier';
  const pointsNeeded = tier === 'Standard' ? 2000 - points : tier === 'Premium' ? 5000 - points : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24 relative"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Loyalty Rewards</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Points Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vibe-primary/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Available Points</p>
                <h2 className="text-5xl font-black text-white">{points}</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                tier === 'VIP' ? 'bg-purple-500/20 text-purple-400' :
                tier === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-zinc-500/20 text-zinc-400'
              }`}>
                <Star className="w-3 h-3 fill-current" />
                <span>{tier}</span>
              </div>
            </div>

            {tier !== 'VIP' && (
              <div>
                <div className="flex justify-between text-xs font-medium text-zinc-400 mb-2">
                  <span>{pointsNeeded} points to {nextTier}</span>
                  <span>{Math.min(100, Math.round(progressToNextTier))}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progressToNextTier)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      nextTier === 'Premium' ? 'bg-yellow-400' : 'bg-purple-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-zinc-900/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'rewards' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Redeem
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'history' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'rewards' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Available Rewards</h3>
            <div className="grid gap-4">
              {rewards.map((reward) => {
                const canRedeem = points >= reward.points;
                return (
                  <div key={reward.id} className={`bg-vibe-card border border-white/5 rounded-2xl p-4 flex items-center justify-between ${!canRedeem ? 'opacity-60' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reward.bg}`}>
                        <reward.icon className={`w-6 h-6 ${reward.color}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{reward.title}</h4>
                        <p className="text-sm text-zinc-400">{reward.points} pts</p>
                      </div>
                    </div>
                    <button 
                      disabled={!canRedeem}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                        canRedeem 
                          ? 'bg-vibe-primary text-white hover:bg-vibe-primary-hover' 
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      Redeem
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Points History</h3>
            <div className="bg-vibe-card border border-white/5 rounded-2xl overflow-hidden">
              {history.map((item, index) => (
                <div key={item.id} className={`p-4 flex items-center justify-between ${index !== history.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div>
                    <h4 className="font-medium text-white text-sm">{item.action}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{item.date}</p>
                  </div>
                  <span className={`font-bold ${item.points.startsWith('+') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
