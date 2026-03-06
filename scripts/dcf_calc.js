#!/usr/bin/env node
// DCF Valuation Calculator for watchlist stocks
// Uses real financial data from StockAnalysis.com

// All monetary values:
// NVDA: in millions USD
// PDD: in millions CNY (convert at ~7.25 CNY/USD)
// TCEHY: in millions CNY (OTC ADR, 1 ADR = 1 ordinary share)
// MPNGY: in millions CNY (OTC ADR)
// FIG: in millions USD

const CNY_USD = 7.25;

const stocks = [
  {
    name: '英伟达 (NVIDIA)',
    ticker: 'NVDA',
    currency: 'USD',
    currentPrice: 182.34,
    sharesOutDiluted: 24514, // millions
    // Financials from StockAnalysis (FY2026 ending Jan'26)
    latestFY: 'FY2026 (Jan 2026)',
    revenue: 215938,       // $215.9B
    revenueGrowthYoY: 0.6547,
    fcf: 96676,            // $96.7B
    fcfMargin: 0.4477,
    operatingCF: 102718,
    capex: 6042,
    netIncome: 120067,
    totalCash: 43243,      // approx from balance sheet
    totalDebt: 8462,
    grossMargin: 0.7107,
    operatingMargin: 0.6038,
    profitMargin: 0.5560,
    beta: 1.65,
    // Historical FCF: FY2024=27021, FY2025=60853, FY2026=96676
    historicalFCF: [27021, 60853, 96676],
    // DCF assumptions
    fcfGrowthPhase1: 0.25,  // next 5 years (slowing from 65% due to law of large numbers)
    fcfGrowthPhase2: 0.12,  // years 6-10
    terminalGrowth: 0.03,
    wacc: 0.11,            // lower beta-adjusted for mega-cap, but still tech premium
  },
  {
    name: '拼多多 (PDD Holdings)',
    ticker: 'PDD',
    currency: 'CNY->USD',
    currentPrice: 101.87,
    sharesOutDiluted: 1484, // millions (ADR = 4 ordinary shares, but sharesOut is ADR-adjusted)
    latestFY: 'FY2024 (Dec 2024)',
    revenue: 393836,       // CNY
    revenueGrowthYoY: 0.5904,
    fcf: 120962,           // CNY
    fcfMargin: 0.3071,
    operatingCF: 121929,
    capex: 967,
    netIncome: 112435,
    totalCash: 291600,     // large cash pile
    totalDebt: 0,          // essentially debt-free
    grossMargin: 0.6092,
    operatingMargin: 0.2753,
    profitMargin: 0.2855,
    beta: 0.95,
    historicalFCF: [93579, 120962], // FY2023, FY2024 in CNY
    // TTM showing slowdown: revenue growth TTM 12.5% vs FY2024 59%
    fcfGrowthPhase1: 0.15,  // growth clearly decelerating
    fcfGrowthPhase2: 0.08,
    terminalGrowth: 0.03,
    wacc: 0.12,            // China risk premium
  },
  {
    name: '腾讯 (Tencent)',
    ticker: 'TCEHY / 0700.HK',
    currency: 'CNY->USD',
    currentPrice: 65.15,   // TCEHY ADR price
    sharesOutDiluted: 9269, // millions ordinary shares; 1 ADR ≈ 1 share
    latestFY: 'FY2024 (Dec 2024)',
    revenue: 660257,       // CNY millions
    revenueGrowthYoY: 0.0841,
    fcf: 195594,           // CNY millions
    fcfMargin: 0.2962,
    operatingCF: 258521,
    capex: 62927,
    netIncome: 194073,
    totalCash: 194400,
    totalDebt: 248000,
    grossMargin: 0.5290,
    operatingMargin: 0.3150,
    profitMargin: 0.2939,
    beta: 0.75,
    historicalFCF: [200954, 195594], // FY2023, FY2024 CNY
    fcfGrowthPhase1: 0.12,
    fcfGrowthPhase2: 0.08,
    terminalGrowth: 0.03,
    wacc: 0.11,
  },
  {
    name: '美团 (Meituan)',
    ticker: 'MPNGY / 3690.HK',
    currency: 'CNY->USD',
    currentPrice: 19.23,   // MPNGY ADR price
    sharesOutDiluted: 6226, // millions; 1 ADR ≈ 0.5 share (check ratio)
    adrRatio: 2,           // 2 ordinary shares = 1 ADR (unsponsored)
    latestFY: 'FY2024 (Dec 2024) / TTM Sep 2025',
    revenue: 337592,
    revenueGrowthYoY: 0.2199,
    fcf: 25000,            // Normalized: avg of FY2024 (46B) and TTM (4.4B) ≈ 25B CNY; reflect investment cycle
    fcfMargin: 0.074,
    operatingCF: 57147,
    capex: 10999,
    netIncome: 35807,
    totalCash: 138000,
    totalDebt: 51000,
    grossMargin: 0.3844,
    operatingMargin: 0.0982,
    profitMargin: 0.1061,
    beta: 0.80,
    historicalFCF: [33642, 46147, 4390], // FY2023, FY2024, TTM CNY
    // TTM FCF collapsed to 4390 (heavy investment / subsidy war)
    fcfGrowthPhase1: 0.18,   // recovery + growth as competition normalizes
    fcfGrowthPhase2: 0.10,
    terminalGrowth: 0.03,
    wacc: 0.12,
  },
  {
    name: 'Figma',
    ticker: 'FIG',
    currency: 'USD',
    currentPrice: 28.99,
    sharesOutDiluted: 337,  // millions
    latestFY: 'FY2025 (Dec 2025)',
    revenue: 1056,          // $1.056B
    revenueGrowthYoY: 0.4096,
    fcf: 246.24,            // just turned FCF positive
    fcfMargin: 0.2332,
    operatingCF: 250.68,
    capex: 4.44,
    netIncome: -1250,       // still deeply unprofitable (SBC heavy)
    totalCash: 1500,        // approx
    totalDebt: 0,
    grossMargin: 0.8243,
    operatingMargin: -1.2223,  // negative due to massive SBC
    profitMargin: -1.1844,
    beta: 1.80,             // high-growth, newly public
    historicalFCF: [-63.69, 246.24],
    // High-growth SaaS, but SBC makes GAAP profitability distant
    fcfGrowthPhase1: 0.35,  // rapid SaaS growth
    fcfGrowthPhase2: 0.20,
    terminalGrowth: 0.03,
    wacc: 0.13,             // higher risk for unprofitable company
  }
];

