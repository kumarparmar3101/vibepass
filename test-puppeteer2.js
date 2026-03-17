import puppeteer from 'puppeteer';
import fs from 'fs';

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
  
  try {
    await page.goto(justDialUrl, { timeout: 15000 });
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('jd2.html', html);
    
    await page.waitForSelector('.resultbox_info, .store-details, .jsx-3349e7cd87e12d75', { timeout: 5000 });
    
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
  } catch (e) {
    console.log("JustDial error:", e.message);
  }
  
  await browser.close();
}

run().catch(console.error);
