-- AlterTable
ALTER TABLE "StockScore" ADD COLUMN     "oppCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "oppScore" DECIMAL(65,30),
ADD COLUMN     "oppScoreVersion" TEXT;
