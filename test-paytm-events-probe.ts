import * as cheerio from 'cheerio';
import axios from 'axios';

async function probe() {
  const cities = ['bengaluru', 'mumbai'];
  
  for (const city of cities) {
    console.log(`\nScraping events for ${city}...`);
    try {
      const url = `https://paytm.com/events/${city}`;
      const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status}`);
      
      const $ = cheerio.load(res.data);
      const title = $('title').text();
      console.log(`Page Title: ${title}`);
      
      // Look for JSON data embedded in the page (often in script tags)
      $('script').each((i, el) => {
        const content = $(el).html();
        if (content && content.includes('initialState')) {
             console.log("Found initialState script!");
             // simplistic regex to extract JSON
             const match = content.match(/window\.__INITIAL_STATE__\s*=\s*({.*});/);
             if (match) {
                 const json = JSON.parse(match[1]);
                 console.log("Extracted Initial State keys:", Object.keys(json));
                 if (json.pageData) {
                     console.log("PageData keys:", Object.keys(json.pageData));
                 }
             }
        }
      });
      
      // Just check if there are event cards
      const cards = $('div[class*="EventCard"]'); // simplistic selector guess
      console.log(`Found ${cards.length} potential event cards`);

    } catch (e: any) {
      console.error(`Error scraping ${city}:`, e.message);
    }
  }
}

probe();
