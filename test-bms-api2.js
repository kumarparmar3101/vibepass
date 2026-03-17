import fetch from 'node-fetch';

async function run() {
  try {
    const url = 'https://in.bookmyshow.com/serv/getData?cmd=GETREGIONS';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Length:", text.length);
    console.log(text.substring(0, 500));
  } catch (e) {
    console.error(e.message);
  }
}

run();
