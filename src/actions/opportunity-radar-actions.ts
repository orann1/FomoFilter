"use server";

import { validateRadarScanOutput } from "@/src/lib/opportunity-radar/validate-radar-output";
import { persistRadarScanOutput } from "@/src/lib/opportunity-radar/persist-radar-output";
import { sampleRadarOutput } from "@/src/lib/opportunity-radar/sample-radar-output";

export type RadarFixtureScanResult = {
  success: boolean;
  scanId?: string;
  candidateCount?: number;
  evidenceCount?: number;
  error?: string;
  validationErrors?: string[];
};

/**
 * Run Opportunity Radar fixture validation and persistence
 * Phase 23C-2B: Admin button trigger for fixture-only scan
 *
 * This action:
 * - Validates sampleRadarOutput using strict rules
 * - Persists valid output to RadarScan/RadarCandidate/RadarEvidence tables
 * - Does NOT call any external AI, provider, or search APIs
 * - Returns scanId, candidateCount, evidenceCount on success
 */
export async function runOpportunityRadarFixtureScanAction(): Promise<RadarFixtureScanResult> {
  try {
    // Step 1: Validate fixture
    const validationResult = validateRadarScanOutput(sampleRadarOutput);

    if (!validationResult.success) {
      return {
        success: false,
        error: "Fixture validation failed",
        validationErrors: validationResult.errors,
      };
    }

    if (!validationResult.data) {
      return {
        success: false,
        error: "No validated data to persist",
      };
    }

    // Step 2: Persist to database
    const persistResult = await persistRadarScanOutput(validationResult.data);

    if (!persistResult.success) {
      return {
        success: false,
        error: persistResult.error || "Persistence failed",
      };
    }

    // Step 3: Return success with metrics
    return {
      success: true,
      scanId: persistResult.scanId,
      candidateCount: persistResult.candidateCount,
      evidenceCount: persistResult.evidenceCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Action failed: ${message}`,
    };
  }
}
