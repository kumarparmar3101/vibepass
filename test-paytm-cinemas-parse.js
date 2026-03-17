import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('paytm-cinemas.html', 'utf8');
const $ = cheerio.load(html);

console.log($('title').text());

const results = [];
$('a[href*="/movies/bengaluru/cinema/"]').each((i, el) => {
  const name = $(el).text().trim();
  if (name) {
    results.push(name);
  }
});

// Let's look for JSON data in script tags
$('script').each((i, el) => {
  const text = $(el).html();
  if (text && text.includes('__NEXT_DATA__')) {
    console.log("Found __NEXT_DATA__");
  }
});

const urls = html.match(/https:\/\/[^"]*api[^"]*/g);
if (urls) {
  const uniqueUrls = Array.from(new Set(urls));
  console.log(uniqueUrls.slice(0, 10));
}
