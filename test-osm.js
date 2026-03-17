import fetch from 'node-fetch';

async function run() {
  try {
    const city = 'Bengaluru';
    const url = `https://nominatim.openstreetmap.org/search?q=cinema+in+${city}&format=json&limit=10`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MovieWalletApp/1.0 (contact@example.com)',
      }
    });
    
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Found:", data.length);
    console.log(data.map(d => d.display_name));
  } catch (e) {
    console.error(e.message);
  }
}

run();
