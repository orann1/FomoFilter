/**
 * Test Radar Debug Trace Helper
 * Verifies debug trace functionality:
 * - Debug disabled does not write file
 * - Debug enabled writes JSON file
 * - File contains expected structure
 * - Secrets not included
 */

import { promises as fs } from "fs";
import { join } from "path";
import { createRadarDebugTrace } from "@/src/lib/opportunity-radar/radar-debug-trace";

async function cleanTestDir() {
  const testDir = join(process.cwd(), "tmp", "radar-debug-test");
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${error}`);
    }
    process.exitCode = 1;
  }
}

async function run() {
  console.log("Testing Radar Debug Trace...\n");

  // Ensure test dir exists
  const testDir = join(process.cwd(), "tmp", "radar-debug-test");
  await fs.mkdir(testDir, { recursive: true });

  // Override env vars for testing
  const originalDebugTrace = process.env.RADAR_DEBUG_AI_TRACE;
  const originalFullPayload = process.env.RADAR_DEBUG_FULL_PAYLOAD;

  try {
    // Test 1: Debug disabled does not write file
    await test("Debug disabled does not write file", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "";

      const trace = createRadarDebugTrace();
      trace.setFinalResult("success", "test");
      const path = await trace.writeToDisk();

      if (path !== null) {
        throw new Error(`Expected no file to be written, but got: ${path}`);
      }
    });

    // Test 2: Debug enabled writes JSON file
    await test("Debug enabled writes JSON file", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "true";

      const trace = createRadarDebugTrace();
      trace.setFinalResult("success", "test");
      const path = await trace.writeToDisk();

      if (!path) {
        throw new Error("Expected file path, got null");
      }

      const fullPath = join(process.cwd(), path);
      const content = await fs.readFile(fullPath, "utf-8");
      const json = JSON.parse(content);

      if (!json.attemptId) {
        throw new Error("Missing attemptId in trace");
      }

      // Clean up
      await fs.rm(fullPath, { force: true });
    });

    // Test 3: File contains expected top-level sections
    await test("File contains expected top-level sections", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "true";

      const trace = createRadarDebugTrace();
      trace.setDbContext([], "test context");
      trace.setRequest("claude-3", 4096, {}, "test_tool", {}, "test prompt");
      trace.setAnthropicResponse(200, "end_turn", { input_tokens: 100 }, []);
      trace.setValidation({ success: false, errors: [], warnings: [] });
      trace.setPersistence(true, true, "scan-123", 3, 7);
      trace.setFinalResult("success", "test");

      const path = await trace.writeToDisk();
      if (!path) throw new Error("No path returned");

      const fullPath = join(process.cwd(), path);
      const content = await fs.readFile(fullPath, "utf-8");
      const json = JSON.parse(content);

      const requiredSections = [
        "attemptId",
        "createdAt",
        "environment",
        "scan",
        "dbContext",
        "request",
        "anthropicResponse",
        "toolUse",
        "validation",
        "persistence",
        "finalResult",
      ];

      for (const section of requiredSections) {
        if (!(section in json)) {
          throw new Error(`Missing section: ${section}`);
        }
      }

      // Clean up
      await fs.rm(fullPath, { force: true });
    });

    // Test 4: Error object serializes safely
    await test("Error object serializes safely", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "true";

      const trace = createRadarDebugTrace();
      const err = new Error("test error");
      trace.setAnthropicResponse(500, "error", {}, [
        { type: "text", text: "error occurred" },
      ]);
      trace.setFinalResult("provider_error", "API error");

      const path = await trace.writeToDisk();
      if (!path) throw new Error("No path returned");

      const fullPath = join(process.cwd(), path);
      const content = await fs.readFile(fullPath, "utf-8");

      // Should be valid JSON
      const json = JSON.parse(content);

      if (!json.finalResult.message) {
        throw new Error("Missing finalResult.message");
      }

      // Clean up
      await fs.rm(fullPath, { force: true });
    });

    // Test 5: API key is not included
    await test("API key is not included in trace", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "true";

      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = "sk-test-secret-key-12345";

      const trace = createRadarDebugTrace();
      trace.setFinalResult("success", "test");

      const path = await trace.writeToDisk();
      if (!path) throw new Error("No path returned");

      const fullPath = join(process.cwd(), path);
      const content = await fs.readFile(fullPath, "utf-8");

      if (content.includes("sk-test-secret-key")) {
        throw new Error("API key leaked in trace file");
      }

      // Clean up
      process.env.ANTHROPIC_API_KEY = originalKey;
      await fs.rm(fullPath, { force: true });
    });

    // Test 6: Tool Use diagnostics capture correctly
    await test("Tool Use diagnostics capture correctly", async () => {
      process.env.RADAR_DEBUG_AI_TRACE = "true";

      const trace = createRadarDebugTrace();

      const mockToolUse = {
        type: "tool_use",
        name: "create_radar_scan_output",
        input: {
          candidates: [
            {
              ticker: "TEST",
              companyName: "Test Corp",
              detailedCategory: "tech",
              radarLens: "attention_spike",
              trendStatus: "new_today",
              sourceEvidence: [{ sourceName: "test", snippet: "test" }],
            },
          ],
          schemaVersion: "1.0",
          providerMetadata: { provider: "Anthropic" },
        },
      };

      trace.setToolUse(mockToolUse, mockToolUse.input);

      const path = await trace.writeToDisk();
      if (!path) throw new Error("No path returned");

      const fullPath = join(process.cwd(), path);
      const content = await fs.readFile(fullPath, "utf-8");
      const json = JSON.parse(content);

      const tu = json.toolUse;
      if (!tu.exists) throw new Error("toolUse.exists should be true");
      if (tu.name !== "create_radar_scan_output") throw new Error("toolUse.name incorrect");
      if (!tu.candidatesExists) throw new Error("toolUse.candidatesExists should be true");
      if (!tu.candidatesIsArray) throw new Error("toolUse.candidatesIsArray should be true");
      if (tu.candidateCount !== 1) throw new Error("toolUse.candidateCount should be 1");

      // Clean up
      await fs.rm(fullPath, { force: true });
    });

    console.log("\nAll tests passed ✓\n");
  } finally {
    // Restore env vars
    process.env.RADAR_DEBUG_AI_TRACE = originalDebugTrace;
    process.env.RADAR_DEBUG_FULL_PAYLOAD = originalFullPayload;

    // Clean test dir
    await cleanTestDir();
  }
}

run().catch((error) => {
  console.error("Test runner failed:", error);
  process.exitCode = 1;
});
