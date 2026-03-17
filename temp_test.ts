import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/events?city=mumbai');
    console.log("PAYTM EVENTS:", Object.keys(res.data));
  } catch (e) {
    console.log("PAYTM EVENTS ERROR:", e.message);
  }
}

test();
