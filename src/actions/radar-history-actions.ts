"use server";

import { prisma } from "@/src/lib/db/prisma";

export type LatestRadarScanSummary = {
  scanId: string;
  scanDate: Date;
  status: string;
  provider: string;
  model: string;
  sourceMode: string;
  promptVersion: string;
  schemaVersion: string;
  totalCandidatesReturned: number;
  totalProcessed: number;
  totalRejected: number;
  executionTimeMs?: number | null;
  configId?: string | null;
};

export type RadarScanHistoryItem = {
  scanId: string;
  scanDate: Date;
  status: string;
  provider: string;
  model: string;
  sourceMode: string;
  promptVersion: string;
  totalCandidatesReturned: number;
  totalProcessed: number;
  totalRejected: number;
  executionTimeMs?: number | null;
  configId?: string | null;
};

export async function getLatestRadarScanAction(): Promise<LatestRadarScanSummary | null> {
  try {
    const scan = await prisma.radarScan.findFirst({
      orderBy: { scanDate: "desc" },
      take: 1,
    });

    if (!scan) {
      return null;
    }

    return {
      scanId: scan.id,
      scanDate: scan.scanDate,
      status: scan.status,
      provider: scan.provider,
      model: scan.model,
      sourceMode: scan.sourceMode,
      promptVersion: scan.promptVersion,
      schemaVersion: scan.schemaVersion,
      totalCandidatesReturned: scan.totalCandidatesReturned,
      totalProcessed: scan.totalProcessed,
      totalRejected: scan.totalRejected,
      executionTimeMs: scan.executionTimeMs,
      configId: scan.configId,
    };
  } catch (error) {
    console.error("Failed to load latest radar scan:", error);
    return null;
  }
}

export async function getRadarScanHistoryAction(
  limit: number = 10
): Promise<RadarScanHistoryItem[]> {
  try {
    const scans = await prisma.radarScan.findMany({
      orderBy: { scanDate: "desc" },
      take: limit,
      select: {
        id: true,
        scanDate: true,
        status: true,
        provider: true,
        model: true,
        sourceMode: true,
        promptVersion: true,
        totalCandidatesReturned: true,
        totalProcessed: true,
        totalRejected: true,
        executionTimeMs: true,
        configId: true,
      },
    });

    return scans.map((scan) => ({
      scanId: scan.id,
      scanDate: scan.scanDate,
      status: scan.status,
      provider: scan.provider,
      model: scan.model,
      sourceMode: scan.sourceMode,
      promptVersion: scan.promptVersion,
      totalCandidatesReturned: scan.totalCandidatesReturned,
      totalProcessed: scan.totalProcessed,
      totalRejected: scan.totalRejected,
      executionTimeMs: scan.executionTimeMs,
      configId: scan.configId,
    }));
  } catch (error) {
    console.error("Failed to load radar scan history:", error);
    return [];
  }
}
