import { prisma } from "@/src/lib/db/prisma";

// Retry cooldowns
export const TARGET_COOLDOWN_HAS_TARGET_DAYS = 14;
export const TARGET_COOLDOWN_NO_TARGET_DAYS = 30;
export const TARGET_COOLDOWN_PROVIDER_ERROR_DAYS = 1;
// HTTP 402 = FMP plan does not include price target for this symbol — retry rarely
export const TARGET_COOLDOWN_PLAN_LIMITED_DAYS = 90;

// Run limits
export const MAX_ATTEMPTS_PER_RUN = 40;
export const MAX_TARGETS_FOUND_PER_RUN = 16;
export const CHUNK_SIZE = 10;

/**
 * Returns symbols eligible for target discovery in priority order:
 * 1. not_checked or no StockAnalystData
 * 2. provider_error with targetNextRetryAt <= now
 * 3. has_target older than 14 days (stale)
 * 4. no_target_available with targetNextRetryAt <= now
 * 5. plan_limited with targetNextRetryAt <= now (very low priority — 90-day cooldown)
 */
export async function getEligibleTargetDiscoverySymbols(): Promise<string[]> {
  const now = new Date();

  const members = await prisma.stockUniverseMember.findMany({
    where: {
      isActive: true,
      universe: { slug: "nasdaq-100" },
    },
    include: {
      stock: {
        select: {
          symbol: true,
          analystData: {
            select: {
              targetStatus: true,
              targetNextRetryAt: true,
              targetLastFoundAt: true,
            },
          },
        },
      },
    },
  });

  const staleCutoff = new Date(now.getTime() - TARGET_COOLDOWN_HAS_TARGET_DAYS * 24 * 60 * 60 * 1000);

  const priority1: string[] = [];
  const priority2: string[] = [];
  const priority3: string[] = [];
  const priority4: string[] = [];
  const priority5: string[] = [];

  for (const m of members) {
    const { symbol, analystData } = m.stock;
    if (!analystData || !analystData.targetStatus) {
      priority1.push(symbol);
      continue;
    }
    const { targetStatus, targetNextRetryAt, targetLastFoundAt } = analystData;
    if (targetStatus === "not_checked") {
      priority1.push(symbol);
    } else if (targetStatus === "provider_error") {
      if (!targetNextRetryAt || targetNextRetryAt <= now) {
        priority2.push(symbol);
      }
    } else if (targetStatus === "has_target") {
      if (!targetLastFoundAt || targetLastFoundAt <= staleCutoff) {
        priority3.push(symbol);
      }
    } else if (targetStatus === "no_target_available") {
      if (!targetNextRetryAt || targetNextRetryAt <= now) {
        priority4.push(symbol);
      }
    } else if (targetStatus === "plan_limited") {
      if (!targetNextRetryAt || targetNextRetryAt <= now) {
        priority5.push(symbol);
      }
    }
  }

  return [...priority1, ...priority2, ...priority3, ...priority4, ...priority5];
}
