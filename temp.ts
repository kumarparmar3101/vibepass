import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/movie?meta=1&reqData=1&city=mumbai&movieCode=1234');
    console.log(Object.keys(res.data));
    console.log(Object.keys(res.data.pageData || {}));
  } catch (e) {
    console.error(e.message);
  }
}
test();
