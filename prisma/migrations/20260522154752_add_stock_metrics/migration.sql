-- CreateTable
CREATE TABLE "StockMetric" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'finnhub',
    "revenueGrowthTTMYoy" DECIMAL(65,30),
    "epsGrowthTTMYoy" DECIMAL(65,30),
    "revenueGrowthQuarterlyYoy" DECIMAL(65,30),
    "epsGrowthQuarterlyYoy" DECIMAL(65,30),
    "revenueGrowth3Y" DECIMAL(65,30),
    "epsGrowth3Y" DECIMAL(65,30),
    "grossMarginTTM" DECIMAL(65,30),
    "operatingMarginTTM" DECIMAL(65,30),
    "netProfitMarginTTM" DECIMAL(65,30),
    "roeTTM" DECIMAL(65,30),
    "roaTTM" DECIMAL(65,30),
    "totalDebtToEquityAnnual" DECIMAL(65,30),
    "currentRatioAnnual" DECIMAL(65,30),
    "quickRatioAnnual" DECIMAL(65,30),
    "netInterestCoverageAnnual" DECIMAL(65,30),
    "peBasicExclExtraTTM" DECIMAL(65,30),
    "forwardPE" DECIMAL(65,30),
    "pegTTM" DECIMAL(65,30),
    "forwardPEG" DECIMAL(65,30),
    "psTTM" DECIMAL(65,30),
    "pbAnnual" DECIMAL(65,30),
    "evEbitdaTTM" DECIMAL(65,30),
    "epsTTM" DECIMAL(65,30),
    "beta" DECIMAL(65,30),
    "marketCapitalization" DECIMAL(65,30),
    "week52High" DECIMAL(65,30),
    "week52Low" DECIMAL(65,30),
    "dividendYieldIndicatedAnnual" DECIMAL(65,30),
    "rawMetricCount" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockMetric_stockId_key" ON "StockMetric"("stockId");

-- AddForeignKey
ALTER TABLE "StockMetric" ADD CONSTRAINT "StockMetric_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
