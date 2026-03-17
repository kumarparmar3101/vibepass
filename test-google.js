import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const city = 'Bengaluru';
  
  console.log("Trying Google Search...");
  const googleUrl = `https://www.google.com/search?q=movie+theatres+in+${city}`;
  await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('google.html', html);
  
  const theatres = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.rllt__details');
    items.forEach((item) => {
      const nameEl = item.querySelector('.OSrXXb');
      const addressEl = item.querySelector('div:nth-child(3)');
      const ratingEl = item.querySelector('.Y0A0hc .yi40Hd');
      
      if (nameEl && nameEl.textContent) {
        results.push({
          name: nameEl.textContent.trim(),
          address: addressEl ? addressEl.textContent.trim() : '',
          rating: ratingEl ? ratingEl.textContent.trim() : 'N/A'
        });
      }
    });
    return results;
  });
  console.log("Google found:", theatres.length);
  console.log(theatres);
  
  await browser.close();
}

run().catch(console.error);
