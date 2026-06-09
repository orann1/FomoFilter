-- AlterTable
ALTER TABLE "RadarScan" ADD COLUMN     "configId" TEXT;

-- CreateTable
CREATE TABLE "RadarAiConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Radar AI Config',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "promptTemplate" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 8192,
    "dbContextLimit" INTEGER NOT NULL DEFAULT 20,
    "candidateLimit" INTEGER NOT NULL DEFAULT 10,
    "debugTraceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "promptVersion" TEXT NOT NULL DEFAULT 'opportunity-radar-v1',
    "schemaVersion" TEXT NOT NULL DEFAULT 'candidate-output-v1',
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadarAiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadarAiConfig_isActive_idx" ON "RadarAiConfig"("isActive");

-- CreateIndex
CREATE INDEX "RadarAiConfig_createdAt_idx" ON "RadarAiConfig"("createdAt");

-- CreateIndex
CREATE INDEX "RadarScan_configId_idx" ON "RadarScan"("configId");

-- AddForeignKey
ALTER TABLE "RadarScan" ADD CONSTRAINT "RadarScan_configId_fkey" FOREIGN KEY ("configId") REFERENCES "RadarAiConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
