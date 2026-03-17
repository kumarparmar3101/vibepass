import axios from 'axios';

async function testPaytmDetail() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/movies?city=mumbai', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const movies = res.data.data.movies;
    for (let i = 0; i < Math.min(5, movies.length); i++) {
        console.log(`Movie: ${movies[i].name}, Trailer: ${movies[i].trailer}`);
    }
  } catch (e) {
    console.error("Paytm detail error:", e.message);
  }
}
testPaytmDetail();
