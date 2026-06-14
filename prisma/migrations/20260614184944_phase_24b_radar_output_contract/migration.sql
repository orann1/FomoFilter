-- AlterTable
ALTER TABLE "RadarCandidate" ADD COLUMN     "dbValidationStatus" TEXT,
ADD COLUMN     "externalDiscoveryStatus" TEXT,
ADD COLUMN     "reasonTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "researchPriority" INTEGER;

-- AlterTable
ALTER TABLE "RadarScan" ADD COLUMN     "scanLabel" TEXT,
ADD COLUMN     "scanPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "scanPeriodStart" TIMESTAMP(3);
