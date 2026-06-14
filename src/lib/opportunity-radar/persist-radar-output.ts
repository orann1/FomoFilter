"use server";

import { prisma as defaultPrisma } from "@/src/lib/db/prisma";
import type { PrismaClient } from "@prisma/client";
import type { ValidatedRadarScanOutput } from "@/src/types/opportunity-radar-agent";

export type PersistenceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  scanId?: string;
  candidateCount?: number;
  evidenceCount?: number;
};

/**
 * Persist a failed Radar scan to the database
 * Creates RadarScan record with status="failed" and error message
 * Does NOT create RadarCandidate or RadarEvidence records
 *
 * @param errorMessage - Human-readable error message
 * @param provider - Provider name (e.g., "Anthropic")
 * @param model - Model name (e.g., "claude-sonnet-4-6")
 * @param executionTimeMs - Execution time in milliseconds
 * @param tokenPrompt - Optional prompt tokens used
 * @param tokenCompletion - Optional completion tokens used
 * @param configId - Optional config ID if DB config was used
 * @param failureType - Type of failure (e.g., "provider_error", "validation_error", "truncation")
 * @param prismaClient - Optional Prisma client override (for testing/scripts). Defaults to server-side singleton.
 */
export async function persistFailedRadarScan(
  errorMessage: string,
  provider: string = "Anthropic",
  model: string = "claude-sonnet-4-6",
  executionTimeMs?: number,
  tokenPrompt?: number,
  tokenCompletion?: number,
  configId?: string,
  failureType: string = "provider_error",
  prismaClient?: PrismaClient
): Promise<PersistenceResult<{ scanId: string }>> {
  const prisma = prismaClient || defaultPrisma;

  try {
    const scan = await prisma.radarScan.create({
      data: {
        scanDate: new Date(),
        timeWindow: "24h",
        provider,
        model,
        promptVersion: "unknown",
        schemaVersion: "unknown",
        status: "failed",
        sourceMode: "db_context",
        actualThinkingEffort: null,
        searchEnabled: false,
        totalCandidatesReturned: 0,
        totalRejected: 0,
        totalProcessed: 0,
        validOutputCount: 0,
        executionTimeMs: executionTimeMs || null,
        tokenPrompt: tokenPrompt || null,
        tokenCompletion: tokenCompletion || null,
        tokenTotal: null,
        costEstimate: null,
        summaryOverallMarketTheme: null,
        summaryQualityNotes: null,
        summaryLimitations: null,
        errorMessage,
        configId: configId || null,
      },
    });

    return {
      success: true,
      scanId: scan.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to persist error scan: ${message}`,
    };
  }
}

/**
 * Persist a validated Radar scan output to the database
 * Creates RadarScan, RadarCandidate, and RadarEvidence records
 *
 * @param input - Validated radar scan output
 * @param configId - Optional config ID if DB config was used
 * @param executionTimeMs - Optional execution time in milliseconds (from provider response metadata)
 * @param prismaClient - Optional Prisma client override (for testing/scripts). Defaults to server-side singleton.
 */
export async function persistRadarScanOutput(
  input: ValidatedRadarScanOutput,
  configId?: string,
  executionTimeMs?: number,
  prismaClient?: PrismaClient
): Promise<PersistenceResult<{
  scanId: string;
  candidateCount: number;
  evidenceCount: number;
}>> {
  const prisma = prismaClient || defaultPrisma;

  try {
    // OPTIMIZATION: Batch-load all stocks OUTSIDE the transaction
    // to avoid repeated findUnique queries inside transaction (which causes timeout)
    const candidateTickers = input.candidates.map(
      (c) => (c.ticker || "").toUpperCase().trim()
    );
    const uniqueTickers = Array.from(new Set(candidateTickers));

    const stocksFromDb = await prisma.stock.findMany({
      where: { symbol: { in: uniqueTickers } },
      select: { id: true, symbol: true, isActive: true },
    });

    // Build a Map for O(1) lookup inside transaction
    const stockMap = new Map(
      stocksFromDb.map((s) => [s.symbol, { id: s.id, isActive: s.isActive }])
    );

    // Create RadarScan record with transaction for atomicity
    // Use extended timeout (20s) because transaction performs 30-40 writes for 9-10 candidates
    // This is safe because: validation completed before transaction starts, no API calls
    const result = await prisma.$transaction(
      async (tx) => {
        // Create the scan record
        // Note: Use current time for scanDate (when the scan was RUN)
        // not the scanDate from Claude output (which may be stale)
        const scanPeriodStart = (input as any).scanPeriodStart
          ? new Date((input as any).scanPeriodStart)
          : null;
        const scanPeriodEnd = (input as any).scanPeriodEnd
          ? new Date((input as any).scanPeriodEnd)
          : null;
        const scanLabel = (input as any).scanLabel || null;

        const scan = await tx.radarScan.create({
          data: {
            scanDate: new Date(),
            timeWindow: input.timeWindow,
            provider: input.providerMetadata.provider,
            model: input.providerMetadata.model,
            promptVersion: input.providerMetadata.notes || "unknown",
            schemaVersion: input.schemaVersion,
            status: "success",
            sourceMode: input.providerMetadata.sourceMode,
            actualThinkingEffort: input.providerMetadata.actualThinkingEffort,
            searchEnabled: input.providerMetadata.searchEnabled,
            totalCandidatesReturned: input.candidates.length,
            totalRejected: input.rejectedCandidates?.length || 0,
            totalProcessed: input.candidates.length,
            validOutputCount: input.candidates.length,
            executionTimeMs: executionTimeMs || null,
            summaryOverallMarketTheme: input.summary.topTheme,
            summaryQualityNotes: input.summary.headline,
            rejectedCandidates: input.rejectedCandidates || [],
            agentSelfCheck: input.agentSelfCheck,
            configId: configId || null,
            scanPeriodStart,
            scanPeriodEnd,
            scanLabel,
          },
        });

        // Prepare all candidate records for batch create
        const candidateCreateData = [];
        for (let sortRank = 0; sortRank < input.candidates.length; sortRank++) {
          const candidate = input.candidates[sortRank];

          // Look up stock from preloaded Map (O(1), no Prisma query inside transaction)
          const normalizedTicker = (candidate.ticker || "").toUpperCase().trim();
          const stock = stockMap.get(normalizedTicker);

          // Determine DB matching and external discovery status
          let dbValidationStatus = "not_found";
          let externalDiscoveryStatus = "external_discovery";
          let stockId: string | null = null;

          if (stock) {
            if (stock.isActive) {
              dbValidationStatus = "matched";
              externalDiscoveryStatus = "in_db";
              stockId = stock.id;
            } else {
              // Stock exists but is inactive
              dbValidationStatus = "inactive";
              externalDiscoveryStatus = "external_discovery";
              stockId = null; // Do not link inactive stocks
            }
          }

          candidateCreateData.push({
            scanId: scan.id,
            stockId: stockId,
            ticker: normalizedTicker,
            companyName: candidate.companyName,
            radarLens: candidate.radarLens || null,
            detailedCategory: candidate.detailedCategory || null,
            headline: candidate.headline,
            radarBullets: candidate.radarBullets || [],
            thesis: candidate.thesis,
            whyNow: candidate.whyNow,
            mainCatalyst: candidate.mainCatalyst,
            whatLooksInteresting: candidate.whatLooksInteresting || [],
            keyConcerns: candidate.keyConcerns || [],
            nextCheck: candidate.nextCheck,
            attentionScore: candidate.attentionScore,
            confidenceScore: candidate.confidenceScore,
            hypeRiskScore: candidate.hypeRiskScore,
            radarSignalStrength: candidate.radarSignalStrength,
            radarConvictionScore: candidate.radarConvictionScore,
            sourceQualityScore: candidate.sourceQualityScore,
            manipulationRiskScore: candidate.manipulationRiskScore,
            trendStatus: candidate.trendStatus,
            appearancesLast7Days: candidate.appearancesLast7Days || 0,
            appearancesLast30Days: candidate.appearancesLast30Days || 0,
            tags: candidate.tags || [],
            reasonTags: (candidate as any).reasonTags || [],
            externalDiscoveryStatus,
            dbValidationStatus,
            researchPriority: (candidate as any).researchPriority || null,
            disqualifiedReason: candidate.disqualifiedReason,
            sortRank,
          });
        }

        // Batch create all candidates at once (reduces individual operations)
        const candidates = await tx.radarCandidate.createMany({
          data: candidateCreateData,
        });

        // Get created candidates to build evidence records with correct IDs
        const createdCandidates = await tx.radarCandidate.findMany({
          where: { scanId: scan.id },
          select: { id: true, sortRank: true },
          orderBy: { sortRank: "asc" },
        });

        // Prepare all evidence records for batch create
        const evidenceCreateData = [];
        let totalEvidenceCount = 0;

        for (let i = 0; i < input.candidates.length; i++) {
          const candidate = input.candidates[i];
          const createdCandidate = createdCandidates[i];

          for (const evidence of candidate.sourceEvidence || []) {
            evidenceCreateData.push({
              candidateId: createdCandidate.id,
              sourceName: evidence.sourceName,
              sourceType: evidence.sourceType,
              url: evidence.url || null,
              title: evidence.title || null,
              publishedAt: evidence.publishedAt
                ? new Date(evidence.publishedAt)
                : null,
              snippet: evidence.snippet,
              credibilityTier: evidence.credibilityTier,
              relevanceScore: evidence.relevanceScore,
            });

            totalEvidenceCount += 1;
          }
        }

        // Batch create all evidence records at once
        if (evidenceCreateData.length > 0) {
          await tx.radarEvidence.createMany({
            data: evidenceCreateData,
          });
        }

        return {
          scanId: scan.id,
          candidateCount: input.candidates.length,
          evidenceCount: totalEvidenceCount,
        };
      },
      {
        timeout: 20000, // 20s timeout for batch persistence (default is 5s)
        maxWait: 20000,
      }
    );

    return {
      success: true,
      data: result,
      scanId: result.scanId,
      candidateCount: result.candidateCount,
      evidenceCount: result.evidenceCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    return {
      success: false,
      error: `Failed to persist radar scan: ${message}`,
    };
  }
}
