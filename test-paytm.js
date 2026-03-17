import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import fs from 'fs';

async function run() {
  try {
    const url = 'https://paytm.com/movies/bengaluru';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    console.log("Status:", response.status);
    const html = await response.text();
    fs.writeFileSync('paytm.html', html);
    
    const $ = cheerio.load(html);
    const results = [];
    
    $('a[href*="/movies/bengaluru/"]').each((i, el) => {
      const name = $(el).text().trim();
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
