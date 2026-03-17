import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function run() {
  try {
    const url = 'https://www.justdial.com/Bengaluru/Cinema-Halls';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    console.log("Status:", response.status);
    const html = await response.text();
    
    const $ = cheerio.load(html);
    const results = [];
    
    // JustDial uses different classes, let's look for common ones
    $('.resultbox_info, .store-details, .jsx-3349e7cd87e12d75').each((i, el) => {
      const name = $(el).find('.resultbox_title_anchor, .store-name, h2').text().trim();
      if (name) {
        results.push(name);
      }
    });
    
    console.log("Found:", results.length);
    console.log(results.slice(0, 5));
  } catch (e) {
    console.error(e.message);
  }
}

run();
