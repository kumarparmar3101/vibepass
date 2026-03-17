import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://ticketnew.com/movies/bengaluru';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Length:", text.length);
    const fs = require('fs');
    fs.writeFileSync('ticketnew.html', text);
  } catch (e) {
    console.error(e.message);
  }
}

run();
