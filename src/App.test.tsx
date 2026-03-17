import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AnimatedRoutes } from './App';
import { useStore } from './store/useStore';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store
vi.mock('./store/useStore', () => {
  return {
    useStore: vi.fn(),
  };
});

// Mock Firebase
vi.mock('./firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Mock TMDB service
vi.mock('./services/tmdb', () => ({
  fetchNowPlayingMovies: vi.fn(() => Promise.resolve([])),
}));

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Home for guest users (no login required)', () => {
    // Mock store state for unauthenticated user
    (useStore as any).mockImplementation((selector: any) => {
        const state = {
            isAuthenticated: false,
            isOnboarded: false,
            isCheckingAuth: false,
            user: null,
            location: { city: 'Mumbai' },
            setLocation: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
            checkAuth: vi.fn(),
            setFirebaseUser: vi.fn(),
            setCart: vi.fn(),
            addEvent: vi.fn(),
            events: [], // Need some events? Home handles empty events gracefully?
            cart: {
                eventId: null,
                seats: [],
                addons: {},
                total: 0,
            }
        };
        return selector ? selector(state) : state;
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AnimatedRoutes /> 
      </MemoryRouter>
    );

    // If guest access is NOT allowed (current state), it should redirect to /login
    // If guest access IS allowed (desired state), it should render Home content.
    
    // We expect it to FAIL initially if we assert Home content is present.
    // Or we expect it to PASS if we assert redirect to login (to verify baseline).
    
    // Let's assert Home content is present, so we can see it fail, then fix it.
    expect(screen.getByText(/Now Running/i)).toBeInTheDocument();
  });
});
