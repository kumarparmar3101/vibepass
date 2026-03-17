export const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    // Try Nominatim first
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'MovieWalletApp/1.0'
        }
      }
    );
    if (!response.ok) throw new Error('Nominatim failed');
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || 'Unknown Location';
  } catch (error) {
    console.warn('Nominatim failed, trying fallback...', error);
    try {
      // Fallback to BigDataCloud (Client-side free)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (!response.ok) throw new Error('BigDataCloud failed');
      const data = await response.json();
      return data.city || data.locality || data.principalSubdivision || 'Unknown Location';
    } catch (fallbackError) {
      console.error('All geocoding failed:', fallbackError);
      return 'Current Location';
    }
  }
};

export const getCityFromIp = async (): Promise<string> => {
  const providers = [
    'https://ipapi.co/json/',
    'https://ipwho.is/'
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const city =
        data.city ||
        data.locality ||
        data.region ||
        data.region_name;

      if (city && typeof city === 'string') {
        return city;
      }
    } catch (error) {
      console.warn(`IP city lookup failed for ${url}`, error);
    }
  }

  return 'Current Location';
};
