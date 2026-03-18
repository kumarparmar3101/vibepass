import { Event } from '../data/mockData';

const TMDB_API_KEY = '15bdb183bd188bcdff0a6666ed0d2634';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const fetchNowPlayingMovies = async (city: string = 'mumbai'): Promise<Event[]> => {
  try {
    const response = await fetch(`/api/movies?city=${encodeURIComponent(city)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movies from backend:', error);
    return [];
  }
};

export const fetchTrailerFromTMDB = async (title: string): Promise<string | null> => {
  try {
    // 1. Search for the movie on TMDB
    const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movieId = searchData.results[0].id;
      
      // 2. Get the videos for the movie
      const videosRes = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
      const videosData = await videosRes.json();
      
      if (videosData.results && videosData.results.length > 0) {
        // Find a trailer
        const trailer = videosData.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
          return `https://www.youtube.com/watch?v=${trailer.key}`;
        }
        // Fallback to any YouTube video
        const anyYoutube = videosData.results.find((v: any) => v.site === 'YouTube');
        if (anyYoutube) {
          return `https://www.youtube.com/watch?v=${anyYoutube.key}`;
        }
      }
    }
    
    // 3. Fallback to direct YouTube search via our backend
    console.log(`TMDB trailer not found for ${title}, falling back to YouTube search...`);
    const ytRes = await fetch(`/api/trailer?title=${encodeURIComponent(title)}`);
    if (ytRes.ok) {
      const ytData = await ytRes.json();
      if (ytData.url) {
        return ytData.url;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching trailer:', error);
    
    // Fallback to direct YouTube search via our backend on error
    try {
      const ytRes = await fetch(`/api/trailer?title=${encodeURIComponent(title)}`);
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (ytData.url) {
          return ytData.url;
        }
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback trailer:', fallbackError);
    }
    
    return null;
  }
};

export const fetchMovieCredits = async (title: string) => {
  try {
    const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movieId = searchData.results[0].id;
      
      const creditsRes = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
      const creditsData = await creditsRes.json();
      
      return {
        cast: creditsData.cast ? creditsData.cast.slice(0, 10) : [],
        crew: creditsData.crew ? creditsData.crew.slice(0, 10) : []
      };
    }
    return { cast: [], crew: [] };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return { cast: [], crew: [] };
  }
};

export const fetchMovieDetails = async (id: string, city: string = 'mumbai'): Promise<Event | null> => {
  try {
    const paytmId = id.replace('paytm-', '').replace('tmdb-', '');
    const response = await fetch(`/api/movies/${paytmId}?city=${encodeURIComponent(city)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.status}`);
    }

    const movie = await response.json();
    return movie;
  } catch (error) {
    console.error('Error fetching movie details from backend:', error);
    return null;
  }
};
