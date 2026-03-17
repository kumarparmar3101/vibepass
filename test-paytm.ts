import axios from 'axios';

async function test() {
  try {
    const url = 'https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=mumbai&cinemaId=1000000&date=2025-05-10'; // Need a valid cinemaId and date
    // Let's just search for a movie in Mumbai to get a valid cinemaId and date
    const searchUrl = 'https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=mumbai';
    const res = await axios.get(searchUrl);
    const movies = res.data?.pageData?.sessions || [];
    if (movies.length > 0) {
      const firstMovie = movies[0];
      const mid = firstMovie.mid;
      const cinemaId = firstMovie.cid;
      const date = firstMovie.showTime.split('T')[0];
      console.log('Found movie:', mid, 'cinema:', cinemaId, 'date:', date);
      
      const cinemaUrl = `https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=mumbai&cinemaId=${cinemaId}&date=${date}`;
      const cinemaRes = await axios.get(cinemaUrl);
      const sessions = cinemaRes.data?.pageData?.sessions || [];
      if (sessions.length > 0) {
        console.log('Session keys:', Object.keys(sessions[0]));
        console.log('Session:', JSON.stringify(sessions[0], null, 2));
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
