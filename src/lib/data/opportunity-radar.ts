import { prisma } from "@/src/lib/db/prisma";

export type RadarEvidenceView = {
  id: string;
  sourceName: string;
  sourceType: string;
  url: string | null;
  title: string | null;
  publishedAt: string | null;
  snippet: string;
  credibilityTier: string;
  relevanceScore: number;
};

export type RadarCandidateSnapshot = {
  opportunityScore: number | null;
  fundamentalScore: number | null;
  analystUpsidePercent: number | null;
  analystRating: string | null;
  valuationScore: number | null;
  stabilityScore: number | null;
  peRatio: number | null;
  week52PositionPercent: number | null;
  marketCapLabel: string | null;
  priceChangePercent: number | null;
};

export type RadarCandidateView = {
  id: string;
  scanId: string;
  scanDate: string;
  ticker: string;
  companyName: string;
  radarLens: string | null;
  detailedCategory: string | null;
  headline: string;
  radarBullets: string[];
  thesis: string;
  whyNow: string;
  mainCatalyst: string;
  whatLooksInteresting: string[];
  keyConcerns: string[];
  nextCheck: string;
  attentionScore: number;
  confidenceScore: number;
  hypeRiskScore: number;
  radarSignalStrength: number;
  radarConvictionScore: number;
  sourceQualityScore: number;
  manipulationRiskScore: number;
  trendStatus: string;
  appearancesLast7Days: number;
  appearancesLast30Days: number;
  tags: string[];
  sortRank: number | null;
  evidence: RadarEvidenceView[];
  snapshot: RadarCandidateSnapshot;
};

export type RadarScanView = {
  id: string;
  scanDate: string;
  timeWindow: string;
  provider: string;
  model: string;
  sourceMode: string;
  status: string;
  totalCandidatesReturned: number;
  executionTimeMs: number | null;
};

export type OpportunityRadarPageData = {
  hasDbData: boolean;
  generatedAt: string | null;
  latestScanId: string | null;
  scans: RadarScanView[];
  candidates: RadarCandidateView[];
  sourceSummary: {
    provider: string | null;
    model: string | null;
    sourceMode: string | null;
    scanDate: string | null;
    timeWindow: string | null;
  } | null;
};

