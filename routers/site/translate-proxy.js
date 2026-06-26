// routes/translate-proxy.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------
// 1. In-memory cache (fast)
// ------------------------------------------------------------------
const cache = new Map();

// Optional: load cache from disk once on startup
const CACHE_FILE = path.join(__dirname, '..', 'translation-cache.json');
try {
  if (fs.existsSync(CACHE_FILE)) {
    const disk = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (disk && typeof disk === 'object') {
      Object.entries(disk).forEach(([k, v]) => cache.set(k, v));
    }
  }
} catch (e) {
  console.warn('Could not load translation cache, starting fresh:', e.message);
}

// ------------------------------------------------------------------
// 2. Async, debounced disk save (never blocks requests)
// ------------------------------------------------------------------
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return; // already scheduled
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const obj = Object.fromEntries(cache);
    fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8', (err) => {
      if (err) console.error('Failed to save translation cache:', err.message);
    });
  }, 30000); // at most once every 30 seconds
}

// ------------------------------------------------------------------
// 3. Translate a single string (non-blocking, fault-tolerant)
// ------------------------------------------------------------------
async function translateSingle(text, from, to) {
  const key = `${from}|${to}|${text}`;
  if (cache.has(key)) return cache.get(key);

  try {
    // ✅ FIXED
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const translated = data[0]?.map(part => part[0]).join('') || text;

    cache.set(key, translated);
    scheduleSave(); // background save, non-blocking

    return translated;
  } catch (err) {
    console.warn(`Translation failed for "${text.slice(0, 60)}":`, err.message);
    return text; // graceful fallback: return original text
  }
}

// ------------------------------------------------------------------
// 4. POST handler
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { texts, from = 'auto', to } = req.body;

    if (!to || !texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Missing "to" or "texts" array' });
    }

    const translations = [];
    for (const text of texts) {
      if (typeof text !== 'string' || !text.trim()) {
        translations.push(text);
        continue;
      }
      translations.push(await translateSingle(text.trim(), from, to));
    }

    res.json({ translations });
  } catch (err) {
    console.error('Translation proxy error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;