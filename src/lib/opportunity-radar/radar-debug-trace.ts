/**
 * Radar Debug Trace Helper
 * Logs structured diagnostic information about Claude Radar Tool Use flow
 * Development-only, controlled via RADAR_DEBUG_AI_TRACE env flag
 */

import { promises as fs } from "fs";
import { join } from "path";
import type {
  RadarScanOutput,
  ValidatedRadarScanOutput,
} from "@/src/types/opportunity-radar-agent";
import type { ValidationResult } from "./validate-radar-output";

function isDebugEnabled(): boolean {
  return process.env.RADAR_DEBUG_AI_TRACE === "true";
}

function isFullPayloadEnabled(): boolean {
  return process.env.RADAR_DEBUG_FULL_PAYLOAD === "true";
}

function generateAttemptId(): string {
  return "cm" + Math.random().toString(36).substring(2, 11);
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "");
}

interface DbContextSummary {
  stockCount: number;
  topTickers: string[];
  fieldCompleteness: {
    hasName: number;
    hasQuote: number;
    hasScore: number;
    hasAnalyst: number;
  };
  sampleRows: unknown[];
}

interface RequestSummary {
  model: string;
  maxTokens: number;
  toolChoice: unknown;
  toolName: string;
  toolSchemaSummary: {
    requiredFields: string[];
    candidatesType: string;
    candidateRequiredFieldCount?: number;
  };
  promptLengthChars: number;
  promptPreviewFirst1000: string;
}

interface AnthropicResponseSummary {
  httpStatus: number;
  stopReason: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  contentBlockCount: number;
  contentBlockTypes: string[];
  textBlockPreviewFirst1000?: string | null;
}

interface ToolUseDiagnostics {
  exists: boolean;
  name: string | null;
  inputType: string | null;
  inputWasString: boolean;
  stringParseSucceeded: boolean | null;
  stringParseError?: string;
  topLevelKeys: string[];
  candidatesExists: boolean;
  candidatesType: string;
  candidatesIsArray: boolean;
  candidateCount: number;
  alternateCandidateKeys: string[];
  candidate0Keys: string[];
  candidate0Summary: Record<string, unknown>;
}

interface ValidationSummary {
  ran: boolean;
  passed: boolean;
  errors: string[];
}

interface PersistenceSummary {
  started: boolean;
  succeeded: boolean;
  scanId: string | null;
  candidateCount: number;
  evidenceCount: number;
  error: string | null;
}

interface FinalResultSummary {
  status: "success" | "empty" | "provider_error" | "validation_error" | "persistence_error";
  message: string;
  durationMs: number;
}

interface RadarDebugTrace {
  attemptId: string;
  createdAt: string;
  environment: {
    nodeEnv: string | undefined;
    debugTraceEnabled: boolean;
    fullPayloadEnabled: boolean;
    apiKeyPresent: boolean;
  };
  scan: {
    provider: string;
    model: string;
    sourceMode: string;
    timeWindow: string;
  };
  dbContext: DbContextSummary;
  request: RequestSummary;
  anthropicResponse: AnthropicResponseSummary;
  toolUse: ToolUseDiagnostics;
  validation: ValidationSummary;
  persistence: PersistenceSummary;
  finalResult: FinalResultSummary;
}

export class RadarDebugTraceCollector {
  private attemptId: string;
  private createdAt: string;
  private trace: RadarDebugTrace;
  private startTime: number;

