-- CreateEnum
CREATE TYPE "StockUniverseType" AS ENUM ('BASE_UNIVERSE', 'INDEX', 'THEME', 'CUSTOM');

-- CreateTable
CREATE TABLE "StockUniverse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "StockUniverseType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockUniverse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockUniverseMember" (
    "stockId" TEXT NOT NULL,
    "universeId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockUniverseMember_pkey" PRIMARY KEY ("stockId","universeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockUniverse_slug_key" ON "StockUniverse"("slug");

-- CreateIndex
CREATE INDEX "StockUniverse_type_idx" ON "StockUniverse"("type");

-- CreateIndex
CREATE INDEX "StockUniverse_isDefault_idx" ON "StockUniverse"("isDefault");

-- CreateIndex
CREATE INDEX "StockUniverseMember_universeId_idx" ON "StockUniverseMember"("universeId");

-- CreateIndex
CREATE INDEX "StockUniverseMember_stockId_idx" ON "StockUniverseMember"("stockId");

-- AddForeignKey
ALTER TABLE "StockUniverseMember" ADD CONSTRAINT "StockUniverseMember_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockUniverseMember" ADD CONSTRAINT "StockUniverseMember_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "StockUniverse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
