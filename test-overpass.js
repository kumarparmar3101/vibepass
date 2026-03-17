import fetch from 'node-fetch';

async function test(city) {
  const formattedCity = city.split(/[\s-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('.*');
  console.log("Formatted:", formattedCity);
  try {
      const query = `
        [out:json][timeout:25];
        area[name~"^${formattedCity}$"]->.searchArea;
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
      
      const data = await response.json();
      console.log("Overpass API returned elements:", data.elements?.length);
  } catch (e) {
    console.error(e);
  }
}
test('navi mumbai');
test('new delhi');
test('mumbai');
