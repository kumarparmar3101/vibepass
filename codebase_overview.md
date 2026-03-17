# VibePass Codebase Overview

This document provides a high-level overview of the VibePass project, explaining both the structure of the codebase and the functionality of the code itself.

## 1. What is this Codebase?

The **VibePass** codebase is a modern web application built with a separate but integrated frontend and backend. It functions as an entertainment, movie, and event ticketing platform.

### Tech Stack
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS for styling, Framer Motion for animations, and Zustand for state management.
- **Backend / API**: Express (Node.js) acting as a custom API layer and proxy server.
- **Database & Authentication**: Firebase (Firestore database, Firebase Auth).
- **Web Scraping / Data Fetching**: Puppeteer, Cheerio, and Axios to fetch data from APIs like Paytm's internal apiproxy, YouTube (for trailers), and OSM (OpenStreetMap).

### Project Structure (Key Folders and Files)
- `/src/`: Contains the entire React frontend code.
  - `main.tsx` & `App.tsx`: The entry points of the React app and route definitions.
  - `components/`: Reusable UI components (like `BottomNav`).
  - `pages/`: Individual screens of the application (e.g., `Home`, `Search`, `Booking`, `Checkout`, `Profile`, `Ticket`, `MovieShowtimes`).
  - `store/`: Zustand state management (e.g., `useStore`).
  - `firebase.ts`: Firebase initialization and config.
- `/server.ts`: The Express backend server. It handles routing, caching (node-cache), proxying requests to grab movie/theatre data, resolving showtimes, and managing a mock seating reservation system via Server-Sent Events (SSE).
- `package.json` & `vite.config.ts`: Define project dependencies, build configurations, and scripts (like `npm run dev` starting both the Vite SPA and the Express server).
- `/test-*.js`: Various local script files that act as sandbox experiments for testing third-party APIs (BookMyShow, Paytm, Ticketnew, OpenStreetMap, YouTube, Nominatim).
- `/app/`: Additional application configurations, potentially for wrapping the app in a web-view or applet format.

## 2. What does the Code do?

At a functional level, the code operates in two major halves:

### Backend (`server.ts`)
- **Data Aggregation**: The server uses HTTP requests (`axios`) to proxy the "Paytm V3 Movies API" to fetch real-time lists of movies, theatres, and showtimes for a specific city. 
- **Trailer Search**: Scrapes YouTube search results to find the official trailer of a movie automatically.
- **Seat Reservation Simulation**: It simulates a live theater environment using Server-Sent Events (SSE). It generates a random seating map layout for a specific movie, allows a user to "reserve" seats temporarily (optimistic locking), and commits the booking upon fake payment confirmation.
- **Caching**: Uses `node-cache` to cache Paytm's API responses and YouTube URLs to avoid getting rate-limited.

### Frontend (`/src`)
- **User Interface**: Powers a responsive mobile-first UI with modern glassy animations (using Framer Motion).
- **Authentication Flow**: Manages user login, onboarding, and persistent login states tied to Firebase Auth.
- **Event Discovery**: Users can browse trending movies, check theatres, pick showtimes, and view trailers directly in the app.
- **Booking Flow**: A complete start-to-finish ticketing flow. From selecting a movie -> choosing a theatre out of available showtimes -> viewing a live seating map -> checkout and payment -> receiving a digital "ticket".
- **Real-time Sync**: Syncs location preferences and user profiles between local device state and Firebase Firestore.

**In summary:** The codebase is a beautifully animated, fully functional "clone" or aggregator for movie ticketing. It heavily borrows dynamic real-world data from Paytm and translates it into a custom, smooth user interface built in React.
