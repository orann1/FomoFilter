/**
 * Radar Validation Test Cases
 * Phase 23C-2A - Test validation failure cases
 *
 * Usage: npx tsx scripts/test-radar-validation.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { validateRadarScanOutput } from "../src/lib/opportunity-radar/validate-radar-output";
import { sampleRadarOutput } from "../src/lib/opportunity-radar/sample-radar-output";

console.log("=== Radar Validation Test Cases ===\n");

// Test 1: Valid fixture
console.log("Test 1: Valid fixture should pass");
const validResult = validateRadarScanOutput(sampleRadarOutput);
console.log(`  Result: ${validResult.success ? "✓ PASS" : "❌ FAIL"}`);
if (!validResult.success) {
  validResult.errors.forEach((e) => console.log(`    Error: ${e}`));
}
console.log();

// Test 2: Invalid 0-10 score scale
console.log("Test 2: 0-10 score scale should be rejected");
const zeroToTenOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
zeroToTenOutput.candidates[0].attentionScore = 7;
zeroToTenOutput.candidates[0].confidenceScore = 6;
zeroToTenOutput.candidates[0].hypeRiskScore = 5;
const zeroToTenResult = validateRadarScanOutput(zeroToTenOutput);
console.log(`  Result: ${!zeroToTenResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!zeroToTenResult.success) {
  const scoreErrors = zeroToTenResult.errors.filter((e) =>
    e.includes("0-10") || e.includes("likely")
  );
  if (scoreErrors.length > 0) {
    console.log(`    Detected 0-10 scale: YES`);
    scoreErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 3: Prohibited language
console.log("Test 3: Prohibited language should be rejected");
const prohibitedOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
prohibitedOutput.candidates[0].headline = "This stock is a strong buy";
const prohibitedResult = validateRadarScanOutput(prohibitedOutput);
console.log(`  Result: ${!prohibitedResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!prohibitedResult.success) {
  const langErrors = prohibitedResult.errors.filter((e) =>
    e.includes("prohibited language") || e.includes("strong buy")
  );
  if (langErrors.length > 0) {
    console.log(`    Detected prohibited language: YES`);
    langErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 4: Missing evidence
console.log("Test 4: Missing evidence should be rejected");
const noEvidenceOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
noEvidenceOutput.candidates[0].sourceEvidence = [];
const noEvidenceResult = validateRadarScanOutput(noEvidenceOutput);
console.log(`  Result: ${!noEvidenceResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!noEvidenceResult.success) {
  const evidenceErrors = noEvidenceResult.errors.filter((e) =>
    e.includes("evidence") || e.includes("sourceEvidence")
  );
  if (evidenceErrors.length > 0) {
    console.log(`    Detected missing evidence: YES`);
    evidenceErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 5: Invalid radarLens
console.log("Test 5: Invalid radarLens enum should be rejected");
const invalidLensOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
invalidLensOutput.candidates[0].radarLens = "invalid_lens";
const invalidLensResult = validateRadarScanOutput(invalidLensOutput);
console.log(`  Result: ${!invalidLensResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!invalidLensResult.success) {
  const lensErrors = invalidLensResult.errors.filter((e) =>
    e.includes("radarLens")
  );
  if (lensErrors.length > 0) {
    console.log(`    Detected invalid radarLens: YES`);
    lensErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 6: Invalid trendStatus
console.log("Test 6: Invalid trendStatus enum should be rejected");
const invalidStatusOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
invalidStatusOutput.candidates[0].trendStatus = "invalid_status";
const invalidStatusResult = validateRadarScanOutput(invalidStatusOutput);
console.log(`  Result: ${!invalidStatusResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!invalidStatusResult.success) {
  const statusErrors = invalidStatusResult.errors.filter((e) =>
    e.includes("trendStatus")
  );
  if (statusErrors.length > 0) {
    console.log(`    Detected invalid trendStatus: YES`);
    statusErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 7: Invalid credibilityTier
console.log("Test 7: Invalid credibilityTier enum should be rejected");
const invalidTierOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
invalidTierOutput.candidates[0].sourceEvidence[0].credibilityTier = "invalid_tier";
const invalidTierResult = validateRadarScanOutput(invalidTierOutput);
console.log(`  Result: ${!invalidTierResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!invalidTierResult.success) {
  const tierErrors = invalidTierResult.errors.filter((e) =>
    e.includes("credibilityTier")
  );
  if (tierErrors.length > 0) {
    console.log(`    Detected invalid credibilityTier: YES`);
    tierErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Test 8: Score out of range
console.log("Test 8: Score > 100 should be rejected");
const outOfRangeOutput = JSON.parse(JSON.stringify(sampleRadarOutput));
outOfRangeOutput.candidates[0].attentionScore = 150;
const outOfRangeResult = validateRadarScanOutput(outOfRangeOutput);
console.log(`  Result: ${!outOfRangeResult.success ? "✓ PASS (correctly rejected)" : "❌ FAIL (should reject)"}`);
if (!outOfRangeResult.success) {
  const rangeErrors = outOfRangeResult.errors.filter((e) =>
    e.includes("must be 0-100") || e.includes("attentionScore")
  );
  if (rangeErrors.length > 0) {
    console.log(`    Detected out-of-range score: YES`);
    rangeErrors.forEach((e) => console.log(`    ${e}`));
  }
}
console.log();

// Summary
const tests = [
  { name: "Valid fixture", passed: validResult.success },
  { name: "0-10 scale rejection", passed: !zeroToTenResult.success },
  { name: "Prohibited language rejection", passed: !prohibitedResult.success },
  { name: "Missing evidence rejection", passed: !noEvidenceResult.success },
  { name: "Invalid radarLens rejection", passed: !invalidLensResult.success },
  { name: "Invalid trendStatus rejection", passed: !invalidStatusResult.success },
  { name: "Invalid credibilityTier rejection", passed: !invalidTierResult.success },
  { name: "Out-of-range score rejection", passed: !outOfRangeResult.success },
];

const passCount = tests.filter((t) => t.passed).length;
console.log("=== Validation Test Summary ===");
console.log(`${passCount}/${tests.length} tests passed\n`);
tests.forEach((t) => {
  const status = t.passed ? "✓" : "❌";
  console.log(`${status} ${t.name}`);
});

if (passCount === tests.length) {
  console.log("\n✓ All validation tests passed!");
  process.exit(0);
} else {
  console.log("\n❌ Some validation tests failed");
  process.exit(1);
}
