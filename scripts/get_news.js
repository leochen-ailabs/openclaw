#!/usr/bin/env node
// Fetch financial news from multiple free RSS/API sources (no API key needed)
// Usage: node get_news.js PDD AAPL TSLA

const https = require('https');
const http = require('http');

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': '*/*',
        ...opts.headers
      },
      timeout: 15000,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, opts).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Simple XML tag extractor (no dependency needed)
function extractTags(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches = [];
  let m;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
  }
  return matches;
}

function parseRSS(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || 
                     xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of itemBlocks.slice(0, 10)) {
    const title = extractTags(block, 'title')[0] || '';
    const link = extractTags(block, 'link')[0] || '';
    const pubDate = extractTags(block, 'pubDate')[0] || extractTags(block, 'published')[0] || extractTags(block, 'updated')[0] || '';
    const desc = extractTags(block, 'description')[0] || extractTags(block, 'summary')[0] || '';
    // strip HTML from desc
    const cleanDesc = desc.replace(/<[^>]+>/g, '').substring(0, 200);
    items.push({ title, link, pubDate, description: cleanDesc });
  }
  return items;
}

// Source 1: Google News RSS
async function googleNewsRSS(query) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url);
    if (res.status === 200) {
      return parseRSS(res.data).map(item => ({ ...item, source: 'google_news' }));
    }
  } catch (e) {}
  return [];
}

// Source 2: Yahoo Finance RSS
async function yahooNewsRSS(symbol) {
  try {
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
    const res = await fetch(url);
    if (res.status === 200) {
      return parseRSS(res.data).map(item => ({ ...item, source: 'yahoo_finance' }));
    }
  } catch (e) {}
  return [];
}

// Source 3: Seeking Alpha RSS
async function seekingAlphaRSS(symbol) {
  try {
    const url = `https://seekingalpha.com/api/sa/combined/${symbol}.xml`;
    const res = await fetch(url);
    if (res.status === 200) {
      return parseRSS(res.data).map(item => ({ ...item, source: 'seeking_alpha' }));
    }
  } catch (e) {}
  return [];
}

// Source 4: CNBC RSS (general market)
async function cnbcMarketRSS() {
  try {
    const url = 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147';
    const res = await fetch(url);
    if (res.status === 200) {
      return parseRSS(res.data).map(item => ({ ...item, source: 'cnbc_market' }));
    }
  } catch (e) {}
  return [];
}

// Source 5: MarketWatch RSS
async function marketWatchRSS() {
  try {
    const url = 'https://feeds.marketwatch.com/marketwatch/topstories/';
    const res = await fetch(url);
    if (res.status === 200) {
      return parseRSS(res.data).map(item => ({ ...item, source: 'marketwatch' }));
    }
  } catch (e) {}
  return [];
}

// Simple sentiment scoring: count positive/negative keywords
function scoreSentiment(text) {
  const lower = text.toLowerCase();
  const positive = ['surge', 'soar', 'jump', 'gain', 'rise', 'bull', 'record', 'profit', 'beat', 'strong',
    'upgrade', 'buy', 'outperform', 'growth', 'boom', 'optimis', 'rally', 'up ', 'high', 'positive',
    '涨', '利好', '增长', '突破', '上涨', '超预期', '盈利', '乐观', '反弹', '新高'];
  const negative = ['crash', 'plunge', 'drop', 'fall', 'bear', 'loss', 'miss', 'weak', 'cut', 'downgrade',
    'sell', 'underperform', 'decline', 'slump', 'pessimis', 'down ', 'low', 'risk', 'warn', 'fear',
    '跌', '利空', '下跌', '亏损', '风险', '减持', '暴跌', '担忧', '下调', '低迷'];
  
  let pos = 0, neg = 0;
  for (const w of positive) { if (lower.includes(w)) pos++; }
  for (const w of negative) { if (lower.includes(w)) neg++; }
  
  const total = pos + neg;
  if (total === 0) return { score: 50, label: 'neutral' };
  const score = Math.round((pos / total) * 100);
  const label = score >= 65 ? 'bullish' : score <= 35 ? 'bearish' : 'neutral';
  return { score, label, positive: pos, negative: neg };
}

async function getNews(symbol) {
  // Fetch from multiple sources in parallel
  const [google, yahoo, sa] = await Promise.all([
    googleNewsRSS(symbol),
    yahooNewsRSS(symbol),
    seekingAlphaRSS(symbol),
  ]);
  
  let allNews = [...google, ...yahoo, ...sa];
  
  // Deduplicate by title similarity
  const seen = new Set();
  allNews = allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by date (newest first)
  allNews.sort((a, b) => {
    const da = new Date(a.pubDate || 0);
    const db = new Date(b.pubDate || 0);
    return db - da;
  });
  
  // Take top 8
  allNews = allNews.slice(0, 8);
  
  // Calculate overall sentiment from all headlines
  const allText = allNews.map(n => n.title + ' ' + n.description).join(' ');
  const sentiment = scoreSentiment(allText);
  
  return { symbol, newsCount: allNews.length, sentiment, news: allNews };
}

async function getMarketOverview() {
  const [cnbc, mw] = await Promise.all([
    cnbcMarketRSS(),
    marketWatchRSS(),
  ]);
  let allNews = [...cnbc, ...mw];
  const seen = new Set();
  allNews = allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  allNews.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  allNews = allNews.slice(0, 6);
  const allText = allNews.map(n => n.title + ' ' + n.description).join(' ');
  const sentiment = scoreSentiment(allText);
  return { category: 'market_overview', sentiment, news: allNews };
}

async function main() {
  const symbols = process.argv.slice(2);
  if (symbols.length === 0) {
    console.error('Usage: node get_news.js PDD AAPL TSLA');
    process.exit(1);
  }
  
  // Fetch market overview + per-symbol news in parallel
  const [market, ...symbolResults] = await Promise.all([
    getMarketOverview(),
    ...symbols.map(s => getNews(s.toUpperCase()))
  ]);
  
  console.log(JSON.stringify({ market, stocks: symbolResults }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
