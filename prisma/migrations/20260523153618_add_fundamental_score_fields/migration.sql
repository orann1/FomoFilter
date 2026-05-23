-- AlterTable
ALTER TABLE "StockScore" ADD COLUMN     "financialHealthScore" DECIMAL(65,30),
ADD COLUMN     "fundamentalScore" DECIMAL(65,30),
ADD COLUMN     "growthScore" DECIMAL(65,30),
ADD COLUMN     "lastCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "profitabilityScore" DECIMAL(65,30),
ADD COLUMN     "riskContextScore" DECIMAL(65,30),
ADD COLUMN     "scoreVersion" TEXT,
ADD COLUMN     "valuationScore" DECIMAL(65,30);
