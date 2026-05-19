-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "persisted" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRunItem" (
    "id" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "dbAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncRun_type_idx" ON "SyncRun"("type");

-- CreateIndex
CREATE INDEX "SyncRun_provider_idx" ON "SyncRun"("provider");

-- CreateIndex
CREATE INDEX "SyncRun_status_idx" ON "SyncRun"("status");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");

-- CreateIndex
CREATE INDEX "SyncRunItem_syncRunId_idx" ON "SyncRunItem"("syncRunId");

-- CreateIndex
CREATE INDEX "SyncRunItem_symbol_idx" ON "SyncRunItem"("symbol");

-- CreateIndex
CREATE INDEX "SyncRunItem_status_idx" ON "SyncRunItem"("status");

-- AddForeignKey
ALTER TABLE "SyncRunItem" ADD CONSTRAINT "SyncRunItem_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "SyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
