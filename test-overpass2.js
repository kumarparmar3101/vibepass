import fetch from 'node-fetch';

async function run() {
  try {
    const city = 'Bengaluru';
    const query = `
      [out:json][timeout:25];
      area[name="${city}"]->.searchArea;
      (
        node["amenity"="cinema"](area.searchArea);
        way["amenity"="cinema"](area.searchArea);
        relation["amenity"="cinema"](area.searchArea);
      );
      out body;
      >;
      out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter`;
    const response = await fetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MovieWalletApp/1.0',
      }
    });
    
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Found:", data.elements.length);
    const cinemas = data.elements
      .filter(e => e.tags && e.tags.name)
      .map(e => ({
        name: e.tags.name,
        address: [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || city,
      }));
    console.log(cinemas.slice(0, 5));
  } catch (e) {
    console.error(e.message);
  }
}

run();
