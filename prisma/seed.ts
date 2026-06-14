import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── User ────────────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "orann1@gmail.com" },
    update: {},
    create: {
      email: "orann1@gmail.com",
      name: "John Doe",
      initials: "JD",
      plan: "PRO",
    },
  });
  console.log("Seeded user:", user.email);

  // ── Market Stats ─────────────────────────────────────────────────────────────
  const marketStats = [
    { label: "S&P 500", value: "5,432.12", change: "+1.24%", up: true, sortOrder: 0 },
    { label: "NASDAQ", value: "17,892.45", change: "+1.87%", up: true, sortOrder: 1 },
    { label: "DOW", value: "39,127.80", change: "-0.03%", up: false, sortOrder: 2 },
    { label: "VIX", value: "14.23", change: "-6.22%", up: false, sortOrder: 3 },
  ];
  for (const stat of marketStats) {
    await prisma.marketStat.upsert({
      where: { label: stat.label },
      update: stat,
      create: stat,
    });
  }
  console.log("Seeded market stats");

  // ── Summary Cards ────────────────────────────────────────────────────────────
  await prisma.dashboardSummaryCard.deleteMany();
  await prisma.dashboardSummaryCard.createMany({
    data: [
      { label: "Hot Stocks Today", value: 24, icon: "Flame", color: "orange", sortOrder: 0 },
      { label: "Top Opportunities", value: 18, icon: "Target", color: "emerald", sortOrder: 1 },
      { label: "Active Alerts", value: 7, icon: "Bell", color: "amber", sortOrder: 2 },
    ],
  });
  console.log("Seeded summary cards");

  // ── Stocks, Quotes, Scores, Drawer Details ──────────────────────────────────
  const stockSeedData = [
    {
      stock: {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        sector: "Technology",
        marketCap: "$2.27T",
      },
      quote: {
        price: 924.32,
        changePercent: 8.42,
        weekChange: 12.1,
        monthChange: 24.3,
        volume: "48.2M",
        relativeVolume: 2.4,
        analystTarget: 1050,
        analystUpside: 13.6,
        analystRating: "Strong Buy",
        updatedLabel: "Updated 2 min ago",
      },
      score: {
        hotScore: 94,
        hotScoreChange: 6,
        opportunityScore: 78,
        opportunityChange: 2,
        riskLevel: "MEDIUM" as const,
        setupStatus: "Pullback Watch",
        catalyst: "AI demand surge",
        signalLabel: "Strong but Extended",
      },
      drawer: {
        suggestedAction: "Wait for pullback",
        fomoRisk: "Medium — extended from entry",
        entryContext: "Above ideal entry zone",
        signalQuality: "Strong but Extended",
        lastUpdatedMinutes: 2,
        aiSentiment: "bullish",
        aiWhatHappening:
          "NVIDIA's data center revenue continues to exceed expectations, driven by massive AI infrastructure demand from hyperscalers.",
        aiWhatItMeans:
          "Strong momentum, but price is above the ideal entry zone. Confirmation from a pullback would improve risk/reward significantly.",
        aiWhatToWatch:
          "Look for a pullback toward $880–$920 support zone or confirmation of institutional buying on above-average volume.",
        aiGeneratedMinutes: 10,
        entryZoneLow: 880,
        entryZoneHigh: 920,
        target: 1050,
        distanceToTarget: "+13.6%",
        catalystType: "AI demand surge",
        catalystExplanation:
          "Data center revenue and chip demand remain exceptionally strong. Hyperscaler capex expanding significantly.",
        catalystConfidence: "High",
        catalystSource: "Latest market update",
        catalystHoursAgo: 2,
        hotDelta: 6,
        oppDelta: 2,
        hotScoreExplain: "Driven by AI chip demand and strong volume confirmation",
        oppScoreExplain: "Solid upside potential but entry is stretched",
        hotMomentum: 92,
        hotVolumeHeat: 88,
        hotCatalyst: 95,
        hotTechnicals: 80,
        oppAnalystUpside: 74,
        oppFundamentals: 90,
        oppValuation: 65,
        oppEntryQuality: 55,
        watchSince: "Mar 2024",
        latestPersonalSignal: "Track closely — near upper entry zone",
        suggestedTrackingReason: null,
      },
      inWatchlist: true,
    },
    {
      stock: {
        symbol: "SMCI",
        name: "Super Micro Computer",
        sector: "Technology",
        marketCap: "$48.2B",
      },
      quote: {
        price: 812.45,
        changePercent: 10.96,
        weekChange: 18.4,
        monthChange: 32.1,
        volume: "12.1M",
        relativeVolume: 3.1,
        analystTarget: 950,
        analystUpside: 17.0,
        analystRating: "Buy",
        updatedLabel: "Updated 5 min ago",
      },
      score: {
        hotScore: 91,
        hotScoreChange: 12,
        opportunityScore: 65,
        opportunityChange: -3,
        riskLevel: "HIGH" as const,
        setupStatus: "Extended",
        catalyst: "Earnings beat",
        signalLabel: "Hot but Overextended",
      },
      drawer: {
        suggestedAction: "Needs confirmation",
        fomoRisk: "High — extended 45% in 2 weeks",
        entryContext: "Extended — wait for consolidation",
        signalQuality: "Hot but Overextended",
        lastUpdatedMinutes: 5,
        aiSentiment: "cautious",
        aiWhatHappening:
          "Super Micro Computer rallied sharply on a strong earnings beat with AI server demand driving revenue well above guidance.",
        aiWhatItMeans:
          "Momentum is very high, but the stock is technically overextended. RSI near 78 raises significant caution flags.",
        aiWhatToWatch:
          "Monitor for a pullback to $720–$760 before considering entry. Volume normalization is a key signal to watch.",
        aiGeneratedMinutes: 25,
        entryZoneLow: 720,
        entryZoneHigh: 760,
        target: 950,
        distanceToTarget: "+17.0%",
        catalystType: "Earnings beat",
        catalystExplanation:
          "Q2 earnings exceeded estimates by 18%. AI server shipments ahead of guidance with strong forward orders.",
        catalystConfidence: "High",
        catalystSource: "Earnings release",
        catalystHoursAgo: 6,
        hotDelta: 12,
        oppDelta: -3,
        hotScoreExplain: "Volume surge on earnings beat driving momentum score",
        oppScoreExplain: "High upside but overextended technicals reduce opportunity score",
        hotMomentum: 95,
        hotVolumeHeat: 96,
        hotCatalyst: 90,
        hotTechnicals: 72,
        oppAnalystUpside: 80,
        oppFundamentals: 75,
        oppValuation: 55,
        oppEntryQuality: 40,
        watchSince: null,
        latestPersonalSignal: null,
        suggestedTrackingReason:
          "Earnings momentum stock — watch for pullback to entry zone",
      },
      inWatchlist: false,
    },
    {
      stock: {
        symbol: "PLTR",
        name: "Palantir Technologies",
        sector: "Technology",
        marketCap: "$53.1B",
      },
      quote: {
        price: 24.87,
        changePercent: 4.23,
        weekChange: 7.2,
        monthChange: 15.8,
        volume: "62.4M",
        relativeVolume: 1.8,
        analystTarget: 28,
        analystUpside: 12.5,
        analystRating: "Hold",
        updatedLabel: "Updated 3 min ago",
      },
      score: {
        hotScore: 82,
        hotScoreChange: 9,
        opportunityScore: 71,
        opportunityChange: 5,
        riskLevel: "MEDIUM" as const,
        setupStatus: "Track",
        catalyst: "New gov contract",
        signalLabel: "Worth Watching",
      },
      drawer: {
        suggestedAction: "Track closely",
        fomoRisk: "Low — within entry zone",
        entryContext: "Near entry zone",
        signalQuality: "Worth Watching",
        lastUpdatedMinutes: 3,
        aiSentiment: "bullish",
        aiWhatHappening:
          "Palantir secured a new government AI contract expanding its federal data platform footprint significantly.",
        aiWhatItMeans:
          "The catalyst is real and recurring. Government contracts provide durable revenue visibility over multiple years.",
        aiWhatToWatch:
          "Watch for commercial segment acceleration and whether the stock holds above $23 on any pullback.",
        aiGeneratedMinutes: 18,
        entryZoneLow: 23,
        entryZoneHigh: 25,
        target: 32,
        distanceToTarget: "+12.5%",
        catalystType: "Government contract",
        catalystExplanation:
          "New multi-year federal AI data platform contract adds to recurring revenue backlog.",
        catalystConfidence: "High",
        catalystSource: "Company announcement",
        catalystHoursAgo: 4,
        hotDelta: 9,
        oppDelta: 5,
        hotScoreExplain: "Government contract catalyst boosting momentum score",
        oppScoreExplain: "Fair valuation with solid analyst upside and clean setup",
        hotMomentum: 78,
        hotVolumeHeat: 75,
        hotCatalyst: 85,
        hotTechnicals: 82,
        oppAnalystUpside: 72,
        oppFundamentals: 68,
        oppValuation: 70,
        oppEntryQuality: 78,
        watchSince: null,
        latestPersonalSignal: null,
        suggestedTrackingReason:
          "Government AI contract catalyst with clean technical setup",
      },
      inWatchlist: true,
    },
    {
      stock: {
        symbol: "TSLA",
        name: "Tesla Inc.",
        sector: "Consumer Cyclical",
        marketCap: "$570.4B",
      },
      quote: {
        price: 179.32,
        changePercent: -2.14,
        weekChange: -4.1,
        monthChange: -8.3,
        volume: "108.7M",
        relativeVolume: 1.3,
        analystTarget: 210,
        analystUpside: 17.1,
        analystRating: "Hold",
        updatedLabel: "Updated 8 min ago",
      },
      score: {
        hotScore: 74,
        hotScoreChange: -5,
        opportunityScore: 58,
        opportunityChange: -3,
        riskLevel: "HIGH" as const,
        setupStatus: "Avoid",
        catalyst: "Price cuts impact",
        signalLabel: "Weak Setup",
      },
      drawer: {
        suggestedAction: "Wait for confirmation",
        fomoRisk: "Medium — declining momentum",
        entryContext: "Below support — caution zone",
        signalQuality: "Weak Setup",
        lastUpdatedMinutes: 8,
        aiSentiment: "cautious",
        aiWhatHappening:
          "Tesla's aggressive price cutting strategy is weighing on margins and investor confidence across multiple global markets.",
        aiWhatItMeans:
          "The setup is weak. Revenue growth is slowing while competition is intensifying from Chinese EV makers.",
        aiWhatToWatch:
          "Watch Q3 delivery numbers and whether gross margins stabilize above 15%. A break above $185 would improve the setup.",
        aiGeneratedMinutes: 40,
        entryZoneLow: 165,
        entryZoneHigh: 175,
        target: 210,
        distanceToTarget: "+17.1%",
        catalystType: "Price cut impact",
        catalystExplanation:
          "Multiple global price cuts in Q2 pressured margins. Market reacted negatively to margin guidance reduction.",
        catalystConfidence: "Medium",
        catalystSource: "Earnings call",
        catalystHoursAgo: 12,
        hotDelta: -5,
        oppDelta: -3,
        hotScoreExplain: "Price cuts and margin pressure weighing on momentum score",
        oppScoreExplain:
          "Analyst upside remains but fundamentals under increasing pressure",
        hotMomentum: 45,
        hotVolumeHeat: 72,
        hotCatalyst: 60,
        hotTechnicals: 50,
        oppAnalystUpside: 65,
        oppFundamentals: 50,
        oppValuation: 52,
        oppEntryQuality: 48,
        watchSince: "Jan 2024",
        latestPersonalSignal: "Avoid for now — setup is weak",
        suggestedTrackingReason: null,
      },
      inWatchlist: true,
    },
    {
      stock: {
        symbol: "AMD",
        name: "Advanced Micro Devices",
        sector: "Technology",
        marketCap: "$256.8B",
      },
      quote: {
        price: 158.42,
        changePercent: 5.67,
        weekChange: 9.3,
        monthChange: 18.7,
        volume: "38.9M",
        relativeVolume: 2.1,
        analystTarget: 195,
        analystUpside: 23.1,
        analystRating: "Buy",
        updatedLabel: "Updated 1 min ago",
      },
      score: {
        hotScore: 88,
        hotScoreChange: 8,
        opportunityScore: 82,
        opportunityChange: 7,
        riskLevel: "MEDIUM" as const,
        setupStatus: "Near Entry",
        catalyst: "MI300X demand",
        signalLabel: "Strong Signal",
      },
      drawer: {
        suggestedAction: "Near entry zone",
        fomoRisk: "Low — consolidating near support",
        entryContext: "Near ideal entry zone",
        signalQuality: "Strong Signal",
        lastUpdatedMinutes: 1,
        aiSentiment: "bullish",
        aiWhatHappening:
          "AMD is consolidating near key support after strong MI300X AI chip demand data from major cloud customers.",
        aiWhatItMeans:
          "Best setup of the day. The stock is near an attractive entry zone with strong fundamental and technical support.",
        aiWhatToWatch:
          "Watch for continuation above $162 as confirmation of breakout. Volume should be above average on the move.",
        aiGeneratedMinutes: 45,
        entryZoneLow: 150,
        entryZoneHigh: 160,
        target: 195,
        distanceToTarget: "+23.1%",
        catalystType: "AI chip demand",
        catalystExplanation:
          "MI300X AI accelerator orders exceeding expectations. Data center customers increasing orders significantly.",
        catalystConfidence: "High",
        catalystSource: "Industry data + analyst updates",
        catalystHoursAgo: 3,
        hotDelta: 8,
        oppDelta: 7,
        hotScoreExplain: "MI300X demand catalyst with strong volume confirmation",
        oppScoreExplain:
          "Best opportunity score today — strong risk/reward at current price",
        hotMomentum: 85,
        hotVolumeHeat: 82,
        hotCatalyst: 88,
        hotTechnicals: 86,
        oppAnalystUpside: 88,
        oppFundamentals: 82,
        oppValuation: 78,
        oppEntryQuality: 84,
        watchSince: "Feb 2024",
        latestPersonalSignal: "Track closely — near ideal entry",
        suggestedTrackingReason: null,
      },
      inWatchlist: true,
    },
  ];

  // Stocks used only for top score changes (not in the main hot stocks list)
  const extraStockScores = [
    {
      symbol: "SOFI",
      name: "SoFi Technologies",
      sector: "Financial Services",
      hotScore: 82,
      hotScoreChange: 14,
      opportunityScore: 71,
      opportunityChange: 8,
      riskLevel: "MEDIUM" as const,
      setupStatus: "Track",
      catalyst: "Earnings surprise",
      signalLabel: "Earnings surprise",
    },
    {
      symbol: "KVYO",
      name: "Klaviyo Inc.",
      sector: "Technology",
      hotScore: 74,
      hotScoreChange: 9,
      opportunityScore: 68,
      opportunityChange: 5,
      riskLevel: "MEDIUM" as const,
      setupStatus: "Track",
      catalyst: "Analyst upgrade",
      signalLabel: "Analyst upgrade",
    },
    {
      symbol: "MHNI",
      name: "Manhattan Associates",
      sector: "Technology",
      hotScore: 67,
      hotScoreChange: 7,
      opportunityScore: 72,
      opportunityChange: 11,
      riskLevel: "LOW" as const,
      setupStatus: "Track",
      catalyst: "Sector rotation",
      signalLabel: "Sector rotation",
    },
  ];

  for (const item of stockSeedData) {
    const stock = await prisma.stock.upsert({
      where: { symbol: item.stock.symbol },
      update: item.stock,
      create: item.stock,
    });

    await prisma.stockQuote.upsert({
      where: { stockId: stock.id },
      update: item.quote,
      create: { stockId: stock.id, ...item.quote },
    });

    await prisma.stockScore.upsert({
      where: { stockId: stock.id },
      update: item.score,
      create: { stockId: stock.id, ...item.score },
    });

    await prisma.stockDrawerDetail.upsert({
      where: { stockId: stock.id },
      update: item.drawer,
      create: { stockId: stock.id, ...item.drawer },
    });
  }
  console.log("Seeded hot stocks with quotes, scores, and drawer details");

  // Seed extra stocks for top score changes
  for (const extra of extraStockScores) {
    const stock = await prisma.stock.upsert({
      where: { symbol: extra.symbol },
      update: { name: extra.name, sector: extra.sector },
      create: { symbol: extra.symbol, name: extra.name, sector: extra.sector },
    });
    await prisma.stockScore.upsert({
      where: { stockId: stock.id },
      update: {
        hotScore: extra.hotScore,
        hotScoreChange: extra.hotScoreChange,
        opportunityScore: extra.opportunityScore,
        opportunityChange: extra.opportunityChange,
        riskLevel: extra.riskLevel,
        setupStatus: extra.setupStatus,
        catalyst: extra.catalyst,
        signalLabel: extra.signalLabel,
      },
      create: {
        stockId: stock.id,
        hotScore: extra.hotScore,
        hotScoreChange: extra.hotScoreChange,
        opportunityScore: extra.opportunityScore,
        opportunityChange: extra.opportunityChange,
        riskLevel: extra.riskLevel,
        setupStatus: extra.setupStatus,
        catalyst: extra.catalyst,
        signalLabel: extra.signalLabel,
      },
    });
  }
  console.log("Seeded extra stocks for top score changes");

  // ── Watchlist Items ──────────────────────────────────────────────────────────
  const watchlistStocks = [
    {
      symbol: "NVDA",
      status: "WATCHING" as const,
      reason: "Pullback Watch",
      entryZoneLow: 880,
      entryZoneHigh: 920,
      target: 1050,
      stopLoss: 840,
    },
    {
      symbol: "PLTR",
      status: "READY_TO_BUY" as const,
      reason: "Super 60 setup",
      entryZoneLow: 23,
      entryZoneHigh: 25,
      target: 32,
      stopLoss: 21,
    },
    {
      symbol: "AMD",
      status: "WATCHING" as const,
      reason: "AI cycle play",
      entryZoneLow: 150,
      entryZoneHigh: 160,
      target: 195,
      stopLoss: 140,
    },
    {
      symbol: "TSLA",
      status: "WATCHING" as const,
      reason: null,
      entryZoneLow: 165,
      entryZoneHigh: 175,
      target: 210,
      stopLoss: 155,
    },
  ];

  for (const item of watchlistStocks) {
    const stock = await prisma.stock.findUnique({ where: { symbol: item.symbol } });
    if (!stock) continue;
    await prisma.watchlistItem.upsert({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
      update: {
        status: item.status,
        reason: item.reason,
        entryZoneLow: item.entryZoneLow,
        entryZoneHigh: item.entryZoneHigh,
        target: item.target,
        stopLoss: item.stopLoss,
      },
      create: {
        userId: user.id,
        stockId: stock.id,
        status: item.status,
        reason: item.reason,
        entryZoneLow: item.entryZoneLow,
        entryZoneHigh: item.entryZoneHigh,
        target: item.target,
        stopLoss: item.stopLoss,
      },
    });
  }
  console.log("Seeded watchlist items");

  // ── Discover Setups ──────────────────────────────────────────────────────────
  const setups = [
    { slug: "hot-today", name: "Hot Today", icon: "🔥", description: "Highest current activity", tickers: ["NVDA", "SMCI", "PLTR"], sortOrder: 0 },
    { slug: "strong-momentum", name: "Strong Momentum", icon: "📈", description: "Stocks with strong short-term trend", tickers: ["AMD", "META", "ANET"], sortOrder: 1 },
    { slug: "best-opportunities", name: "Best Opportunities", icon: "🎯", description: "Strong risk/reward based on scoring", tickers: ["SMCI", "SOFI", "KVYO"], sortOrder: 2 },
    { slug: "unusual-volume", name: "Unusual Volume", icon: "🌋", description: "Relative volume spikes", tickers: ["DIS", "PFE", "VO"], sortOrder: 3 },
    { slug: "breakout-candidates", name: "Breakout Candidates", icon: "🚀", description: "Technical breakout setups", tickers: ["ORCL", "PANW", "ZS"], sortOrder: 4 },
    { slug: "oversold-opportunities", name: "Oversold Opportunities", icon: "🧊", description: "Pullbacks with possible upside", tickers: ["BURL", "LULU", "DKNG"], sortOrder: 5 },
    { slug: "earnings-crash-watch", name: "Earnings Crash Watch", icon: "📉", description: "Possible overreactions after earnings", tickers: ["SMCI", "META", "COIN"], sortOrder: 6 },
    { slug: "fomo-risk", name: "FOMO Risk", icon: "⚡", description: "Possible overextension — high risk", tickers: ["SMCI", "META", "COIN"], sortOrder: 7 },
  ];
  for (const setup of setups) {
    await prisma.discoverSetup.upsert({
      where: { slug: setup.slug },
      update: setup,
      create: setup,
    });
  }
  console.log("Seeded discover setups");

  // ── AI Insights ──────────────────────────────────────────────────────────────
  await prisma.aiInsight.deleteMany();
  await prisma.aiInsight.createMany({
    data: [
      {
        symbol: "NVDA",
        sentiment: "bullish",
        title: "Strong momentum continues",
        summary:
          "NVIDIA AI chip demand remains exceptionally strong. Data center revenue beat expectations by 15%. Technical indicators suggest continued bullish momentum.",
        minutesAgo: 10,
      },
      {
        symbol: "SMCI",
        sentiment: "cautious",
        title: "Potential overextension warning",
        summary:
          "Super Micro Computer has rallied 45% in 2 weeks. RSI at 78 suggests overbought conditions. Consider waiting for a pullback before entry.",
        minutesAgo: 25,
      },
      {
        symbol: "AMD",
        sentiment: "bullish",
        title: "Best setup of the day",
        summary:
          "AMD is consolidating near key support with improving momentum. MI300X orders exceeding expectations. Good risk/reward entry point.",
        minutesAgo: 45,
      },
    ],
  });
  console.log("Seeded AI insights");

  // ── Recent Alerts ────────────────────────────────────────────────────────────
  await prisma.recentAlert.deleteMany();
  await prisma.recentAlert.createMany({
    data: [
      {
        symbol: "NVDA",
        type: "PRICE_ABOVE",
        message: "NVDA crossed above $920",
        note: "Momentum is strong, but price is now near your target zone.",
        minutesAgo: 2,
        isNew: true,
        icon: "trending-up",
      },
      {
        symbol: "SMCI",
        type: "HOT_SCORE_ABOVE",
        message: "SMCI Hot Score reached 91",
        note: "One of the highest scores today. Consider reviewing your position sizing.",
        minutesAgo: 15,
        isNew: true,
        icon: "flame",
      },
      {
        symbol: "AMD",
        type: "RELATIVE_VOLUME_ABOVE",
        message: "AMD relative volume 2.1x",
        note: "Volume picking up near support zone — worth watching.",
        minutesAgo: 34,
        isNew: false,
        icon: "trending-up",
      },
    ],
  });
  console.log("Seeded recent alerts");

  // ── Stock Universes ──────────────────────────────────────────────────────────
  const russell1000 = await prisma.stockUniverse.upsert({
    where: { slug: "russell-1000" },
    update: { isDefault: false },
    create: {
      name: "Russell 1000",
      slug: "russell-1000",
      description: "Large and mid-cap US-listed stocks — base scanning universe (demo only, not production-populated)",
      type: "BASE_UNIVERSE",
      isDefault: false,
      isSystem: true,
    },
  });

  const sp500 = await prisma.stockUniverse.upsert({
    where: { slug: "sp-500" },
    update: {},
    create: {
      name: "S&P 500",
      slug: "sp-500",
      description: "S&P 500 index members — static fallback list",
      type: "INDEX",
      isDefault: false,
      isSystem: true,
    },
  });

  const nasdaq100 = await prisma.stockUniverse.upsert({
    where: { slug: "nasdaq-100" },
    update: { isDefault: true },
    create: {
      name: "Nasdaq 100",
      slug: "nasdaq-100",
      description: "Nasdaq 100 index members — static fallback list",
      type: "INDEX",
      isDefault: true,
      isSystem: true,
    },
  });
  console.log("Seeded stock universes");

  // ── Universe Memberships ─────────────────────────────────────────────────────
  // All seeded stocks → Russell 1000 (demo only, not authoritative market data)
  // Demo index membership: NVDA, AMD, TSLA → R1000 + S&P 500 + Nasdaq 100
  //                        PLTR → R1000 + S&P 500
  //                        SMCI, SOFI, KVYO, MHNI → R1000 only

  const allSeededSymbols = ["NVDA", "SMCI", "PLTR", "TSLA", "AMD", "SOFI", "KVYO", "MHNI"];
  const sp500Symbols = new Set(["NVDA", "AMD", "TSLA", "PLTR"]);
  const nasdaq100Symbols = new Set(["NVDA", "AMD", "TSLA"]);

  for (const symbol of allSeededSymbols) {
    const stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) continue;

    // Russell 1000 — all seeded stocks
    await prisma.stockUniverseMember.upsert({
      where: { stockId_universeId: { stockId: stock.id, universeId: russell1000.id } },
      update: {},
      create: { stockId: stock.id, universeId: russell1000.id },
    });

    // S&P 500 — demo subset
    if (sp500Symbols.has(symbol)) {
      await prisma.stockUniverseMember.upsert({
        where: { stockId_universeId: { stockId: stock.id, universeId: sp500.id } },
        update: {},
        create: { stockId: stock.id, universeId: sp500.id },
      });
    }

    // Nasdaq 100 — demo subset
    if (nasdaq100Symbols.has(symbol)) {
      await prisma.stockUniverseMember.upsert({
        where: { stockId_universeId: { stockId: stock.id, universeId: nasdaq100.id } },
        update: {},
        create: { stockId: stock.id, universeId: nasdaq100.id },
      });
    }
  }
  console.log("Seeded universe memberships");

  // ── Radar AI Config ──────────────────────────────────────────────────────────
  // Idempotent: only create if no active config exists
  const existingActiveConfig = await prisma.radarAiConfig.findFirst({
    where: { isActive: true },
  });

  const DEFAULT_RADAR_PROMPT_SEED = `You are an AI research analyst for active investors. Your task is to identify research candidates worth further review based on market data signals.

## Your Mission (Phase 24B v2)
Analyze the provided DB context and identify up to 10 research candidates ranked by research priority.

Focus on:
- Interesting valuations or growth catalysts
- Significant analyst positioning or consensus changes
- Notable market positioning or technical setups
- Potential structural or thematic trends
- Stocks that may warrant further investigation

## Output Schema (v2 Format)
Return up to 10 ranked research candidates using the structured JSON tool format (schemaVersion: "2.0").

Each candidate MUST include:
- **ticker** and **companyName**: Must match exactly from provided context
- **reasonTags**: Array of discovery signals (e.g., analyst_upside, valuation_gap, momentum_shift, sector_theme, etc.)
- **researchPriority**: Integer 1–5 (5 = highest conviction, repeated signals, strong evidence; 1 = exploratory)
- **Narrative**: headline, radarBullets (3 key signals), thesis, whyNow, mainCatalyst
- **Evidence**: At least 1 source with sourceName, snippet, credibilityTier, relevanceScore
- **Scores**: 0–100 integers only (attention, confidence, hype risk, signal strength, conviction)
- **trendStatus**: new_today, repeated, back_on_radar, or cooling_down

Do NOT assign radarLens (v1 legacy field) for v2 output — leave it null.

## Critical Rules
1. **No Buy/Sell Language**: This is research discovery only. Prohibited: "buy", "sell", "strong buy", "recommendation", "guaranteed". Use instead: "research candidate", "worth reviewing", "signals suggest", "potential opportunity".
2. **Scores 0–100 Only**: All scores must be integers 0–100. Never use 0–10 scale.
3. **Evidence Quality**: Every candidate must have at least 1 evidence item grounded in the provided DB context.
4. **Hype Risk Assessment**: Evaluate and disclose manipulation risk, momentum chasing, or unsupported claims.
5. **Accuracy**: Do not invent ticker symbols, company names, or data. Only use information from the provided context.
6. **Scoring Honesty**: Calibrate confidence/conviction to match evidence quality. Lower scores if uncertain.
7. **Rejected Candidates**: Include rejected candidates with clear disqualification reasons (e.g., "no clear signal", "weak evidence").

## Discovery Signal Tags (reasonTags)
Use these to categorize signals (not mutually exclusive):
- analyst_upside, analyst_revision, valuation_gap, recent_weakness, earnings_reaction, momentum_shift
- unusual_attention, sector_theme, ai_theme, turnaround_watch, speculative_growth, high_risk
- quality_pullback, technical_setup, other

## Candidate Ranking
Rank candidates by research priority (5 = highest). Fewer high-quality candidates (5–10) are better than many weak ones.

---

Return your candidates in the specified v2 JSON tool format.`;

  if (!existingActiveConfig) {
    await prisma.radarAiConfig.create({
      data: {
        name: "Default Radar AI Config",
        isActive: true,
        promptTemplate: DEFAULT_RADAR_PROMPT_SEED,
        maxTokens: 8192,
        dbContextLimit: 20,
        candidateLimit: 10,
        model: "claude-sonnet-4-6",
        debugTraceEnabled: false,
        promptVersion: "opportunity-radar-v2",
        schemaVersion: "candidate-output-v2",
        changeNotes: "Phase 24B-2: Updated to v2 prompt (reasonTags, research priority, max 10 candidates)",
      },
    });
    console.log("Seeded default Radar AI config (Phase 24B-2 v2)");
  } else if (
    // Safe v1→v2 auto-migration: only migrate the KNOWN DEFAULT seeded config
    // Detection: matches known default name + has v1 version fields + still has distinctive v1 prompt phrases
    existingActiveConfig.name === "Default Radar AI Config" &&
    (existingActiveConfig.promptVersion === "opportunity-radar-v1" || existingActiveConfig.schemaVersion === "candidate-output-v1") &&
    existingActiveConfig.promptTemplate?.includes("four categorization lenses")
  ) {
    // This is the known default v1 config, safe to auto-migrate
    await prisma.radarAiConfig.update({
      where: { id: existingActiveConfig.id },
      data: {
        promptTemplate: DEFAULT_RADAR_PROMPT_SEED,
        promptVersion: "opportunity-radar-v2",
        schemaVersion: "candidate-output-v2",
        candidateLimit: 10,
        changeNotes: "Phase 24B-2: Auto-migrated known default v1 config to v2 (reasonTags, research priority, max 10 candidates)",
      },
    });
    console.log("Auto-migrated known default Radar AI config from v1 to v2");
  } else if (existingActiveConfig.promptVersion === "opportunity-radar-v1" || existingActiveConfig.schemaVersion === "candidate-output-v1") {
    // v1 config exists but does NOT match known default markers (likely user-customized)
    // Do not auto-overwrite; preserve user customization
    console.log(`⚠️  Radar AI config "${existingActiveConfig.name}" is v1 but does not match auto-migration safety checks. Preserving as-is. To migrate to v2, use Admin UI "Load v2 Default Prompt" button and save.`);
  } else {
    console.log("Radar AI config already exists and is v2 or later, skipping seeding");
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
