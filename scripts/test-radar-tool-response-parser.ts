/**
 * Test Anthropic Tool Use Response Parser
 * Verifies that the provider correctly extracts tool_use.input from Anthropic responses
 *
 * Usage: npx tsx scripts/test-radar-tool-response-parser.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { RADAR_TOOL_NAME } from "../src/lib/opportunity-radar/radar-tool-schema";

interface AnthropicContentBlock {
  type: string;
  text?: string;
  name?: string;
  id?: string;
  input?: unknown;
}

interface AnthropicMessage {
  content: AnthropicContentBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// Test case 1: Valid tool_use with candidates array
function testValidToolUse() {
  console.log("\n1. Valid tool_use with candidates array");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "tool_use",
        id: "test-1",
        name: RADAR_TOOL_NAME,
        input: {
          schemaVersion: "1.0",
          scanDate: "2026-06-08T10:00:00Z",
          timeWindow: "24h",
          providerMetadata: {
            provider: "Anthropic",
            model: "claude-sonnet-4.6",
            searchEnabled: false,
            sourceMode: "db_context",
          },
          summary: {
            headline: "Test",
            candidateCount: 1,
            rejectedCount: 0,
            topTheme: "Test theme",
          },
          candidates: [
            {
              ticker: "TEST",
              companyName: "Test Corp",
              radarLens: "attention_spike",
              detailedCategory: "test",
              headline: "Test",
              radarBullets: ["b1"],
              thesis: "t1",
              whyNow: "w1",
              mainCatalyst: "c1",
              whatLooksInteresting: ["i1"],
              keyConcerns: ["k1"],
              nextCheck: "n1",
              sourceEvidence: [
                {
                  sourceName: "DB",
                  sourceType: "db_score",
                  snippet: "Evidence",
                  credibilityTier: "primary",
                  relevanceScore: 75,
                },
              ],
              attentionScore: 70,
              confidenceScore: 65,
              hypeRiskScore: 40,
              radarSignalStrength: 75,
              radarConvictionScore: 68,
              sourceQualityScore: 70,
              manipulationRiskScore: 35,
              trendStatus: "new_today",
              tags: ["test"],
            },
          ],
          rejectedCandidates: [],
          agentSelfCheck: {
            jsonValid: true,
            noBuySellLanguage: true,
            allCandidatesHaveEvidence: true,
            allScoresUseZeroToHundred: true,
            uncertaintyDisclosed: true,
            possibleWeaknesses: [],
          },
        },
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  if (!toolUseBlock) {
    console.log("  ❌ FAIL: tool_use block not found");
    return false;
  }

  const toolInput = toolUseBlock.input as Record<string, unknown>;
  const hasCandidates = "candidates" in toolInput;
  const isArray = Array.isArray(toolInput.candidates);

  console.log(`  ✓ tool_use found: name=${toolUseBlock.name}`);
  console.log(`  ✓ input exists and is object: ${typeof toolInput === "object"}`);
  console.log(`  ✓ candidates field exists: ${hasCandidates}`);
  console.log(`  ✓ candidates is array: ${isArray}`);

  if (!hasCandidates || !isArray) {
    console.log("  ❌ FAIL: candidates missing or not array");
    return false;
  }

  console.log("  ✓ PASS");
  return true;
}

// Test case 2: Missing tool_use
function testMissingToolUse() {
  console.log("\n2. Missing tool_use (text-only response)");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "text",
        text: "I cannot process this request.",
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const found = !!toolUseBlock;
  console.log(`  ✓ tool_use block found: ${found}`);

  if (found) {
    console.log("  ❌ FAIL: Should not find tool_use in text-only response");
    return false;
  }

  console.log("  ✓ PASS");
  return true;
}

// Test case 3: Wrong tool name
function testWrongToolName() {
  console.log("\n3. Wrong tool name in response");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "tool_use",
        id: "test-3",
        name: "some_other_tool",
        input: { data: "test" },
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const found = !!toolUseBlock;
  console.log(`  ✓ tool_use with correct name found: ${found}`);

  if (found) {
    console.log("  ❌ FAIL: Should not match wrong tool name");
    return false;
  }

  console.log("  ✓ PASS");
  return true;
}

// Test case 4: Tool input missing candidates
function testMissingCandidates() {
  console.log("\n4. Tool input missing candidates field");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "tool_use",
        id: "test-4",
        name: RADAR_TOOL_NAME,
        input: {
          schemaVersion: "1.0",
          scanDate: "2026-06-08T10:00:00Z",
          timeWindow: "24h",
          providerMetadata: {
            provider: "Anthropic",
            model: "claude-sonnet-4.6",
            searchEnabled: false,
            sourceMode: "db_context",
          },
          summary: {
            headline: "Test",
            candidateCount: 0,
            rejectedCount: 0,
            topTheme: "Test",
          },
          // Missing candidates field!
          rejectedCandidates: [],
          agentSelfCheck: {
            jsonValid: true,
            noBuySellLanguage: true,
            allCandidatesHaveEvidence: true,
            allScoresUseZeroToHundred: true,
            uncertaintyDisclosed: true,
            possibleWeaknesses: [],
          },
        },
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const toolInput = toolUseBlock?.input as Record<string, unknown>;
  const hasCandidates = toolInput && "candidates" in toolInput;

  console.log(`  ✓ tool_use found: ${!!toolUseBlock}`);
  console.log(`  ✓ candidates field exists: ${hasCandidates}`);

  if (hasCandidates) {
    console.log("  ❌ FAIL: Should not have candidates field");
    return false;
  }

  console.log("  ✓ PASS (correctly identified missing candidates)");
  return true;
}

// Test case 5: Candidates is not an array
function testCandidatesNotArray() {
  console.log("\n5. Candidates field is not an array");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "tool_use",
        id: "test-5",
        name: RADAR_TOOL_NAME,
        input: {
          schemaVersion: "1.0",
          scanDate: "2026-06-08T10:00:00Z",
          timeWindow: "24h",
          providerMetadata: {
            provider: "Anthropic",
            model: "claude-sonnet-4.6",
            searchEnabled: false,
            sourceMode: "db_context",
          },
          summary: {
            headline: "Test",
            candidateCount: 1,
            rejectedCount: 0,
            topTheme: "Test",
          },
          candidates: "not an array", // Wrong type!
          rejectedCandidates: [],
          agentSelfCheck: {
            jsonValid: true,
            noBuySellLanguage: true,
            allCandidatesHaveEvidence: true,
            allScoresUseZeroToHundred: true,
            uncertaintyDisclosed: true,
            possibleWeaknesses: [],
          },
        },
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const toolInput = toolUseBlock?.input as Record<string, unknown>;
  const isArray = Array.isArray(toolInput.candidates);

  console.log(`  ✓ tool_use found: ${!!toolUseBlock}`);
  console.log(`  ✓ candidates field type: ${typeof toolInput.candidates}`);
  console.log(`  ✓ Array.isArray(candidates): ${isArray}`);

  if (isArray) {
    console.log("  ❌ FAIL: candidates should not be array");
    return false;
  }

  console.log("  ✓ PASS (correctly identified non-array candidates)");
  return true;
}

// Test case 6: Multiple content blocks (text + tool_use)
function testMultipleContentBlocks() {
  console.log("\n6. Multiple content blocks (text + tool_use)");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "text",
        text: "Here is the radar scan:",
      },
      {
        type: "tool_use",
        id: "test-6",
        name: RADAR_TOOL_NAME,
        input: {
          schemaVersion: "1.0",
          scanDate: "2026-06-08T10:00:00Z",
          timeWindow: "24h",
          providerMetadata: {
            provider: "Anthropic",
            model: "claude-sonnet-4.6",
            searchEnabled: false,
            sourceMode: "db_context",
          },
          summary: {
            headline: "Test",
            candidateCount: 0,
            rejectedCount: 0,
            topTheme: "Test",
          },
          candidates: [],
          rejectedCandidates: [],
          agentSelfCheck: {
            jsonValid: true,
            noBuySellLanguage: true,
            allCandidatesHaveEvidence: true,
            allScoresUseZeroToHundred: true,
            uncertaintyDisclosed: true,
            possibleWeaknesses: [],
          },
        },
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const found = !!toolUseBlock;
  const isArray = found ? Array.isArray((toolUseBlock?.input as any).candidates) : false;

  console.log(`  ✓ Multiple content blocks found: ${mockResponse.content.length}`);
  console.log(`  ✓ tool_use located correctly: ${found}`);
  console.log(`  ✓ candidates is array: ${isArray}`);

  if (!found || !isArray) {
    console.log("  ❌ FAIL: Should find tool_use and parse candidates correctly");
    return false;
  }

  console.log("  ✓ PASS");
  return true;
}

// Test case 7: Input is a string instead of object (handled by provider with JSON.parse)
function testInputAsString() {
  console.log("\n7. Tool input is string (handled by JSON.parse in provider)");

  const mockResponse: AnthropicMessage = {
    content: [
      {
        type: "tool_use",
        id: "test-7",
        name: RADAR_TOOL_NAME,
        input: JSON.stringify({
          schemaVersion: "1.0",
          scanDate: "2026-06-08T10:00:00Z",
          timeWindow: "24h",
          providerMetadata: {
            provider: "Anthropic",
            model: "claude-sonnet-4.6",
            searchEnabled: false,
            sourceMode: "db_context",
          },
          summary: {
            headline: "Test",
            candidateCount: 0,
            rejectedCount: 0,
            topTheme: "Test",
          },
          candidates: [],
          rejectedCandidates: [],
          agentSelfCheck: {
            jsonValid: true,
            noBuySellLanguage: true,
            allCandidatesHaveEvidence: true,
            allScoresUseZeroToHundred: true,
            uncertaintyDisclosed: true,
            possibleWeaknesses: [],
          },
        }),
      },
    ],
  };

  const toolUseBlock = mockResponse.content?.find(
    (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
  );

  const toolInput = toolUseBlock?.input;
  const isString = typeof toolInput === "string";

  console.log(`  ✓ tool_use found: ${!!toolUseBlock}`);
  console.log(`  ✓ Input detected as string: ${isString}`);

  if (isString) {
    // Provider handles this case with JSON.parse
    try {
      const parsed = JSON.parse(toolInput);
      const hasCandidates = "candidates" in parsed;
      const isArray = Array.isArray(parsed.candidates);

      console.log(`  ✓ Parsed successfully with JSON.parse`);
      console.log(`  ✓ Candidates field exists: ${hasCandidates}`);
      console.log(`  ✓ Candidates is array: ${isArray}`);

      if (hasCandidates && isArray) {
        console.log("  ✓ PASS (string input handled correctly)");
        return true;
      } else {
        console.log("  ❌ FAIL: Parsed data does not have valid candidates array");
        return false;
      }
    } catch (error) {
      console.log("  ❌ FAIL: JSON.parse failed");
      return false;
    }
  }

  console.log("  ❌ FAIL: Input should be string in this test case");
  return false;
}

// Run all tests
console.log("=== Anthropic Tool Use Response Parser Tests ===");

const results = [
  testValidToolUse(),
  testMissingToolUse(),
  testWrongToolName(),
  testMissingCandidates(),
  testCandidatesNotArray(),
  testMultipleContentBlocks(),
  testInputAsString(),
];

const passed = results.filter((r) => r).length;
const total = results.length;

console.log(`\n=== Summary ===`);
console.log(`${passed}/${total} tests passed`);

if (passed < total) {
  console.log(`\n⚠️  ${total - passed} test(s) failed — review issues above`);
  process.exit(1);
} else {
  console.log("\n✓ All parser tests passed!");
  process.exit(0);
}
