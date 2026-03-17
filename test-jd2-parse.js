import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('jd2.html', 'utf8');
const $ = cheerio.load(html);

console.log("Length:", html.length);
console.log(html.substring(0, 500));

const classes = new Set();
$('*').each((i, el) => {
  const cls = $(el).attr('class');
  if (cls) {
    cls.split(' ').forEach(c => classes.add(c));
  }
});

console.log(Array.from(classes).slice(0, 20));

// Let's look for JSON data in script tags
$('script').each((i, el) => {
  const text = $(el).html();
  if (text && text.includes('__NEXT_DATA__')) {
    console.log("Found __NEXT_DATA__");
  }
});
