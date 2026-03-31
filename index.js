require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory URL store
const urlDatabase = [];
let urlCounter = 1;

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST /api/shorturl - create a short URL
app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  // Validate URL format: must start with http:// or https://
  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Verify the hostname resolves via DNS
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists in database
    const existing = urlDatabase.find((entry) => entry.original_url === originalUrl);
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url
      });
    }

    // Store new URL
    const shortUrl = urlCounter++;
    urlDatabase.push({ original_url: originalUrl, short_url: shortUrl });

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// GET /api/shorturl/:short_url - redirect to original URL
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = parseInt(req.params.short_url);

  const entry = urlDatabase.find((e) => e.short_url === shortUrl);
  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(entry.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
