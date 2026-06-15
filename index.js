require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  console.log('========================\n');
  next();
});

const urlDatabase = [];

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

function getHostnameIfValidUrl(input) {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.hostname;
  } catch {
    return null;
  }
}

app.post('/api/shorturl', (req, res) => {
  const urlString = req.body.url;
  const hostname = getHostnameIfValidUrl(urlString);

  if (!hostname) return res.json({ error: 'invalid url' });

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const existing = urlDatabase.find(e => e.original_url === urlString);
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url
      });
    }

    const shortUrl = Math.floor(10000 + Math.random() * 90000);
    const created = {
      original_url: urlString,
      short_url: shortUrl
    };

    urlDatabase.push(created);

    return res.json({
      original_url: created.original_url,
      short_url: created.short_url
    });
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const shortParam = parseInt(req.params.short_url);
    console.log('++++++++++++++++++++++++++++++\n');
    console.log(shortParam);
    console.log('++++++++++++++++++++++++++++++\n');

    if (isNaN(shortParam)) {
      return res.status(400).json({ error: 'Wrong format' });
    }

    const found = urlDatabase.find(e => e.short_url === shortParam);

    if (found) {
      return res.redirect(found.original_url);
    } else {
      return res.status(404).json({ error: 'No short URL found for the given input' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'database error' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});