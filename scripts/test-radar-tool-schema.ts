/**
 * Opportunity Radar Tool Schema Verification
 * Phase 23C-2C+: Verify the tool schema includes all required fields
 *
 * Usage: npx tsx scripts/test-radar-tool-schema.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import {
  RADAR_TOOL_NAME,
  RADAR_TOOL_DEFINITION,
  RADAR_TOOL_SCHEMA,
} from "../src/lib/opportunity-radar/radar-tool-schema";

const checks: { name: string; passed: boolean; reason?: string }[] = [];

function check(name: string, condition: boolean, reason?: string) {
  checks.push({
    name,
    passed: condition,
    reason: !condition ? reason : undefined,
  });
}

console.log("=== Opportunity Radar Tool Schema Verification ===\n");

// Basic structure
check("Tool name is set", RADAR_TOOL_NAME === "create_radar_scan_output");
check("Tool definition exists", RADAR_TOOL_DEFINITION !== null);
check("Tool schema exists", RADAR_TOOL_SCHEMA !== null);

// Tool definition checks
const toolDef = RADAR_TOOL_DEFINITION;
check("Tool name in definition", toolDef.name === "create_radar_scan_output");
check("Tool has description", !!toolDef.description && toolDef.description.length > 0);
check("Tool has input_schema", !!toolDef.input_schema);

// Schema top-level checks
const schema = RADAR_TOOL_SCHEMA;
check("Schema type is object", schema.type === "object");
check("Schema has properties", !!schema.properties);
check("Schema has required fields", Array.isArray(schema.required) && schema.required.length > 0);

// Top-level required fields
const requiredFields = schema.required as string[];
const expectedTopLevel = [
  "schemaVersion",
  "scanDate",
  "timeWindow",
  "providerMetadata",
  "summary",
  "candidates",
  "rejectedCandidates",
  "agentSelfCheck",
];

for (const field of expectedTopLevel) {
  check(`Top-level field: ${field}`, requiredFields.includes(field), `Missing required field: ${field}`);
}

// Candidate schema checks
const candidatesProp = schema.properties?.candidates;
check("candidates is array", candidatesProp?.type === "array");
const candidateSchema = (candidatesProp as any)?.items;
check("candidate schema exists", !!candidateSchema);

if (candidateSchema) {
  const candidateRequired = candidateSchema.required as string[];

  const criticalCandidateFields = [
    "ticker",
    "companyName",
    "radarLens",
    "detailedCategory",
    "headline",
    "radarBullets",
    "thesis",
    "whyNow",
    "mainCatalyst",
    "whatLooksInteresting",
    "keyConcerns",
    "nextCheck",
    "sourceEvidence",
    "attentionScore",
    "confidenceScore",
    "hypeRiskScore",
    "radarSignalStrength",
    "radarConvictionScore",
    "sourceQualityScore",
    "manipulationRiskScore",
    "trendStatus",
    "tags",
  ];

  for (const field of criticalCandidateFields) {
    check(`Candidate field: ${field}`, candidateRequired.includes(field), `Missing candidate field: ${field}`);
  }

  // Score field checks (0-100)
  const scoreFields = [
    "attentionScore",
    "confidenceScore",
    "hypeRiskScore",
    "radarSignalStrength",
    "radarConvictionScore",
    "sourceQualityScore",
    "manipulationRiskScore",
  ];

  for (const score of scoreFields) {
    const scoreSchema = candidateSchema.properties?.[score];
    check(
      `${score} is integer`,
      (scoreSchema as any)?.type === "integer",
      `${score} should be integer type`
    );
    check(
      `${score} min 0`,
      (scoreSchema as any)?.minimum === 0,
      `${score} should have minimum 0`
    );
    check(
      `${score} max 100`,
      (scoreSchema as any)?.maximum === 100,
      `${score} should have maximum 100`
    );
  }

  // Enum checks
  const radarLensSchema = candidateSchema.properties?.radarLens;
  const validLenses = ["attention_spike", "overreaction", "value_gap", "future_theme"];
  check(
    "radarLens has valid enums",
    Array.isArray((radarLensSchema as any)?.enum) &&
      validLenses.every((l) => (radarLensSchema as any).enum.includes(l)),
    "radarLens should have correct enum values"
  );

  const trendSchema = candidateSchema.properties?.trendStatus;
  const validTrends = ["new_today", "repeated", "back_on_radar", "cooling_down"];
  check(
    "trendStatus has valid enums",
    Array.isArray((trendSchema as any)?.enum) &&
      validTrends.every((t) => (trendSchema as any).enum.includes(t)),
    "trendStatus should have correct enum values"
  );
}

// Evidence schema checks
const evidenceProp = candidateSchema?.properties?.sourceEvidence;
check("sourceEvidence is array", (evidenceProp as any)?.type === "array");
check("sourceEvidence minItems 1", (evidenceProp as any)?.minItems === 1);

const evidenceSchema = (evidenceProp as any)?.items;
if (evidenceSchema) {
  const evidenceRequired = evidenceSchema.required as string[];
  const requiredEvidenceFields = [
    "sourceName",
    "sourceType",
    "snippet",
    "credibilityTier",
    "relevanceScore",
  ];

  for (const field of requiredEvidenceFields) {
    check(
      `Evidence field: ${field}`,
      evidenceRequired.includes(field),
      `Missing evidence field: ${field}`
    );
  }

  // Evidence URL nullable check
  const urlSchema = evidenceSchema.properties?.url;
  check(
    "Evidence URL can be null",
    (urlSchema as any)?.type instanceof Array && (urlSchema as any).type.includes("null"),
    "Evidence URL should allow null for db_context mode"
  );

  // Credibility tier enum
  const credSchema = evidenceSchema.properties?.credibilityTier;
  const validTiers = ["primary", "secondary", "tertiary", "experimental"];
  check(
    "Credibility tier has valid enums",
    Array.isArray((credSchema as any)?.enum) &&
      validTiers.every((t) => (credSchema as any).enum.includes(t)),
    "credibilityTier should have correct enum values"
  );

  // Relevance score 0-100
  const relSchema = evidenceSchema.properties?.relevanceScore;
  check("relevanceScore is integer", (relSchema as any)?.type === "integer");
  check("relevanceScore min 0", (relSchema as any)?.minimum === 0);
  check("relevanceScore max 100", (relSchema as any)?.maximum === 100);
}

// Provider metadata checks
const pmProp = schema.properties?.providerMetadata;
check("providerMetadata exists", !!pmProp);
const pmRequired = (pmProp as any)?.required as string[];
check("providerMetadata.provider required", pmRequired?.includes("provider"));
check("providerMetadata.model required", pmRequired?.includes("model"));
check("providerMetadata.searchEnabled required", pmRequired?.includes("searchEnabled"));
check("providerMetadata.sourceMode required", pmRequired?.includes("sourceMode"));

const sourceModeSchema = (pmProp as any)?.properties?.sourceMode;
const validSourceModes = ["db_context", "fixture", "web_search"];
check(
  "sourceMode has valid enums",
  Array.isArray((sourceModeSchema as any)?.enum) &&
    validSourceModes.every((m) => (sourceModeSchema as any).enum.includes(m)),
  "sourceMode should include db_context, fixture, web_search"
);

// Agent self-check
const ascProp = schema.properties?.agentSelfCheck;
check("agentSelfCheck exists", !!ascProp);
const ascRequired = (ascProp as any)?.required as string[];
check(
  "agentSelfCheck has required fields",
  Array.isArray(ascRequired) && ascRequired.length > 0,
  "agentSelfCheck should have required fields"
);

// Summary
console.log("\n=== Test Results ===\n");
const passed = checks.filter((c) => c.passed).length;
const failed = checks.filter((c) => !c.passed).length;

checks.forEach((c) => {
  const icon = c.passed ? "✓" : "❌";
  console.log(`${icon} ${c.name}${c.reason ? ` — ${c.reason}` : ""}`);
});

console.log(`\n${passed}/${checks.length} checks passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} check(s) failed`);
  process.exit(1);
} else {
  console.log("\n✓ All schema checks passed!");
  process.exit(0);
}