function dcf(stock) {
  const { fcf, fcfGrowthPhase1, fcfGrowthPhase2, terminalGrowth, wacc } = stock;
  
  // Convert FCF to USD if needed
  let baseFCF = fcf;
  const isCNY = stock.currency.includes('CNY');
  if (isCNY) baseFCF = fcf / CNY_USD;
  
  const projectedFCF = [];
  let currentFCF = baseFCF;
  
  // Phase 1: Years 1-5
  for (let i = 0; i < 5; i++) {
    currentFCF *= (1 + fcfGrowthPhase1);
    projectedFCF.push(currentFCF);
  }
  
  // Phase 2: Years 6-10
  for (let i = 0; i < 5; i++) {
    currentFCF *= (1 + fcfGrowthPhase2);
    projectedFCF.push(currentFCF);
  }
  
  // Discount projected FCFs
  let pvFCF = 0;
  for (let i = 0; i < projectedFCF.length; i++) {
    pvFCF += projectedFCF[i] / Math.pow(1 + wacc, i + 1);
  }
  
  // Terminal value (Gordon Growth Model)
  const terminalFCF = projectedFCF[projectedFCF.length - 1] * (1 + terminalGrowth);
  const terminalValue = terminalFCF / (wacc - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, 10);
  
  // Enterprise Value
  const ev = pvFCF + pvTerminal;
  
  // Equity Value
  let cash = stock.totalCash || 0;
  let debt = stock.totalDebt || 0;
  if (isCNY) { cash /= CNY_USD; debt /= CNY_USD; }
  const equityValue = ev + cash - debt;
  
  // Per share
  let shares = stock.sharesOutDiluted;
  // For Meituan ADR ratio adjustment
  const adrRatio = stock.adrRatio || 1;
  const fairValuePerShare = equityValue / shares;
  const fairValueADR = fairValuePerShare * adrRatio;
  
  const currentPrice = stock.currentPrice;
  const upside = ((adrRatio > 1 ? fairValueADR : fairValuePerShare) / currentPrice - 1) * 100;
  const safetyMargin = upside > 0 ? upside : 0;
  
  let verdict;
  if (upside > 30) verdict = '🟢 显著低估 — 建议买入/加仓';
  else if (upside > 15) verdict = '🟡 适度低估 — 建议持有/择机加仓';
  else if (upside > -10) verdict = '🟠 合理估值 — 建议持有';
  else if (upside > -25) verdict = '🔴 适度高估 — 建议减仓/观望';
  else verdict = '⛔ 显著高估 — 建议卖出/回避';
  
  return {
    name: stock.name,
    ticker: stock.ticker,
    currentPrice,
    latestFY: stock.latestFY,
    baseFCF_USD: Math.round(baseFCF),
    fcfGrowthPhase1: (fcfGrowthPhase1 * 100).toFixed(0) + '%',
    fcfGrowthPhase2: (fcfGrowthPhase2 * 100).toFixed(0) + '%',
    terminalGrowth: (terminalGrowth * 100).toFixed(0) + '%',
    wacc: (wacc * 100).toFixed(1) + '%',
    pvFCF: Math.round(pvFCF),
    pvTerminal: Math.round(pvTerminal),
    enterpriseValue: Math.round(ev),
    cashMinusDebt: Math.round(cash - debt),
    equityValue: Math.round(equityValue),
    sharesOut: shares,
    fairValuePerShare: +fairValuePerShare.toFixed(2),
    ...(adrRatio > 1 ? { fairValueADR: +fairValueADR.toFixed(2), adrRatio } : {}),
    upside: +upside.toFixed(1) + '%',
    safetyMargin: +safetyMargin.toFixed(1) + '%',
    verdict,
    keyMetrics: {
      revenueGrowth: (stock.revenueGrowthYoY * 100).toFixed(1) + '%',
      grossMargin: (stock.grossMargin * 100).toFixed(1) + '%',
      operatingMargin: (stock.operatingMargin * 100).toFixed(1) + '%',
      fcfMargin: (stock.fcfMargin * 100).toFixed(1) + '%',
      profitMargin: (stock.profitMargin * 100).toFixed(1) + '%',
    },
    projectedFCF_5yr: projectedFCF.slice(0, 5).map(v => Math.round(v)),
  };
}

// Run
const results = stocks.map(s => dcf(s));
console.log(JSON.stringify(results, null, 2));
