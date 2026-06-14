"use server";

import { prisma } from "@/src/lib/db/prisma";
import { validateRadarConfigInput, loadEffectiveRadarConfig } from "@/src/lib/opportunity-radar/radar-ai-config";

export type SaveRadarConfigResult = {
  success: boolean;
  configId?: string;
  error?: string;
  errors?: string[];
};

export async function saveRadarConfigAction(input: {
  configId?: string;
  promptTemplate?: string;
  maxTokens?: number;
  dbContextLimit?: number;
  candidateLimit?: number;
  model?: string;
  debugTraceEnabled?: boolean;
  changeNotes?: string;
  promptVersion?: string;
  schemaVersion?: string;
}): Promise<SaveRadarConfigResult> {
  try {
    // Validate inputs
    const validation = validateRadarConfigInput({
      promptTemplate: input.promptTemplate,
      maxTokens: input.maxTokens,
      dbContextLimit: input.dbContextLimit,
      candidateLimit: input.candidateLimit,
    });

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Determine if we're updating an existing config or creating a new one
    let configId = input.configId;

    if (configId) {
      // Update existing config
      const updateData: Record<string, unknown> = {};

      if (input.promptTemplate !== undefined) {
        updateData.promptTemplate = input.promptTemplate;
      }
      if (input.maxTokens !== undefined) {
        updateData.maxTokens = input.maxTokens;
      }
      if (input.dbContextLimit !== undefined) {
        updateData.dbContextLimit = input.dbContextLimit;
      }
      if (input.candidateLimit !== undefined) {
        updateData.candidateLimit = input.candidateLimit;
      }
      if (input.debugTraceEnabled !== undefined) {
        updateData.debugTraceEnabled = input.debugTraceEnabled;
      }
      if (input.model !== undefined) {
        updateData.model = input.model;
      }
      if (input.changeNotes !== undefined) {
        updateData.changeNotes = input.changeNotes;
      }
      if (input.promptVersion !== undefined) {
        updateData.promptVersion = input.promptVersion;
      }
      if (input.schemaVersion !== undefined) {
        updateData.schemaVersion = input.schemaVersion;
      }

      const updated = await prisma.radarAiConfig.update({
        where: { id: configId },
        data: updateData,
      });

      return {
        success: true,
        configId: updated.id,
      };
    } else {
      // Create new config (shouldn't happen in this phase, but support it for completeness)
      const created = await prisma.radarAiConfig.create({
        data: {
          name: "Radar AI Config",
          promptTemplate: input.promptTemplate || "",
          maxTokens: input.maxTokens || 8192,
          dbContextLimit: input.dbContextLimit || 20,
          candidateLimit: input.candidateLimit || 10,
          model: input.model || "claude-sonnet-4-6",
          debugTraceEnabled: input.debugTraceEnabled || false,
          changeNotes: input.changeNotes,
        },
      });

      return {
        success: true,
        configId: created.id,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to save config: ${message}`,
    };
  }
}

export type GetRadarConfigResult = {
  success: boolean;
  config?: {
    id: string;
    name: string;
    isActive: boolean;
    promptTemplate: string;
    maxTokens: number;
    dbContextLimit: number;
    candidateLimit: number;
    model: string;
    debugTraceEnabled: boolean;
    promptVersion: string;
    schemaVersion: string;
    changeNotes?: string;
  };
  error?: string;
};

export async function getRadarConfigAction(): Promise<GetRadarConfigResult> {
  try {
    // Get the active config, or the most recent one
    const config = await prisma.radarAiConfig.findFirst({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 1,
    });

    if (!config) {
      return {
        success: false,
        error: "No Radar AI config found",
      };
    }

    return {
      success: true,
      config: {
        id: config.id,
        name: config.name,
        isActive: config.isActive,
        promptTemplate: config.promptTemplate,
        maxTokens: config.maxTokens,
        dbContextLimit: config.dbContextLimit,
        candidateLimit: config.candidateLimit,
        model: config.model,
        debugTraceEnabled: config.debugTraceEnabled,
        promptVersion: config.promptVersion,
        schemaVersion: config.schemaVersion,
        changeNotes: config.changeNotes || undefined,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to get config: ${message}`,
    };
  }
}

export async function getEffectiveRadarConfigAction() {
  try {
    const config = await loadEffectiveRadarConfig();
    return { success: true, config };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
