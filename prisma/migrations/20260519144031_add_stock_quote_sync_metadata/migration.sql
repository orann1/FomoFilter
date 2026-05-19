-- AlterTable
ALTER TABLE "StockQuote" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3);
