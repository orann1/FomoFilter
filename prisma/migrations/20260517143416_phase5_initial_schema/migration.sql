-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHING', 'WAITING', 'READY_TO_BUY', 'HOLDING', 'AVOIDING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW', 'HOT_SCORE_ABOVE', 'OPPORTUNITY_SCORE_ABOVE', 'RELATIVE_VOLUME_ABOVE');

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('ONCE', 'DAILY', 'ALWAYS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "initials" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "marketCap" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockQuote" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "changePercent" DECIMAL(65,30) NOT NULL,
    "weekChange" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthChange" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "volume" TEXT,
    "relativeVolume" DECIMAL(65,30),
    "analystTarget" DECIMAL(65,30),
    "analystUpside" DECIMAL(65,30),
    "analystRating" TEXT,
    "updatedLabel" TEXT NOT NULL DEFAULT 'Updated 2 min ago',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "hotScore" INTEGER NOT NULL,
    "hotScoreChange" INTEGER NOT NULL DEFAULT 0,
    "opportunityScore" INTEGER NOT NULL,
    "opportunityChange" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL,
    "setupStatus" TEXT NOT NULL,
    "catalyst" TEXT NOT NULL,
    "signalLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDrawerDetail" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "fomoRisk" TEXT NOT NULL,
    "entryContext" TEXT NOT NULL,
    "signalQuality" TEXT NOT NULL,
    "lastUpdatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "aiSentiment" TEXT NOT NULL,
    "aiWhatHappening" TEXT NOT NULL,
    "aiWhatItMeans" TEXT NOT NULL,
    "aiWhatToWatch" TEXT NOT NULL,
    "aiGeneratedMinutes" INTEGER NOT NULL DEFAULT 0,
    "entryZoneLow" DECIMAL(65,30),
    "entryZoneHigh" DECIMAL(65,30),
    "target" DECIMAL(65,30),
    "distanceToTarget" TEXT,
    "catalystType" TEXT,
    "catalystExplanation" TEXT,
    "catalystConfidence" TEXT,
    "catalystSource" TEXT,
    "catalystHoursAgo" INTEGER,
    "hotDelta" INTEGER NOT NULL DEFAULT 0,
    "oppDelta" INTEGER NOT NULL DEFAULT 0,
    "hotScoreExplain" TEXT,
    "oppScoreExplain" TEXT,
    "hotMomentum" INTEGER,
    "hotVolumeHeat" INTEGER,
    "hotCatalyst" INTEGER,
    "hotTechnicals" INTEGER,
    "oppAnalystUpside" INTEGER,
    "oppFundamentals" INTEGER,
    "oppValuation" INTEGER,
    "oppEntryQuality" INTEGER,
    "watchSince" TEXT,
    "latestPersonalSignal" TEXT,
    "suggestedTrackingReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockDrawerDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL DEFAULT 'WATCHING',
    "reason" TEXT,
    "entryZoneLow" DECIMAL(65,30),
    "entryZoneHigh" DECIMAL(65,30),
    "target" DECIMAL(65,30),
    "stopLoss" DECIMAL(65,30),
    "hotScoreChange" INTEGER NOT NULL DEFAULT 0,
    "opportunityChange" INTEGER NOT NULL DEFAULT 0,
    "latestSignal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "threshold" DECIMAL(65,30),
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'ONCE',
    "notifyVia" TEXT NOT NULL DEFAULT 'in-app',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStat" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "change" TEXT NOT NULL,
    "up" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSummaryCard" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DashboardSummaryCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoverSetup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tickers" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiscoverSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "minutesAgo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentAlert" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "minutesAgo" INTEGER NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "StockQuote_stockId_key" ON "StockQuote"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "StockScore_stockId_key" ON "StockScore"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "StockDrawerDetail_stockId_key" ON "StockDrawerDetail"("stockId");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");

-- CreateIndex
CREATE INDEX "WatchlistItem_stockId_idx" ON "WatchlistItem"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_stockId_key" ON "WatchlistItem"("userId", "stockId");

-- CreateIndex
CREATE INDEX "AlertRule_userId_idx" ON "AlertRule"("userId");

-- CreateIndex
CREATE INDEX "AlertRule_stockId_idx" ON "AlertRule"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketStat_label_key" ON "MarketStat"("label");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoverSetup_slug_key" ON "DiscoverSetup"("slug");

-- AddForeignKey
ALTER TABLE "StockQuote" ADD CONSTRAINT "StockQuote_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockScore" ADD CONSTRAINT "StockScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDrawerDetail" ADD CONSTRAINT "StockDrawerDetail_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