export async function getOpportunityRadarData(): Promise<OpportunityRadarPageData> {
  // Fetch successful radar scans from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dbScans = await prisma.radarScan.findMany({
    where: {
      status: "success",
      scanDate: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      candidates: {
        include: {
          evidence: {
            orderBy: { relevanceScore: "desc" },
          },
          stock: {
            include: {
              quote: true,
              score: true,
              metric: true,
              analystData: true,
            },
          },
        },
        orderBy: [{ sortRank: "asc" }, { radarConvictionScore: "desc" }],
      },
    },
    orderBy: { scanDate: "desc" },
    take: 30,
  });

  if (dbScans.length === 0) {
    return {
      hasDbData: false,
      generatedAt: null,
      latestScanId: null,
      scans: [],
      candidates: [],
      sourceSummary: null,
    };
  }

  // Prefer the latest scan that has candidates for source metadata
  // If latest scan is empty, fall back to next-most-recent scan with candidates
  const latestScanWithCandidates = dbScans.find((scan) => scan.candidates.length > 0);

  if (!latestScanWithCandidates) {
    return {
      hasDbData: false,
      generatedAt: null,
      latestScanId: null,
      scans: [],
      candidates: [],
      sourceSummary: null,
    };
  }

  const latestScan = latestScanWithCandidates;

  // Transform scans to view format
  const scansView: RadarScanView[] = dbScans.map((scan) => ({
    id: scan.id,
    scanDate: scan.scanDate.toISOString(),
    timeWindow: scan.timeWindow,
    provider: scan.provider,
    model: scan.model,
    sourceMode: scan.sourceMode,
    status: scan.status,
    totalCandidatesReturned: scan.totalCandidatesReturned,
    executionTimeMs: scan.executionTimeMs,
  }));

  // Flatten candidates from all scans with scan context
  const allCandidates: RadarCandidateView[] = [];

  for (const scan of dbScans) {
    for (const candidate of scan.candidates) {
      const stock = candidate.stock;

      // Build snapshot from linked stock data or null values
      const snapshot: RadarCandidateSnapshot = {
        opportunityScore: stock?.score?.oppScore ? Number(stock.score.oppScore) : null,
        fundamentalScore: stock?.score?.fundamentalScore ? Number(stock.score.fundamentalScore) : null,
        analystUpsidePercent: stock?.analystData?.analystUpsidePercent
          ? Number(stock.analystData.analystUpsidePercent)
          : null,
        analystRating: stock?.analystData?.analystRating ?? null,
        valuationScore: stock?.score?.valuationScore ? Number(stock.score.valuationScore) : null,
        stabilityScore: stock?.score?.riskContextScore ? Number(stock.score.riskContextScore) : null,
        peRatio: stock?.metric?.peBasicExclExtraTTM
          ? Number(stock.metric.peBasicExclExtraTTM)
          : null,
        week52PositionPercent: calculateWeek52Position(stock?.quote),
        marketCapLabel: stock?.marketCap ?? null,
        priceChangePercent: stock?.quote?.changePercent ? Number(stock.quote.changePercent) : null,
      };

      // Transform evidence
      const evidenceViews: RadarEvidenceView[] = candidate.evidence.map((ev) => ({
        id: ev.id,
        sourceName: ev.sourceName,
        sourceType: ev.sourceType,
        url: ev.url,
        title: ev.title,
        publishedAt: ev.publishedAt?.toISOString() ?? null,
        snippet: ev.snippet,
        credibilityTier: ev.credibilityTier,
        relevanceScore: ev.relevanceScore,
      }));

      allCandidates.push({
        id: candidate.id,
        scanId: scan.id,
        scanDate: scan.scanDate.toISOString(),
        ticker: candidate.ticker,
        companyName: candidate.companyName,
        radarLens: candidate.radarLens,
        detailedCategory: candidate.detailedCategory,
        headline: candidate.headline,
        radarBullets: candidate.radarBullets,
        thesis: candidate.thesis,
        whyNow: candidate.whyNow,
        mainCatalyst: candidate.mainCatalyst,
        whatLooksInteresting: candidate.whatLooksInteresting,
        keyConcerns: candidate.keyConcerns,
        nextCheck: candidate.nextCheck,
        attentionScore: candidate.attentionScore,
        confidenceScore: candidate.confidenceScore,
        hypeRiskScore: candidate.hypeRiskScore,
        radarSignalStrength: candidate.radarSignalStrength,
        radarConvictionScore: candidate.radarConvictionScore,
        sourceQualityScore: candidate.sourceQualityScore,
        manipulationRiskScore: candidate.manipulationRiskScore,
        trendStatus: candidate.trendStatus,
        appearancesLast7Days: candidate.appearancesLast7Days,
        appearancesLast30Days: candidate.appearancesLast30Days,
        tags: candidate.tags,
        sortRank: candidate.sortRank,
        evidence: evidenceViews,
        snapshot,
      });
    }
  }

  return {
    hasDbData: true,
    generatedAt: latestScan.scanDate.toISOString(),
    latestScanId: latestScan.id,
    scans: scansView,
    candidates: allCandidates,
    sourceSummary: {
      provider: latestScan.provider,
      model: latestScan.model,
      sourceMode: latestScan.sourceMode,
      scanDate: latestScan.scanDate.toISOString(),
      timeWindow: latestScan.timeWindow,
    },
  };
}

function calculateWeek52Position(quote: any): number | null {
  if (!quote || quote.week52High === null || quote.week52Low === null) {
    return null;
  }

  const high = Number(quote.week52High);
  const low = Number(quote.week52Low);
  const current = Number(quote.price);

  if (high === low || low === 0) {
    return null;
  }

  const position = ((current - low) / (high - low)) * 100;
  return Math.round(position);
}
