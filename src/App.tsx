/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Search from './pages/Search';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import EventDetail from './pages/EventDetail';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Ticket from './pages/Ticket';
import Stream from './pages/Stream';
import Login from './pages/Login';
import CategoryPage from './pages/CategoryPage';
import Organizer from './pages/Organizer';
import Onboarding from './pages/Onboarding';
import Splash from './pages/Splash';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import CinematicPreview from './pages/CinematicPreview';

import TheatreDetail from './pages/TheatreDetail';
import MovieShowtimes from './pages/MovieShowtimes';

function AuthGuard({ children, requireAuth = true, requireOnboarded = true, publicAccess = false }: { children: React.ReactNode, requireAuth?: boolean, requireOnboarded?: boolean, publicAccess?: boolean }) {
  const { isAuthenticated, isOnboarded } = useStore();
  const location = useLocation();

  if (publicAccess) {
    // For public routes, we only redirect if user is logged in but not onboarded
    if (isAuthenticated && !isOnboarded && requireOnboarded) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAuth && requireOnboarded && !isOnboarded) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  if (requireAuth && !requireOnboarded && isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    if (isOnboarded) {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}

export function AnimatedRoutes() {
  const location = useLocation();
  const isCheckingAuth = useStore((state) => state.isCheckingAuth);
  const user = useStore((state) => state.user);
  const userLocation = useStore((state) => state.location);
  const isOnboarded = useStore((state) => state.isOnboarded);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const { setFirebaseUser, location: storeLocation, isOnboarded: storeIsOnboarded, completeOnboarding, setLocation } = useStore.getState();
      
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          let userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}`,
            memberTier: 'Standard' as const,
            points: 0,
          };

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Sync settings from Firestore to local store
            if (data.city && data.city !== storeLocation.city) {
              setLocation({ city: data.city });
            }
            if (data.isOnboarded !== undefined && data.isOnboarded !== storeIsOnboarded) {
              if (data.isOnboarded) {
                completeOnboarding();
              }
            }
          } else {
            // Create new user document
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: userData.name,
              email: userData.email,
              avatarUrl: userData.avatarUrl,
              city: storeLocation.city,
              isOnboarded: storeIsOnboarded,
              createdAt: serverTimestamp()
            });
          }

          setFirebaseUser(userData);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
          // Fallback if Firestore fails
          setFirebaseUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}`,
            memberTier: 'Standard' as const,
            points: 0,
          });
        }
      } else {
        setFirebaseUser(null);
      }
      useStore.setState({ isCheckingAuth: false });
    });

    return () => unsubscribe();
  }, []);

  // Sync location to Firebase when it changes
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.id) {
      const userRef = doc(db, 'users', user.id);
      updateDoc(userRef, { city: userLocation.city }).catch((error) => handleFirestoreError(error, OperationType.UPDATE, 'users'));
    }
  }, [userLocation.city, isCheckingAuth, isAuthenticated, user?.id]);

  // Sync onboarding status to Firebase when it changes
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.id) {
      const userRef = doc(db, 'users', user.id);
      updateDoc(userRef, { isOnboarded }).catch((error) => handleFirestoreError(error, OperationType.UPDATE, 'users'));
    }
  }, [isOnboarded, isCheckingAuth, isAuthenticated, user?.id]);

  const hideBottomNav = ['/event', '/book', '/checkout', '/payment', '/ticket', '/login', '/organizer', '/onboarding', '/cinematic', '/theatre'].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {isCheckingAuth ? (
          <Splash key="splash" />
        ) : (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<AuthGuard publicAccess={true}><Home /></AuthGuard>} />
              <Route path="/login" element={<AuthGuard requireAuth={false}><Login /></AuthGuard>} />
              <Route path="/onboarding" element={<AuthGuard requireOnboarded={false}><Onboarding /></AuthGuard>} />
              <Route path="/search" element={<AuthGuard><Search /></AuthGuard>} />
              <Route path="/wallet" element={<AuthGuard><Wallet /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
              <Route path="/stream" element={<AuthGuard><Stream /></AuthGuard>} />
              <Route path="/category/:id" element={<AuthGuard><CategoryPage /></AuthGuard>} />
              <Route path="/organizer" element={<AuthGuard><Organizer /></AuthGuard>} />
              <Route path="/event/:id" element={<AuthGuard><EventDetail /></AuthGuard>} />
              <Route path="/book/:id" element={<AuthGuard><Booking /></AuthGuard>} />
              <Route path="/checkout/:id" element={<AuthGuard><Checkout /></AuthGuard>} />
              <Route path="/payment/:id" element={<AuthGuard><Payment /></AuthGuard>} />
              <Route path="/ticket/:id" element={<AuthGuard><Ticket /></AuthGuard>} />
              <Route path="/theatre/:id/:name" element={<AuthGuard><TheatreDetail /></AuthGuard>} />
              <Route path="/movie/:id/showtimes/:name" element={<AuthGuard><MovieShowtimes /></AuthGuard>} />
              <Route path="/cinematic" element={<CinematicPreview />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
      {!isCheckingAuth && !hideBottomNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="max-w-md mx-auto min-h-screen bg-vibe-bg shadow-2xl relative overflow-hidden">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
