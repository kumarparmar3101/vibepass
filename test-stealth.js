import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  const page = await browser.newPage();
  
  const city = 'Bengaluru';
  
  console.log("Trying JustDial...");
  const justDialUrl = `https://www.justdial.com/${city}/Cinema-Halls`;
  await page.goto(justDialUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('jd-stealth.html', html);
  
  let theatres = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.resultbox_info, .store-details, .jsx-3349e7cd87e12d75');
    items.forEach((item) => {
      const nameEl = item.querySelector('.resultbox_title_anchor, .store-name, h2');
      if (nameEl && nameEl.textContent) {
        results.push(nameEl.textContent.trim());
      }
    });
    return results;
  });
  console.log("JustDial found:", theatres.length);
  console.log(theatres.slice(0, 5));
  
  await browser.close();
}

run().catch(console.error);
