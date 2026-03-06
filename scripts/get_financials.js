#!/usr/bin/env node
// Fetch key financial stats from Yahoo Finance (no API key needed)
// Usage: node get_financials.js NVDA PDD TCEHY MPNGY FIG

const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function getFinancials(symbol) {
  const result = { symbol, error: null };
  
  try {
    // Yahoo Finance quoteSummary - try multiple modules
    const modules = 'financialData,defaultKeyStatistics,incomeStatementHistory,cashflowStatementHistory,balanceSheetHistory,earningsTrend';
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
    const res = await fetch(url);
    
    if (res.status === 200) {
      const json = JSON.parse(res.data);
      const r = json.quoteSummary?.result?.[0];
      if (!r) { result.error = 'No data'; return result; }
      
      const fd = r.financialData || {};
      const ks = r.defaultKeyStatistics || {};
      
      result.financialData = {
        currentPrice: fd.currentPrice?.raw,
        revenue: fd.totalRevenue?.raw,
        revenueFormatted: fd.totalRevenue?.fmt,
        revenueGrowth: fd.revenueGrowth?.raw,
        grossMargin: fd.grossMargins?.raw,
        operatingMargin: fd.operatingMargins?.raw,
        profitMargin: fd.profitMargins?.raw,
        freeCashflow: fd.freeCashflow?.raw,
        freeCashflowFormatted: fd.freeCashflow?.fmt,
        operatingCashflow: fd.operatingCashflow?.raw,
        operatingCashflowFormatted: fd.operatingCashflow?.fmt,
        totalDebt: fd.totalDebt?.raw,
        totalCash: fd.totalCash?.raw,
        ebitda: fd.ebitda?.raw,
        ebitdaFormatted: fd.ebitda?.fmt,
      };
      
      result.keyStats = {
        marketCap: ks.marketCap?.raw,
        marketCapFormatted: ks.marketCap?.fmt,
        enterpriseValue: ks.enterpriseValue?.raw,
        enterpriseValueFormatted: ks.enterpriseValue?.fmt,
        trailingPE: ks.trailingPE?.raw,
        forwardPE: ks.forwardPE?.raw,
        pegRatio: ks.pegRatio?.raw,
        priceToBook: ks.priceToBook?.raw,
        beta: ks.beta?.raw,
        sharesOutstanding: ks.sharesOutstanding?.raw,
        sharesOutstandingFormatted: ks.sharesOutstanding?.fmt,
      };
      
      // Extract historical income statements
      const incHist = r.incomeStatementHistory?.incomeStatementHistory || [];
      result.incomeHistory = incHist.map(s => ({
        date: s.endDate?.fmt,
        revenue: s.totalRevenue?.raw,
        revenueF: s.totalRevenue?.fmt,
        netIncome: s.netIncome?.raw,
        netIncomeF: s.netIncome?.fmt,
      }));
      
      // Extract historical cash flow statements
      const cfHist = r.cashflowStatementHistory?.cashflowStatements || [];
      result.cashflowHistory = cfHist.map(s => ({
        date: s.endDate?.fmt,
        operatingCF: s.totalCashFromOperatingActivities?.raw,
        operatingCFF: s.totalCashFromOperatingActivities?.fmt,
        capex: s.capitalExpenditures?.raw,
        capexF: s.capitalExpenditures?.fmt,
        fcf: s.totalCashFromOperatingActivities?.raw && s.capitalExpenditures?.raw
          ? s.totalCashFromOperatingActivities.raw + s.capitalExpenditures.raw  // capex is negative
          : null,
      }));

      // Earnings trend (analyst estimates)
      const et = r.earningsTrend?.trend || [];
      result.earningsTrend = et.map(t => ({
        period: t.period,
        endDate: t.endDate,
        revenueEstimate: t.revenueEstimate?.avg?.raw,
        revenueEstimateF: t.revenueEstimate?.avg?.fmt,
        earningsEstimate: t.earningsEstimate?.avg?.raw,
        revenueGrowth: t.revenueEstimate?.growth?.raw,
      }));
      
    } else {
      result.error = `HTTP ${res.status}`;
    }
  } catch (e) {
    result.error = e.message;
  }
  
  return result;
}

async function main() {
  const symbols = process.argv.slice(2);
  if (symbols.length === 0) {
    console.error('Usage: node get_financials.js NVDA PDD');
    process.exit(1);
  }
  const results = await Promise.all(symbols.map(s => getFinancials(s)));
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
