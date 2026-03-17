import axios from 'axios';

async function testPaytmMovieDetail() {
  try {
    const res = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=mumbai&movieCode=OB88HH`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const movies = res.data?.meta?.movies || [];
    if (movies.length > 0) {
        console.log("Movie details:", JSON.stringify(movies[0], null, 2));
    } else {
        console.log("Movie not found");
    }
  } catch (e) {
    console.error("Paytm detail error:", e.message);
  }
}
testPaytmMovieDetail();
