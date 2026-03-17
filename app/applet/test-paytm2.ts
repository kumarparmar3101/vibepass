import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/movies?city=mumbai', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const movies = res.data?.data?.movies;
    if (movies && movies.length > 0) {
      const movieId = movies[0].id;
      console.log("Found movie ID:", movieId);
      
      const res2 = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=mumbai&movieCode=${movieId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const sessions = res2.data?.pageData?.sessions;
      console.log("Type:", typeof sessions);
      console.log("IsArray:", Array.isArray(sessions));
      if (!Array.isArray(sessions) && sessions) {
        const keys = Object.keys(sessions);
        console.log("Keys:", keys.slice(0, 5));
        if (keys.length > 0) {
          console.log("Value type for first key:", typeof sessions[keys[0]]);
          console.log("IsArray for first key:", Array.isArray(sessions[keys[0]]));
          if (Array.isArray(sessions[keys[0]])) {
            console.log("First item in array keys:", Object.keys(sessions[keys[0]][0]));
          }
        }
      }
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
