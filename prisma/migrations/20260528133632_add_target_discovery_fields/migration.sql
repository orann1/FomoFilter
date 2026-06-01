-- AlterTable
ALTER TABLE "StockAnalystData" ADD COLUMN     "targetAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetLastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "targetLastFoundAt" TIMESTAMP(3),
ADD COLUMN     "targetLastMessage" TEXT,
ADD COLUMN     "targetNextRetryAt" TIMESTAMP(3),
ADD COLUMN     "targetStatus" TEXT;

-- CreateIndex
CREATE INDEX "StockAnalystData_targetStatus_idx" ON "StockAnalystData"("targetStatus");

-- CreateIndex
CREATE INDEX "StockAnalystData_targetNextRetryAt_idx" ON "StockAnalystData"("targetNextRetryAt");
