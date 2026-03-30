require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const dns = require('dns');

app.use(express.urlencoded({ extended: true }));

const urlMap = {};
let counter = 1;

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  console.log(`[POST] Received URL: ${originalUrl}`);

  // Validate URL format (must start with http:// or https://)
  const urlRegex = /^https?:\/\//;
  if (!originalUrl || !urlRegex.test(originalUrl)) {
    console.log(`[POST] Invalid URL format for: ${originalUrl}`);
    return res.json({ error: 'invalid url' });
  }

  try {
    const parsedUrl = new URL(originalUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
  } catch (err) {
    console.log(`[POST] URL parsing failed for: ${originalUrl}`);
    return res.json({ error: 'invalid url' });
  }

  // Check if URL already exists to avoid duplicates
  let shortUrl;
  const existingKey = Object.keys(urlMap).find(key => urlMap[key] === originalUrl);
  
  if (existingKey) {
    shortUrl = parseInt(existingKey, 10);
  } else {
    shortUrl = counter++;
    urlMap[shortUrl] = originalUrl;
  }

  console.log(`[POST] Returning short_url: ${shortUrl} for ${originalUrl}`);
  res.json({ original_url: originalUrl, short_url: shortUrl });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlMap[shortUrl];

  console.log(`[GET] Requested short_url: ${shortUrl}, Found: ${originalUrl}`);

  if (originalUrl) {
    res.redirect(301, originalUrl);
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
