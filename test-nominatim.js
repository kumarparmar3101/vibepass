import fetch from 'node-fetch';

async function test() {
  const city = 'Mumbai';
  const url = `https://nominatim.openstreetmap.org/search?q=cinema+in+${encodeURIComponent(city)}&format=json&limit=50`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MovieWalletApp/1.0'
    }
  });
  const data = await response.json();
  console.log(data.length);
  console.log(data.slice(0, 2));
}
test();
