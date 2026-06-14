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
 * @param model - Model name (e.g., "claude-sonnet-4.6")
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
  model: string = "claude-sonnet-4.6",
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
 * @param prismaClient - Optional Prisma client override (for testing/scripts). Defaults to server-side singleton.
 */
export async function persistRadarScanOutput(
  input: ValidatedRadarScanOutput,
  configId?: string,
  prismaClient?: PrismaClient
): Promise<PersistenceResult<{
  scanId: string;
  candidateCount: number;
  evidenceCount: number;
}>> {
  const prisma = prismaClient || defaultPrisma;

  try {
    // Create RadarScan record with transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the scan record
      // Note: Use current time for scanDate (when the scan was RUN)
      // not the scanDate from Claude output (which may be stale)
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
          summaryOverallMarketTheme: input.summary.topTheme,
          summaryQualityNotes: input.summary.headline,
          rejectedCandidates: input.rejectedCandidates || [],
          agentSelfCheck: input.agentSelfCheck,
          configId: configId || null,
        },
      });

      let totalEvidenceCount = 0;

      // Create RadarCandidate records
      for (let sortRank = 0; sortRank < input.candidates.length; sortRank++) {
        const candidate = input.candidates[sortRank];

        // Try to find existing stock by ticker
        const stock = await tx.stock.findUnique({
          where: { symbol: candidate.ticker },
        });

        const radarCandidate = await tx.radarCandidate.create({
          data: {
            scanId: scan.id,
            stockId: stock?.id || null,
            ticker: candidate.ticker,
            companyName: candidate.companyName,
            radarLens: candidate.radarLens,
            detailedCategory: candidate.detailedCategory,
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
            disqualifiedReason: candidate.disqualifiedReason,
            sortRank,
          },
        });

        // Create RadarEvidence records
        for (const evidence of candidate.sourceEvidence || []) {
          await tx.radarEvidence.create({
            data: {
              candidateId: radarCandidate.id,
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
            },
          });

          totalEvidenceCount += 1;
        }
      }

      return {
        scanId: scan.id,
        candidateCount: input.candidates.length,
        evidenceCount: totalEvidenceCount,
      };
    });

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
