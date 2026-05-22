-- AlterTable
ALTER TABLE "StockUniverseMember" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT,
ADD COLUMN     "statusReasonCode" TEXT;

-- CreateIndex
CREATE INDEX "StockUniverseMember_isActive_idx" ON "StockUniverseMember"("isActive");
