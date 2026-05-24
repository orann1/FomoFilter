-- AlterTable
ALTER TABLE "SyncRun" ADD COLUMN     "currentSymbol" TEXT,
ADD COLUMN     "processedCount" INTEGER NOT NULL DEFAULT 0;
