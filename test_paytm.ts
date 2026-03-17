import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('https://apiproxy.paytm.com/v3/movies/search/cinemas?city=mumbai');
    const cinemaId = res.data.data.cinemas[0].id;
    console.log('Cinema ID:', cinemaId);
    const res2 = await axios.get(`https://apiproxy.paytm.com/v3/movies/search/cinema?meta=1&reqData=1&city=mumbai&cinemaId=${cinemaId}`);
    console.log(JSON.stringify(res2.data.pageData.sessions[0], null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
