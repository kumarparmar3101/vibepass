import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('paytm.html', 'utf8');
const $ = cheerio.load(html);

console.log($('title').text());

const classes = new Set();
$('*').each((i, el) => {
  const cls = $(el).attr('class');
  if (cls) {
    cls.split(' ').forEach(c => classes.add(c));
  }
});

console.log($('body').text().substring(0, 1000));
