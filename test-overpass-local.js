import fetch from 'node-fetch';

async function test() {
  const city = 'bengaluru';
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  try {
      const query = `
        [out:json][timeout:25];
        area[name="${capitalizedCity}"]->.searchArea;
        (
          node["amenity"="cinema"](area.searchArea);
          way["amenity"="cinema"](area.searchArea);
          relation["amenity"="cinema"](area.searchArea);
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MovieWalletApp/1.0',
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Overpass API error response:", text);
        throw new Error(`Overpass API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Overpass API returned elements:", data.elements?.length);
  } catch (e) {
    console.error(e);
  }
}
test();
