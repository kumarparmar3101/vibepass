import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Bell, Lock, Globe, Trash2, ChevronRight, Loader2 } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      bookingConfirmations: true,
      eventReminders: true,
      offersPromotions: false,
    },
    privacy: {
      publicProfile: false,
      shareWatchHistory: false,
    },
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'user_settings', user.id));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, ...data.notifications },
            privacy: { ...prev.privacy, ...data.privacy },
            language: data.language || prev.language,
            timezone: data.timezone || prev.timezone,
          }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, [user, navigate]);

  const handleToggle = async (category: 'notifications' | 'privacy', key: string) => {
    if (!user) return;

    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key as keyof typeof settings[typeof category]],
      },
    };

    setSettings(newSettings);

    try {
      const settingsRef = doc(db, 'user_settings', user.id);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, {
          [category]: newSettings[category],
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(settingsRef, {
          userId: user.id,
          notifications: newSettings.notifications,
          privacy: newSettings.privacy,
          language: newSettings.language,
          timezone: newSettings.timezone,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      // Revert on error
      setSettings(settings);
    }
  };

  if (!user) return null;

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
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* Notifications */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-vibe-primary" />
            <h2 className="text-lg font-bold">Notifications</h2>
          </div>
          <div className="bg-vibe-card rounded-2xl border border-white/5 overflow-hidden">
            <ToggleRow
              label="Booking Confirmations"
              description="Get notified when your booking is confirmed"
              checked={settings.notifications.bookingConfirmations}
              onChange={() => handleToggle('notifications', 'bookingConfirmations')}
            />
            <ToggleRow
              label="Event Reminders"
              description="Get a reminder 1 day before the event"
              checked={settings.notifications.eventReminders}
              onChange={() => handleToggle('notifications', 'eventReminders')}
            />
            <ToggleRow
              label="Offers & Promotions"
              description="Receive updates about special discounts"
              checked={settings.notifications.offersPromotions}
              onChange={() => handleToggle('notifications', 'offersPromotions')}
              isLast
            />
          </div>
        </section>

        {/* Privacy */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="w-5 h-5 text-vibe-primary" />
            <h2 className="text-lg font-bold">Privacy</h2>
          </div>
          <div className="bg-vibe-card rounded-2xl border border-white/5 overflow-hidden">
            <ToggleRow
              label="Public Profile"
              description="Allow others to find your profile"
              checked={settings.privacy.publicProfile}
              onChange={() => handleToggle('privacy', 'publicProfile')}
            />
            <ToggleRow
              label="Share Watch History"
              description="Show your watched movies to friends"
              checked={settings.privacy.shareWatchHistory}
              onChange={() => handleToggle('privacy', 'shareWatchHistory')}
              isLast
            />
          </div>
        </section>

        {/* Preferences */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-vibe-primary" />
            <h2 className="text-lg font-bold">Preferences</h2>
          </div>
          <div className="bg-vibe-card rounded-2xl border border-white/5 overflow-hidden">
            <ActionRow label="Language" value={settings.language === 'en' ? 'English' : settings.language} />
            <ActionRow label="Timezone" value={settings.timezone} isLast />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-4">
          <button className="w-full flex items-center justify-between p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5" />
              <span className="font-bold">Delete Account</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </button>
          <p className="text-xs text-zinc-500 mt-2 px-4 text-center">
            This action is permanent and cannot be undone.
          </p>
        </section>
      </div>
    </motion.div>
  );
}

function ToggleRow({ label, description, checked, onChange, isLast = false }: any) {
  return (
    <div className={`p-4 flex items-center justify-between ${!isLast ? 'border-b border-white/5' : ''}`}>
      <div className="pr-4">
        <p className="font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-vibe-primary' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ActionRow({ label, value, isLast = false }: any) {
  return (
    <button className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${!isLast ? 'border-b border-white/5' : ''}`}>
      <span className="font-medium text-zinc-200">{label}</span>
      <div className="flex items-center space-x-2 text-zinc-500">
        <span className="text-sm">{value}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}
