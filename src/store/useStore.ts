import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockEvents as initialEvents } from '../data/mockData';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  memberTier: 'Standard' | 'Gold' | 'Platinum';
  points: number;
}

export interface Location {
  city: string;
  coordinates?: { lat: number; lng: number };
}

interface AppState {
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  token: string | null;
  refreshToken: string | null;
  isCheckingAuth: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  checkAuth: () => Promise<void>;
  setTokens: (token: string, refreshToken: string) => void;
  setFirebaseUser: (user: User | null) => void;

  // Location State
  location: Location;
  setLocation: (loc: Location) => void;

  // Cart State (simplified for now)
  cart: {
    eventId: string | null;
    seats: string[];
    addons: Record<string, number>;
    total: number;
    ticketPrice?: number;
    convenienceFee?: number;
    donation?: number;
    reservationId?: string;
  };
  setCart: (cart: Partial<AppState['cart']>) => void;
  clearCart: () => void;

  // Events State
  events: any[];
  addEvent: (event: any) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      token: null,
      refreshToken: null,
      isCheckingAuth: true,
      login: (user, token, refreshToken) => set({ user, token, refreshToken, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isOnboarded: false }),
      completeOnboarding: () => set({ isOnboarded: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setFirebaseUser: (user) => set({ user, isAuthenticated: !!user, isCheckingAuth: false }),
      checkAuth: async () => {
        set({ isCheckingAuth: true });
        
        // We can't easily access the current state inside `set` without `get`, so let's just use a functional update
        set((currentState) => {
          if (currentState.token && currentState.user) {
            // Token exists, assume valid for this mock
            return { isCheckingAuth: false, isAuthenticated: true };
          } else {
            // No token or user, logout
            return { isCheckingAuth: false, isAuthenticated: false, user: null, token: null, refreshToken: null };
          }
        });
      },

      // Location
      location: { city: 'Mumbai' },
      setLocation: (location) => set({ location }),

      // Cart
      cart: {
        eventId: null,
        seats: [],
        addons: {},
        total: 0,
        reservationId: undefined,
      },
      setCart: (newCart) =>
        set((state) => ({ cart: { ...state.cart, ...newCart } })),
      clearCart: () =>
        set({
          cart: { eventId: null, seats: [], addons: {}, total: 0, ticketPrice: undefined, convenienceFee: undefined, donation: undefined, reservationId: undefined },
        }),
      // Events
      events: initialEvents,
      addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
    }),
    {
      name: 'vibepass-storage',
    }
  )
);
