-- CreateTable
CREATE TABLE "RadarScan" (
    "id" TEXT NOT NULL,
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeWindow" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceMode" TEXT NOT NULL,
    "actualThinkingEffort" TEXT,
    "searchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totalCandidatesReturned" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "validOutputCount" INTEGER NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER,
    "tokenPrompt" INTEGER,
    "tokenCompletion" INTEGER,
    "tokenTotal" INTEGER,
    "costEstimate" DECIMAL(65,30),
    "summaryOverallMarketTheme" TEXT,
    "summaryQualityNotes" TEXT,
    "summaryLimitations" TEXT,
    "errorMessage" TEXT,
    "rejectedCandidates" JSONB,
    "agentSelfCheck" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadarScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadarCandidate" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "stockId" TEXT,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "radarLens" TEXT NOT NULL,
    "detailedCategory" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "radarBullets" TEXT[],
    "thesis" TEXT NOT NULL,
    "whyNow" TEXT NOT NULL,
    "mainCatalyst" TEXT NOT NULL,
    "whatLooksInteresting" TEXT[],
    "keyConcerns" TEXT[],
    "nextCheck" TEXT NOT NULL,
    "attentionScore" INTEGER NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "hypeRiskScore" INTEGER NOT NULL,
    "radarSignalStrength" INTEGER NOT NULL,
    "radarConvictionScore" INTEGER NOT NULL,
    "sourceQualityScore" INTEGER NOT NULL,
    "manipulationRiskScore" INTEGER NOT NULL,
    "trendStatus" TEXT NOT NULL,
    "appearancesLast7Days" INTEGER NOT NULL DEFAULT 0,
    "appearancesLast30Days" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "disqualifiedReason" TEXT,
    "sortRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadarCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadarEvidence" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "publishedAt" TIMESTAMP(3),
    "snippet" TEXT NOT NULL,
    "credibilityTier" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadarEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadarScan_scanDate_idx" ON "RadarScan"("scanDate");

-- CreateIndex
CREATE INDEX "RadarScan_status_idx" ON "RadarScan"("status");

-- CreateIndex
CREATE INDEX "RadarScan_provider_idx" ON "RadarScan"("provider");

-- CreateIndex
CREATE INDEX "RadarScan_timeWindow_idx" ON "RadarScan"("timeWindow");

-- CreateIndex
CREATE INDEX "RadarCandidate_scanId_idx" ON "RadarCandidate"("scanId");

-- CreateIndex
CREATE INDEX "RadarCandidate_ticker_idx" ON "RadarCandidate"("ticker");

-- CreateIndex
CREATE INDEX "RadarCandidate_radarLens_idx" ON "RadarCandidate"("radarLens");

-- CreateIndex
CREATE INDEX "RadarCandidate_stockId_idx" ON "RadarCandidate"("stockId");

-- CreateIndex
CREATE INDEX "RadarCandidate_trendStatus_idx" ON "RadarCandidate"("trendStatus");

-- CreateIndex
CREATE UNIQUE INDEX "RadarCandidate_scanId_ticker_key" ON "RadarCandidate"("scanId", "ticker");

-- CreateIndex
CREATE INDEX "RadarEvidence_candidateId_idx" ON "RadarEvidence"("candidateId");

-- CreateIndex
CREATE INDEX "RadarEvidence_sourceType_idx" ON "RadarEvidence"("sourceType");

-- CreateIndex
CREATE INDEX "RadarEvidence_credibilityTier_idx" ON "RadarEvidence"("credibilityTier");

-- AddForeignKey
ALTER TABLE "RadarCandidate" ADD CONSTRAINT "RadarCandidate_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "RadarScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarCandidate" ADD CONSTRAINT "RadarCandidate_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarEvidence" ADD CONSTRAINT "RadarEvidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RadarCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
