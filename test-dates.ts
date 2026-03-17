import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=delhi-ncr&cinemaId=1390', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log("Data keys:", Object.keys(res.data.data || {}));
    if (res.data.data) {
      console.log("Data content:", JSON.stringify(res.data.data, null, 2).substring(0, 500));
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
