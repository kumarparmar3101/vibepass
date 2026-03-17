import fetch from 'node-fetch';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://paytm.com/movies/bengaluru/cinemas';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    console.log("Status:", response.status);
    const html = await response.text();
    console.log("Length:", html.length);
    fs.writeFileSync('paytm-cinemas.html', html);
  } catch (e) {
    console.error(e.message);
  }
}

run();
