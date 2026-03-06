#!/usr/bin/env node
// Fetch stock quotes from multiple free sources (no API key needed)
// Usage: node get_quote.js AAPL PDD TSLA

const https = require('https');
const http = require('http');

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json,text/html',
        ...opts.headers
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Source 1: Google Finance page scraping
async function googleFinance(symbol) {
  try {
    const url = `https://www.google.com/finance/quote/${symbol}:NASDAQ`;
    const res = await fetch(url);
    if (res.status !== 200) {
      // try NYSE
      const res2 = await fetch(`https://www.google.com/finance/quote/${symbol}:NYSE`);
      if (res2.status === 200) res.data = res2.data;
    }
    const html = res.data;
    
    // Extract price from data attributes or known patterns
    const priceMatch = html.match(/data-last-price="([^"]+)"/);
    const changeMatch = html.match(/data-last-normal-market-change="([^"]+)"/);
    const pctMatch = html.match(/data-last-normal-market-change-percent="([^"]+)"/);
    const nameMatch = html.match(/<div[^>]*class="[^"]*zzDege[^"]*"[^>]*>([^<]+)</);
    
    if (priceMatch) {
      return {
        source: 'google',
        symbol,
        price: parseFloat(priceMatch[1]),
        change: changeMatch ? parseFloat(changeMatch[1]) : null,
        changePercent: pctMatch ? parseFloat(pctMatch[1]) : null,
        name: nameMatch ? nameMatch[1].trim() : symbol,
      };
    }
  } catch (e) {}
  return null;
}

// Source 2: Yahoo Finance v8 API (chart endpoint, sometimes works)
async function yahooChart(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
    const res = await fetch(url);
    if (res.status === 200) {
      const json = JSON.parse(res.data);
      const result = json.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        return {
          source: 'yahoo',
          symbol: meta.symbol,
          price: meta.regularMarketPrice,
          previousClose: meta.previousClose,
          change: +(meta.regularMarketPrice - meta.previousClose).toFixed(2),
          changePercent: +(((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2),
          name: meta.shortName || meta.symbol,
          currency: meta.currency,
          exchange: meta.exchangeName,
          marketTime: new Date(meta.regularMarketTime * 1000).toISOString(),
        };
      }
    }
  } catch (e) {}
  return null;
}

// Source 3: cnbc quick quote (fallback)
async function cnbcQuote(symbol) {
  try {
    const url = `https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=${symbol}&requestMethod=itv&no498s=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`;
    const res = await fetch(url);
    if (res.status === 200) {
      const json = JSON.parse(res.data);
      const q = json?.FormattedQuoteResult?.FormattedQuote?.[0];
      if (q) {
        return {
          source: 'cnbc',
          symbol: q.symbol,
          price: parseFloat(q.last),
          change: parseFloat(q.change),
          changePercent: parseFloat(q.change_pct),
          name: q.shortName || q.name,
          volume: parseInt(q.volume?.replace(/,/g, '')) || null,
        };
      }
    }
  } catch (e) {}
  return null;
}

async function getQuote(symbol) {
  // Try sources in order
  let result = await yahooChart(symbol);
  if (result) return result;
  
  result = await cnbcQuote(symbol);
  if (result) return result;
  
  result = await googleFinance(symbol);
  if (result) return result;
  
  return { symbol, error: 'All sources failed' };
}

async function main() {
  const symbols = process.argv.slice(2);
  if (symbols.length === 0) {
    console.error('Usage: node get_quote.js AAPL PDD TSLA');
    process.exit(1);
  }
  
  const results = await Promise.all(symbols.map(s => getQuote(s.toUpperCase())));
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
