-- CreateTable
CREATE TABLE "StockAnalystData" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "targetPrice" DECIMAL(65,30),
    "analystUpsidePercent" DECIMAL(65,30),
    "analystRating" TEXT,
    "analystCount" INTEGER,
    "targetHigh" DECIMAL(65,30),
    "targetLow" DECIMAL(65,30),
    "targetMedian" DECIMAL(65,30),
    "targetMean" DECIMAL(65,30),
    "strongBuyCount" INTEGER,
    "buyCount" INTEGER,
    "holdCount" INTEGER,
    "sellCount" INTEGER,
    "strongSellCount" INTEGER,
    "source" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAnalystData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockAnalystData_stockId_key" ON "StockAnalystData"("stockId");

-- CreateIndex
CREATE INDEX "StockAnalystData_lastSyncedAt_idx" ON "StockAnalystData"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "StockAnalystData_analystRating_idx" ON "StockAnalystData"("analystRating");

-- AddForeignKey
ALTER TABLE "StockAnalystData" ADD CONSTRAINT "StockAnalystData_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
