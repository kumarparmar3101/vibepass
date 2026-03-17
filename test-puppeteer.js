import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const city = 'Bengaluru';
  
  console.log("Trying JustDial...");
  const justDialUrl = `https://www.justdial.com/${city}/Cinema-Halls`;
  await page.goto(justDialUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('jd.html', html);
  
  let theatres = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.resultbox_info, .store-details');
    items.forEach((item) => {
      const nameEl = item.querySelector('.resultbox_title_anchor, .store-name');
      if (nameEl && nameEl.textContent) {
        results.push(nameEl.textContent.trim());
      }
    });
    return results;
  });
  console.log("JustDial found:", theatres.length);
  
  if (theatres.length === 0) {
    console.log("Trying BookMyShow...");
    const bmsUrl = `https://in.bookmyshow.com/${city.toLowerCase()}/cinemas`;
    await page.goto(bmsUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log("Title:", await page.title());
    
    const html = await page.evaluate(() => document.body.innerHTML);
    const fs = require('fs');
    fs.writeFileSync('bms.html', html);
    
    theatres = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('.cinema-name-wrapper, .cinema-info-wrapper, .venue-info, .cinema-name, a[href*="/cinemas/"]');
      items.forEach((item) => {
        const nameEl = item.querySelector('.__cinema-name, .cinema-name, .venue-name') || item;
        if (nameEl && nameEl.textContent) {
          const name = nameEl.textContent.trim();
          if (name && name.length > 3 && !name.includes('BookMyShow')) {
            results.push(name);
          }
        }
      });
      return results;
    });
    console.log("BookMyShow found:", theatres.length);
  }
  
  await browser.close();
}

run().catch(console.error);
