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

  // Validate URL format (must start with http:// or https://)
  const urlRegex = /^https?:\/\//;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    const parsedUrl = new URL(originalUrl);
    
    // Use dns.lookup to verify the hostname
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Check if URL already exists to avoid duplicates (optional but good)
      let shortUrl;
      const existingKey = Object.keys(urlMap).find(key => urlMap[key] === originalUrl);
      
      if (existingKey) {
        shortUrl = parseInt(existingKey);
      } else {
        shortUrl = counter++;
        urlMap[shortUrl] = originalUrl;
      }

      res.json({ original_url: originalUrl, short_url: shortUrl });
    });
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlMap[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
