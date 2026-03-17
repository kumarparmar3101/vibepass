import axios from 'axios';

async function testYt() {
  try {
    const title = "Thaai Kizhavi";
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const match = response.data.match(/{"videoRenderer":{"videoId":"([^"]+)"/);
    if (match && match[1]) {
      console.log("Found video ID:", match[1]);
    } else {
      console.log("No match found");
    }
  } catch (e) {
    console.error(e);
  }
}
testYt();
