import axios from 'axios';

async function testPaytmMovieDetail() {
  try {
    const resList = await axios.get('https://apiproxy.paytm.com/v3/movies/search/movies?city=mumbai', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const moviesList = resList.data?.data?.movies || [];
    const dhurandhar = moviesList.find(m => m.name.includes('Dhurandhar'));
    if (dhurandhar) {
        console.log("Dhurandhar trailer:", dhurandhar.trailer);
    } else {
        console.log("Dhurandhar not found");
    }
  } catch (e) {
    console.error("Paytm detail error:", e.message);
  }
}
testPaytmMovieDetail();