  constructor() {
    this.attemptId = generateAttemptId();
    this.createdAt = getTimestamp();
    this.startTime = Date.now();

    this.trace = {
      attemptId: this.attemptId,
      createdAt: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        debugTraceEnabled: isDebugEnabled(),
        fullPayloadEnabled: isFullPayloadEnabled(),
        apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      },
      scan: {
        provider: "Anthropic",
        model: "claude-sonnet-4-6",
        sourceMode: "db_context",
        timeWindow: "24h",
      },
      dbContext: {
        stockCount: 0,
        topTickers: [],
        fieldCompleteness: {
          hasName: 0,
          hasQuote: 0,
          hasScore: 0,
          hasAnalyst: 0,
        },
        sampleRows: [],
      },
      request: {
        model: "",
        maxTokens: 0,
        toolChoice: {},
        toolName: "",
        toolSchemaSummary: {
          requiredFields: [],
          candidatesType: "unknown",
        },
        promptLengthChars: 0,
        promptPreviewFirst1000: "",
      },
      anthropicResponse: {
        httpStatus: 0,
        stopReason: "",
        contentBlockCount: 0,
        contentBlockTypes: [],
      },
      toolUse: {
        exists: false,
        name: null,
        inputType: null,
        inputWasString: false,
        stringParseSucceeded: null,
        topLevelKeys: [],
        candidatesExists: false,
        candidatesType: "missing",
        candidatesIsArray: false,
        candidateCount: 0,
        alternateCandidateKeys: [],
        candidate0Keys: [],
        candidate0Summary: {},
      },
      validation: {
        ran: false,
        passed: false,
        errors: [],
      },
      persistence: {
        started: false,
        succeeded: false,
        scanId: null,
        candidateCount: 0,
        evidenceCount: 0,
        error: null,
      },
      finalResult: {
        status: "provider_error",
        message: "Not set",
        durationMs: 0,
      },
    };
  }

  getAttemptId(): string {
    return this.attemptId;
  }

  setDbContext(stocks: unknown[], stockContext: string): void {
    if (!Array.isArray(stocks)) return;

    const items = stocks as Array<{ symbol?: string; name?: string; quote?: unknown; score?: unknown; analystData?: unknown }>;

    this.trace.dbContext.stockCount = items.length;
    this.trace.dbContext.topTickers = items.slice(0, 20).map((s) => s.symbol || "?");

    let hasName = 0;
    let hasQuote = 0;
    let hasScore = 0;
    let hasAnalyst = 0;

    items.forEach((stock) => {
      if (stock.name) hasName++;
      if (stock.quote) hasQuote++;
      if (stock.score) hasScore++;
      if (stock.analystData) hasAnalyst++;
    });

    this.trace.dbContext.fieldCompleteness = {
      hasName,
      hasQuote,
      hasScore,
      hasAnalyst,
    };

    const sampleRows = items.slice(0, 3).map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      hasQuote: !!stock.quote,
      hasScore: !!stock.score,
      hasAnalyst: !!stock.analystData,
    }));

    this.trace.dbContext.sampleRows = sampleRows;

    if (isFullPayloadEnabled()) {
      this.trace.dbContext = {
        ...this.trace.dbContext,
        stockContext: stockContext.substring(0, 2000),
      } as unknown as DbContextSummary;
    }
  }

  setRequest(
    model: string,
    maxTokens: number,
    toolChoice: unknown,
    toolName: string,
    toolSchema: unknown,
    prompt: string
  ): void {
    this.trace.request.model = model;
    this.trace.request.maxTokens = maxTokens;
    this.trace.request.toolChoice = toolChoice;
    this.trace.request.toolName = toolName;
    this.trace.request.promptLengthChars = prompt.length;
    this.trace.request.promptPreviewFirst1000 = prompt.substring(0, 1000);

    if (toolSchema && typeof toolSchema === "object") {
      const schema = toolSchema as Record<string, unknown>;
      const inputSchema = schema.input_schema as Record<string, unknown>;
      if (inputSchema) {
        this.trace.request.toolSchemaSummary.requiredFields = (
          (inputSchema.required as string[]) || []
        ).slice(0, 10);

        const properties = inputSchema.properties as Record<string, unknown>;
        if (properties && properties.candidates) {
          const candSchema = properties.candidates as Record<string, unknown>;
          this.trace.request.toolSchemaSummary.candidatesType =
            (candSchema.type as string) || "unknown";

          if (candSchema.items) {
            const itemSchema = candSchema.items as Record<string, unknown>;
            const itemRequired = (itemSchema.required as string[]) || [];
            this.trace.request.toolSchemaSummary.candidateRequiredFieldCount =
              itemRequired.length;
          }
        }
      }
    }

    if (isFullPayloadEnabled()) {
      this.trace.request = {
        ...this.trace.request,
        fullPrompt: prompt,
      } as unknown as RequestSummary;
    }
  }

  setAnthropicResponse(
    status: number,
    stopReason: string,
    usage: unknown,
    contentBlocks: unknown[]
  ): void {
    this.trace.anthropicResponse.httpStatus = status;
    this.trace.anthropicResponse.stopReason = stopReason;

    if (usage && typeof usage === "object") {
      const u = usage as Record<string, unknown>;
      this.trace.anthropicResponse.usage = {
        input_tokens: u.input_tokens as number | undefined,
        output_tokens: u.output_tokens as number | undefined,
      };
    }

    if (Array.isArray(contentBlocks)) {
      this.trace.anthropicResponse.contentBlockCount = contentBlocks.length;
      this.trace.anthropicResponse.contentBlockTypes = contentBlocks
        .map((c) => (typeof c === "object" && c !== null ? (c as Record<string, unknown>).type : "unknown"))
        .filter((t): t is string => typeof t === "string");

      const textBlock = contentBlocks.find(
        (c) => typeof c === "object" && c !== null && (c as Record<string, unknown>).type === "text"
      ) as Record<string, unknown> | undefined;

      if (textBlock?.text && typeof textBlock.text === "string") {
        this.trace.anthropicResponse.textBlockPreviewFirst1000 = textBlock.text.substring(0, 1000);
      }
    }

    if (isFullPayloadEnabled()) {
      this.trace.anthropicResponse = {
        ...this.trace.anthropicResponse,
        fullContentBlocks: contentBlocks,
      } as unknown as AnthropicResponseSummary;
    }
  }

  setToolUse(
    toolUseBlock: unknown,
    parsedInput?: unknown,
    parseError?: string
  ): void {
    if (!toolUseBlock || typeof toolUseBlock !== "object") return;

    const toolUse = toolUseBlock as Record<string, unknown>;
    this.trace.toolUse.exists = true;
    this.trace.toolUse.name = (toolUse.name as string) || null;
    this.trace.toolUse.inputType = typeof toolUse.input;

    if (typeof toolUse.input === "string") {
      this.trace.toolUse.inputWasString = true;
      this.trace.toolUse.stringParseSucceeded = !parseError;
      if (parseError) {
        this.trace.toolUse.stringParseError = parseError;
      }
    }

    if (parsedInput && typeof parsedInput === "object") {
      const parsed = parsedInput as Record<string, unknown>;
      this.trace.toolUse.topLevelKeys = Object.keys(parsed);

      this.trace.toolUse.candidatesExists = "candidates" in parsed;
      this.trace.toolUse.candidatesType = Array.isArray(parsed.candidates)
        ? "array"
        : typeof parsed.candidates;
      this.trace.toolUse.candidatesIsArray = Array.isArray(parsed.candidates);

      if (Array.isArray(parsed.candidates)) {
        this.trace.toolUse.candidateCount = parsed.candidates.length;

        if (parsed.candidates.length > 0) {
          const c0 = parsed.candidates[0];
          if (c0 && typeof c0 === "object") {
            this.trace.toolUse.candidate0Keys = Object.keys(c0 as Record<string, unknown>);
            this.trace.toolUse.candidate0Summary = {
              ticker: (c0 as Record<string, unknown>).ticker,
              companyName: (c0 as Record<string, unknown>).companyName,
              detailedCategory: (c0 as Record<string, unknown>).detailedCategory,
              radarLens: (c0 as Record<string, unknown>).radarLens,
              trendStatus: (c0 as Record<string, unknown>).trendStatus,
              hasEvidence:
                Array.isArray((c0 as Record<string, unknown>).sourceEvidence) &&
                ((c0 as Record<string, unknown>).sourceEvidence as unknown[]).length > 0,
              evidenceCount: Array.isArray(
                (c0 as Record<string, unknown>).sourceEvidence
              )
                ? ((c0 as Record<string, unknown>).sourceEvidence as unknown[]).length
                : 0,
              hasScore: typeof (c0 as Record<string, unknown>).attentionScore === "number",
            };
          }
        }
      }

      // Check alternate keys
      const altKeys = [
        "results",
        "radarCandidates",
        "opportunities",
        "researchCandidates",
        "output",
        "result",
        "data",
      ];
      this.trace.toolUse.alternateCandidateKeys = altKeys.filter(
        (k) => k in parsed && !this.trace.toolUse.candidatesExists
      );
    }
  }

  setValidation(
    result: ValidationResult<ValidatedRadarScanOutput>
  ): void {
    this.trace.validation.ran = true;
    this.trace.validation.passed = result.success;
    this.trace.validation.errors = result.errors;
  }

  setPersistence(
    started: boolean,
    succeeded: boolean,
    scanId: string | null,
    candidateCount: number,
    evidenceCount: number,
    error?: string | null
  ): void {
    this.trace.persistence.started = started;
    this.trace.persistence.succeeded = succeeded;
    this.trace.persistence.scanId = scanId;
    this.trace.persistence.candidateCount = candidateCount;
    this.trace.persistence.evidenceCount = evidenceCount;
    this.trace.persistence.error = error || null;
  }

  setFinalResult(
    status: "success" | "empty" | "provider_error" | "validation_error" | "persistence_error",
    message: string
  ): void {
    const durationMs = Date.now() - this.startTime;
    this.trace.finalResult = {
      status,
      message,
      durationMs,
    };
  }

  async writeToDisk(): Promise<string | null> {
    if (!isDebugEnabled()) {
      return null;
    }

    try {
      const tmpDir = join(process.cwd(), "tmp", "radar-debug");
      await fs.mkdir(tmpDir, { recursive: true });

      const fileName = `radar-claude-debug-${this.createdAt}-${this.attemptId}.json`;
      const filePath = join(tmpDir, fileName);

      const content = this.safeSerialize(this.trace);
      await fs.writeFile(filePath, content, "utf-8");

      return join("tmp", "radar-debug", fileName);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      console.warn(`[Radar Debug] Failed to write trace file: ${msg}`);
      return null;
    }
  }

  private safeSerialize(obj: unknown): string {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      // Redact actual secrets (API keys, tokens, passwords)
      // But preserve structural diagnostics (e.g., topLevelKeys, alternateCandidateKeys)
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.includes("key") || lowerKey.includes("secret") || lowerKey.includes("token") || lowerKey.includes("password")) &&
        !lowerKey.includes("keys") && // preserve topLevelKeys, alternateCandidateKeys
        !lowerKey.includes("name") // preserve sourceName, provider name
      ) {
        return "[REDACTED]";
      }

      // Handle circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }

      // Handle BigInt
      if (typeof value === "bigint") {
        return value.toString();
      }

      // Handle Error objects
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack:
            isFullPayloadEnabled() && value.stack
              ? value.stack.split("\n").slice(0, 5).join("\n")
              : undefined,
        };
      }

      // Handle undefined (will be excluded from JSON)
      if (value === undefined) {
        return null;
      }

      return value;
    }, 2);
  }
}

export function createRadarDebugTrace(): RadarDebugTraceCollector {
  return new RadarDebugTraceCollector();
}
