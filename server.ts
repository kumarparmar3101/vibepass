import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import NodeCache from "node-cache";
import * as cheerio from "cheerio";
import axios from "axios";

const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // CORS middleware (basic)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/movies", async (req, res) => {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: "City parameter is required" });
    }

    const normalizedCity = city.toLowerCase().trim();
    const cacheKey = `movies_${normalizedCity}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    try {
      const response = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/movies?city=${encodeURIComponent(normalizedCity)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      const movies = response.data?.data?.movies || [];

      const parseLanguages = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map((v) => String(v).trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
          return value
            .split(/[,&/|]/)
            .map((part) => part.trim())
            .filter(Boolean);
        }
        return [];
      };

      const normalizeTitle = (title: string): string =>
        title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      
      // Transform Paytm data to match our Event interface
      const formattedMovies = movies.map((movie: any, index: number) => {
        // Generate a realistic date for the UI
        const date = new Date();
        date.setDate(date.getDate() + (index % 7));
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + ['10:00 AM', '1:30 PM', '4:45 PM', '8:00 PM'][index % 4];
        const languages = parseLanguages(movie.lang);

        return {
          id: `paytm-${movie.id}`,
          title: movie.name || movie.label,
          type: 'movie',
          imageUrl: movie.appImgPath || movie.imgPath || 'https://picsum.photos/seed/movie/800/1200',
          date: formattedDate,
          location: 'Multiple Theatres',
          price: 250 + (index % 3) * 50,
          rating: movie.rnr?.hasUReview ? 4.0 + (index % 10) / 10 : 4.2,
          genre: movie.grn || ['Movie'],
          language: languages.length > 0 ? Array.from(new Set(languages)).join(', ') : 'Hindi',
          description: `Experience ${movie.name} in cinemas now. Duration: ${movie.duration} mins. Censor: ${movie.censor}.`,
          isTrending: index < 5,
        };
      });

      // Deduplicate cards by movie title while preserving all available languages.
      const dedupedMoviesMap = new Map<string, any>();
      for (const movie of formattedMovies) {
        const key = normalizeTitle(movie.title || '');
        const existing = dedupedMoviesMap.get(key);

        if (!existing) {
          dedupedMoviesMap.set(key, movie);
          continue;
        }

        const existingLanguages = String(existing.language || '')
          .split(',')
          .map((lang: string) => lang.trim())
          .filter(Boolean);
        const movieLanguages = String(movie.language || '')
          .split(',')
          .map((lang: string) => lang.trim())
          .filter(Boolean);

        existing.language = Array.from(new Set([...existingLanguages, ...movieLanguages])).join(', ');
        existing.genre = Array.from(new Set([...(existing.genre || []), ...(movie.genre || [])]));
        existing.rating = Math.max(existing.rating || 0, movie.rating || 0);
        existing.price = Math.min(existing.price || movie.price, movie.price);
        existing.isTrending = existing.isTrending || movie.isTrending;
      }
      const dedupedMovies = Array.from(dedupedMoviesMap.values());

      if (dedupedMovies.length > 0) {
        cache.set(cacheKey, dedupedMovies);
        return res.json(dedupedMovies);
      } else {
        return res.status(404).json({ error: "No movies found for this city" });
      }
    } catch (error) {
      console.error("Error fetching movies from Paytm:", error);
      return res.status(500).json({ error: "Failed to fetch movies" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    const id = req.params.id;
    const city = (req.query.city as string) || 'mumbai';
    const normalizedCity = city.toLowerCase().trim();
    
    try {
      const response = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=${encodeURIComponent(normalizedCity)}&movieCode=${id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      const movies = response.data?.meta?.movies || [];
      if (movies.length === 0) {
        return res.status(404).json({ error: "Movie not found" });
      }
      
      const movie = movies[0];
      
      const date = new Date();
      date.setDate(date.getDate() + 1); // Tomorrow
      const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', 7:30 PM';
      
      const formattedMovie = {
        id: `paytm-${movie.id}`,
        title: movie.name || movie.label,
        type: 'movie',
        imageUrl: movie.appImgPath || movie.imgPath || 'https://picsum.photos/seed/movie/800/1200',
        date: formattedDate,
        location: 'Multiple Theatres',
        price: 350,
        rating: movie.rnr?.hasUReview ? 4.5 : 4.0,
        genre: movie.grn || ['Movie'],
        language: movie.lang || 'Hindi',
        description: `Experience ${movie.name} in cinemas now. Duration: ${movie.duration} mins. Censor: ${movie.censor}.`,
        isTrending: true,
        trailerUrl: movie.trailer && movie.trailer !== 'NA' ? movie.trailer : undefined,
      };
      
      return res.json(formattedMovie);
    } catch (error) {
      console.error("Error fetching movie details from Paytm:", error);
      return res.status(500).json({ error: "Failed to fetch movie details" });
    }
  });

  app.get("/api/trailer", async (req, res) => {
    const title = req.query.title as string;
    if (!title) {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const cacheKey = `trailer_${title.toLowerCase().trim()}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({ url: cachedData });
    }

    try {
      // Direct YouTube search
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Extract the first video ID from the ytInitialData JSON in the HTML
      const match = response.data.match(/{"videoRenderer":{"videoId":"([^"]+)"/);
      if (match && match[1]) {
        const videoId = match[1];
        const trailerUrl = `https://www.youtube.com/watch?v=${videoId}`;
        cache.set(cacheKey, trailerUrl);
        return res.json({ url: trailerUrl });
      } else {
        return res.status(404).json({ error: "Trailer not found on YouTube" });
      }
    } catch (error) {
      console.error("Error fetching trailer from YouTube:", error);
      return res.status(500).json({ error: "Failed to fetch trailer" });
    }
  });

  app.get("/api/theatres", async (req, res) => {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: "City parameter is required" });
    }

    const normalizedCity = city.toLowerCase().trim();
    const capitalizedCity = normalizedCity.charAt(0).toUpperCase() + normalizedCity.slice(1);
    const cacheKey = `theatres_${normalizedCity}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    try {
      const response = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/cinemas?city=${encodeURIComponent(normalizedCity)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      const cinemas = response.data?.data?.cinemas || [];
      
      if (cinemas.length > 0) {
        const uniqueTheatres = cinemas.map((c: any) => ({
          id: c.id,
          name: c.name || c.label,
          area: c.city || capitalizedCity,
          address: c.address || capitalizedCity,
          phone: "N/A", // Paytm doesn't provide phone numbers in this endpoint
          rating: (4.0 + Math.random() * 0.8).toFixed(1) // Generate a random rating between 4.0 and 4.8
        }));

        cache.set(cacheKey, uniqueTheatres);
        return res.json(uniqueTheatres);
      } else {
        // Fallback to mock data if no cinemas found
        console.log("No cinemas found via Paytm, returning mock data");
        const mockTheatres = [
          {
            name: `PVR Cinemas, ${capitalizedCity}`,
            area: "City Center",
            address: `Main Mall, ${capitalizedCity}`,
            phone: "079-12345678",
            rating: "4.5"
          },
          {
            name: `INOX Movies, ${capitalizedCity}`,
            area: "Downtown",
            address: `Plaza Square, ${capitalizedCity}`,
            phone: "079-87654321",
            rating: "4.2"
          }
        ];
        cache.set(cacheKey, mockTheatres);
        return res.json(mockTheatres);
      }
    } catch (error) {
      console.error("Overall scraping error:", error);
      // Fallback to mock data on error
      console.log("Returning mock data due to API error");
      const mockTheatres = [
        {
          name: `PVR Cinemas, ${capitalizedCity}`,
          area: "City Center",
          address: `Main Mall, ${capitalizedCity}`,
          phone: "079-12345678",
          rating: "4.5"
        },
        {
          name: `INOX Movies, ${capitalizedCity}`,
          area: "Downtown",
          address: `Plaza Square, ${capitalizedCity}`,
          phone: "079-87654321",
          rating: "4.2"
        }
      ];
      // Don't cache the error fallback so it can try again later
      return res.json(mockTheatres);
    }
  });

  app.get("/api/movies/:id/showtimes", async (req, res) => {
    const id = req.params.id;
    const city = (req.query.city as string) || 'mumbai';
    const date = req.query.date as string; // YYYY-MM-DD format
    const normalizedCity = city.toLowerCase().trim();
    
    // Remove 'paytm-' or 'tmdb-' prefix if present
    let movieId = id;
    if (id.startsWith('paytm-')) movieId = id.replace('paytm-', '');
    if (id.startsWith('tmdb-')) movieId = id.replace('tmdb-', '');
    
    try {
      let url = `https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=${encodeURIComponent(normalizedCity)}&movieCode=${movieId}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      const sessionsData = response.data?.pageData?.sessions || [];
      const cinemas = response.data?.meta?.cinemas || [];
      
      let sessionsList: any[] = [];
      if (Array.isArray(sessionsData)) {
        sessionsList = sessionsData;
      } else if (typeof sessionsData === 'object' && sessionsData !== null) {
        Object.values(sessionsData).forEach((val: any) => {
          if (Array.isArray(val)) {
            sessionsList = sessionsList.concat(val);
          }
        });
      }
      
      // Group sessions by cinema
      const showtimesByCinema: Record<string, any> = {};
      
      // Get current absolute time
      const now = new Date().getTime();

      sessionsList.forEach((session: any) => {
        const [datePart, timePart] = session.showTime.split('T');
        const [hourStr, minuteStr] = timePart.split(':');
        
        // Parse session time as UTC (Paytm API returns UTC times without 'Z')
        const [year, month, day] = datePart.split('-');
        const sessionTimeUtc = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hourStr), parseInt(minuteStr));
        
        // Skip if showtime has passed (adding a 15-minute buffer so you can't book right as it starts)
        if (sessionTimeUtc < now - 15 * 60000) {
          return;
        }

        const cid = session.cid;
        if (!showtimesByCinema[cid]) {
          const cinemaMeta = cinemas.find((c: any) => c.id === cid) || {};
          showtimesByCinema[cid] = {
            id: cid,
            name: cinemaMeta.name || cinemaMeta.label || 'Unknown Theatre',
            area: cinemaMeta.city || normalizedCity,
            address: cinemaMeta.address || normalizedCity,
            rating: (4.0 + Math.random() * 0.8).toFixed(1), // Random rating
            showtimes: []
          };
        }
        
        // Convert UTC to IST (+5:30)
        const istTime = new Date(sessionTimeUtc + 5.5 * 60 * 60 * 1000);
        let hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        
        const price = session.areas && session.areas.length > 0 ? session.areas[0].price : 200;
        
        // Determine status based on statusColor
        let status = 'Available';
        if (session.areas && session.areas.length > 0) {
          const color = session.areas[0].statusColor;
          if (color === 'O') status = 'Filling Fast';
          else if (color === 'R') status = 'Sold Out';
        }
        
        showtimesByCinema[cid].showtimes.push({
          time: `${hours}:${minutesStr} ${ampm}`,
          format: session.format || '2D',
          price,
          status,
          rawTime: session.showTime
        });
      });
      
      // Convert to array and sort showtimes
      const result = Object.values(showtimesByCinema).map((cinema: any) => {
        cinema.showtimes.sort((a: any, b: any) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime());
        return cinema;
      });
      
      const availableDates = response.data?.data?.sessionDates || [];
      
      return res.json({ cinemas: result, availableDates });
    } catch (error) {
      console.error('Error fetching movie showtimes:', error);
      return res.status(500).json({ error: "Failed to fetch movie showtimes" });
    }
  });

  app.get("/api/theatres/:id/showtimes", async (req, res) => {
    const id = req.params.id;
    const city = (req.query.city as string) || 'mumbai';
    const date = req.query.date as string; // YYYY-MM-DD format
    const normalizedCity = city.toLowerCase().trim();
    
    try {
      let url = `https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=${encodeURIComponent(normalizedCity)}&cinemaId=${id}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      const sessions = response.data?.pageData?.sessions || [];
      const movies = response.data?.meta?.movies || [];
      
      // Group sessions by movie
      const showtimesByMovie: Record<string, any> = {};
      
      // Get current absolute time
      const now = new Date().getTime();

      sessions.forEach((session: any) => {
        const [datePart, timePart] = session.showTime.split('T');
        const [hourStr, minuteStr] = timePart.split(':');
        
        // Parse session time as UTC (Paytm API returns UTC times without 'Z')
        const [year, month, day] = datePart.split('-');
        const sessionTimeUtc = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hourStr), parseInt(minuteStr));
        
        // Skip if showtime has passed (adding a 15-minute buffer so you can't book right as it starts)
        if (sessionTimeUtc < now - 15 * 60000) {
          return;
        }

        const mid = session.mid;
        if (!showtimesByMovie[mid]) {
          const movieMeta = movies.find((m: any) => m.id === mid) || {};
          showtimesByMovie[mid] = {
            id: `paytm-${mid}`,
            title: movieMeta.name || movieMeta.label || 'Unknown Movie',
            imageUrl: movieMeta.appImgPath || movieMeta.imgPath || 'https://picsum.photos/seed/movie/800/1200',
            language: movieMeta.lang || 'Hindi',
            genre: movieMeta.grn || ['Movie'],
            rating: movieMeta.rnr?.hasUReview ? 4.5 : 4.0,
            showtimes: []
          };
        }
        
        // Convert UTC to IST (+5:30)
        const istTime = new Date(sessionTimeUtc + 5.5 * 60 * 60 * 1000);
        let hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        
        const price = session.areas && session.areas.length > 0 ? session.areas[0].price : 200;
        
        // Determine status based on statusColor
        let status = 'Available';
        if (session.areas && session.areas.length > 0) {
          const color = session.areas[0].statusColor;
          if (color === 'O') status = 'Filling Fast';
          else if (color === 'R') status = 'Sold Out';
        }
        
        showtimesByMovie[mid].showtimes.push({
          time: `${hours}:${minutesStr} ${ampm}`,
          format: session.format || '2D',
          price,
          status,
          rawTime: session.showTime
        });
      });
      
      // Convert to array and sort showtimes
      const result = Object.values(showtimesByMovie).map((movie: any) => {
        movie.showtimes.sort((a: any, b: any) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime());
        return movie;
      });
      
      const availableDates = response.data?.data?.sessionDates || [];
      
      return res.json({ movies: result, availableDates });
    } catch (error) {
      console.error('Error fetching theatre showtimes:', error);
      return res.status(500).json({ error: "Failed to fetch theatre showtimes" });
    }
  });

  app.get("/api/theatres/refresh", (req, res) => {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: "City parameter is required" });
    }
    const normalizedCity = city.toLowerCase().trim();
    cache.del(`theatres_${normalizedCity}`);
    res.json({ message: `Cache cleared for ${city}` });
  });

  // --- Seating & Reservation System ---

  interface Seat {
    id: string;
    row: string;
    col: number;
    status: 'available' | 'reserved' | 'booked';
    price: number;
    type: 'seat' | 'empty';
    section: string;
  }

  interface Reservation {
    id: string;
    eventId: string;
    userId: string;
    seatIds: string[];
    expiresAt: number;
  }

  // In-memory store for seats and reservations (simulating Redis/DB)
  const seatMaps = new Map<string, Seat[]>();
  const reservations = new Map<string, Reservation>();
  
  // Keep track of SSE clients
  const sseClients = new Map<string, express.Response[]>();

  const notifyClients = (eventId: string, seats: Seat[]) => {
    const clients = sseClients.get(eventId);
    if (clients) {
      const data = `data: ${JSON.stringify(seats)}\n\n`;
      clients.forEach(client => client.write(data));
    }
  };

  const generateSeatMap = async (eventId: string): Promise<Seat[]> => {
    if (seatMaps.has(eventId)) {
      return seatMaps.get(eventId)!;
    }

    const seats: Seat[] = [];
    const parts = eventId.split('|');
    const movieId = parts[0];
    const showTime = parts[1];
    const cinemaId = parts[2];
    const dateStr = parts[3];

    let layout: any[] = [];

    if (cinemaId && dateStr && movieId.startsWith('paytm-')) {
      try {
        const mid = movieId.replace('paytm-', '');
        let url = `https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=mumbai&cinemaId=${cinemaId}&date=${dateStr}`;
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const sessions = response.data?.pageData?.sessions || [];
        
        const session = sessions.find((s: any) => {
          if (s.mid !== mid) return false;
          const [datePart, timePart] = s.showTime.split('T');
          const [hourStr, minuteStr] = timePart.split(':');
          const sessionTimeUtc = Date.UTC(parseInt(datePart.split('-')[0]), parseInt(datePart.split('-')[1]) - 1, parseInt(datePart.split('-')[2]), parseInt(hourStr), parseInt(minuteStr));
          const istTime = new Date(sessionTimeUtc + 5.5 * 60 * 60 * 1000);
          let hours = istTime.getUTCHours();
          const minutes = istTime.getUTCMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const minutesStr = minutes < 10 ? '0' + minutes : minutes;
          const formattedTime = `${hours}:${minutesStr} ${ampm}`;
          return formattedTime === showTime;
        });

        if (session && session.areas && session.areas.length > 0) {
          let currentRowCharCode = 65; // 'A'
          const sortedAreas = [...session.areas]
            .filter((a: any) => a.sTotal > 0)
            .sort((a: any, b: any) => a.price - b.price);
          layout = sortedAreas.map((area: any) => {
            const numRows = Math.ceil(area.sTotal / 22); // Assume 22 seats per row max
            const rows = [];
            for (let i = 0; i < numRows; i++) {
              rows.push(String.fromCharCode(currentRowCharCode++));
            }
            const seatsPerRow = Math.ceil(area.sTotal / numRows);
            const sideBlock = Math.floor(seatsPerRow * 0.25);
            const centerBlock = seatsPerRow - (sideBlock * 2);
            return {
              name: area.label,
              price: area.price,
              rows: rows,
              blocks: [sideBlock, centerBlock, sideBlock].filter(b => b > 0)
            };
          });
        }
      } catch (e) {
        console.error("Error fetching real seat layout", e);
      }
    }

    if (layout.length === 0) {
      let hash = 0;
      for (let i = 0; i < eventId.length; i++) {
        hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const layouts = [
        [
          { name: 'CLASSIC', price: 200, rows: ['A', 'B', 'C', 'D', 'E', 'F'], blocks: [5, 12, 5] },
          { name: 'PRIME', price: 300, rows: ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'], blocks: [5, 12, 5] },
          { name: 'RECLINER', price: 450, rows: ['O', 'P'], blocks: [4, 8, 4] }
        ],
        [
          { name: 'EXECUTIVE', price: 250, rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], blocks: [6, 14, 6] },
          { name: 'CLUB', price: 350, rows: ['J', 'K', 'L', 'M'], blocks: [6, 14, 6] }
        ],
        [
          { name: 'FRONT STALL', price: 200, rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], blocks: [5, 12, 5] },
          { name: 'REAR STALL', price: 300, rows: ['I', 'J', 'K', 'L', 'M', 'N'], blocks: [5, 12, 5] },
          { name: 'BALCONY', price: 500, rows: ['O', 'P', 'Q'], blocks: [4, 10, 4] }
        ]
      ];
      layout = layouts[Math.abs(hash) % layouts.length];
    }
    
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    let seed = Math.abs(hash);
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    layout.forEach(section => {
      section.rows.forEach((row: string) => {
        let colCounter = 1;
        section.blocks.forEach((blockSize: number, blockIndex: number) => {
          // Add seats for the block
          for (let i = 0; i < blockSize; i++) {
            seats.push({
              id: `${row}${colCounter}`,
              row,
              col: colCounter,
              status: 'available',
              price: section.price,
              type: 'seat',
              section: section.name
            });
            colCounter++;
          }
          // Add an empty gap after the block (except the last block)
          if (blockIndex < section.blocks.length - 1) {
            seats.push({
              id: `gap-${row}-${blockIndex}`,
              row,
              col: -1, // Indicates gap
              status: 'available',
              price: 0,
              type: 'empty',
              section: section.name
            });
          }
        });
      });
    });

    seatMaps.set(eventId, seats);
    return seats;
  };

  // Cleanup expired reservations periodically
  setInterval(() => {
    const now = Date.now();
    let changedEvents = new Set<string>();

    reservations.forEach((res, resId) => {
      if (now > res.expiresAt) {
        // Expire reservation
        reservations.delete(resId);
        
        const seats = seatMaps.get(res.eventId);
        if (seats) {
          let updated = false;
          seats.forEach(seat => {
            if (res.seatIds.includes(seat.id) && seat.status === 'reserved') {
              seat.status = 'available';
              updated = true;
            }
          });
          if (updated) changedEvents.add(res.eventId);
        }
      }
    });

    // Notify clients of freed seats
    changedEvents.forEach(eventId => {
      notifyClients(eventId, seatMaps.get(eventId)!);
    });
  }, 5000);

  app.use(express.json());

  app.get("/api/events/:id/seats", async (req, res) => {
    const eventId = req.params.id;
    const seats = await generateSeatMap(eventId);
    res.json(seats);
  });

  app.get("/api/events/:id/seats/stream", async (req, res) => {
    const eventId = req.params.id;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial state
    const seats = await generateSeatMap(eventId);
    res.write(`data: ${JSON.stringify(seats)}\n\n`);

    if (!sseClients.has(eventId)) {
      sseClients.set(eventId, []);
    }
    sseClients.get(eventId)!.push(res);

    req.on('close', () => {
      const clients = sseClients.get(eventId);
      if (clients) {
        sseClients.set(eventId, clients.filter(c => c !== res));
      }
    });
  });

  app.post("/api/events/:id/reserve", async (req, res) => {
    const eventId = req.params.id;
    const { seatIds, userId } = req.body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: "Invalid seatIds" });
    }

    const seats = await generateSeatMap(eventId);
    
    // Check availability (Optimistic Concurrency Control)
    const unavailable = seatIds.filter(id => {
      const seat = seats.find(s => s.id === id);
      return !seat || seat.status !== 'available';
    });

    if (unavailable.length > 0) {
      return res.status(409).json({ 
        error: "Some seats are no longer available", 
        unavailableSeats: unavailable 
      });
    }

    // Reserve seats
    seatIds.forEach(id => {
      const seat = seats.find(s => s.id === id);
      if (seat) seat.status = 'reserved';
    });

    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    reservations.set(reservationId, {
      id: reservationId,
      eventId,
      userId: userId || 'anonymous',
      seatIds,
      expiresAt
    });

    notifyClients(eventId, seats);

    res.json({
      reservationId,
      expiresAt,
      message: "Seats reserved successfully. Please complete payment within 5 minutes."
    });
  });

  app.post("/api/events/:id/commit", async (req, res) => {
    const eventId = req.params.id;
    const { reservationId, paymentToken } = req.body;

    const reservation = reservations.get(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found or expired" });
    }

    // In a real app, verify paymentToken here
    if (!paymentToken) {
      return res.status(400).json({ error: "Payment token required" });
    }

    const seats = await generateSeatMap(eventId);
    
    // Commit seats
    reservation.seatIds.forEach(id => {
      const seat = seats.find(s => s.id === id);
      if (seat && seat.status === 'reserved') {
        seat.status = 'booked';
      }
    });

    reservations.delete(reservationId);
    notifyClients(eventId, seats);

    res.json({ success: true, message: "Booking confirmed!" });
  });

  // Production: Serve static files from dist
  if (process.env.NODE_ENV === "production") {
    const path = await import("path");
    app.use(express.static(path.resolve("dist")));
    
    // Handle SPA routing - send index.html for any other requests not handled by API
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }
  // Development: Vite middleware
  else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
