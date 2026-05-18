"use server";

import { prisma } from "@/src/lib/db/prisma";
import { getCurrentUserForDemo } from "@/src/lib/data/current-user";
import {
  addToWatchlistSchema,
  editWatchlistSchema,
  createAlertSchema,
  removeFromWatchlistSchema,
  type AddToWatchlistInput,
  type EditWatchlistInput,
  type CreateAlertInput,
  type RemoveFromWatchlistInput,
} from "@/src/lib/validation/drawer-actions";
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function mapLocalStatus(status: string) {
  switch (status) {
    case "Waiting":
      return "WAITING" as const;
    case "Ready to Buy":
      return "READY_TO_BUY" as const;
    default:
      return "WATCHING" as const;
  }
}

function mapAlertType(type: string) {
  switch (type) {
    case "Price Below":
      return "PRICE_BELOW" as const;
    case "Hot Score Above":
      return "HOT_SCORE_ABOVE" as const;
    case "Opportunity Score Above":
      return "OPPORTUNITY_SCORE_ABOVE" as const;
    case "Relative Volume Above":
      return "RELATIVE_VOLUME_ABOVE" as const;
    default:
      return "PRICE_ABOVE" as const;
  }
}

function mapAlertFrequency(freq: string) {
  switch (freq) {
    case "Daily":
      return "DAILY" as const;
    case "Always":
      return "ALWAYS" as const;
    default:
      return "ONCE" as const;
  }
}

function toDecimalOrNull(val: string | undefined) {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export async function addStockToWatchlist(
  input: AddToWatchlistInput
): Promise<ActionResult> {
  const parsed = addToWatchlistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const user = await getCurrentUserForDemo();
    const stock = await prisma.stock.findUnique({ where: { symbol: parsed.data.symbol } });
    if (!stock) return { success: false, error: "Stock not found." };

    await prisma.watchlistItem.upsert({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
      create: {
        userId: user.id,
        stockId: stock.id,
        status: mapLocalStatus(parsed.data.status),
        reason: parsed.data.reason,
        entryZoneLow: toDecimalOrNull(parsed.data.entryZoneLow),
        entryZoneHigh: toDecimalOrNull(parsed.data.entryZoneHigh),
        target: toDecimalOrNull(parsed.data.target),
        stopLoss: toDecimalOrNull(parsed.data.stopLoss),
      },
      update: {
        status: mapLocalStatus(parsed.data.status),
        reason: parsed.data.reason,
        entryZoneLow: toDecimalOrNull(parsed.data.entryZoneLow),
        entryZoneHigh: toDecimalOrNull(parsed.data.entryZoneHigh),
        target: toDecimalOrNull(parsed.data.target),
        stopLoss: toDecimalOrNull(parsed.data.stopLoss),
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Could not add stock to watchlist." };
  }
}

export async function updateWatchlistItem(
  input: EditWatchlistInput
): Promise<ActionResult> {
  const parsed = editWatchlistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const user = await getCurrentUserForDemo();
    const stock = await prisma.stock.findUnique({ where: { symbol: parsed.data.symbol } });
    if (!stock) return { success: false, error: "Stock not found." };

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
    });
    if (!existing) return { success: false, error: "Watchlist item not found." };

    await prisma.watchlistItem.update({
      where: { id: existing.id },
      data: {
        status: mapLocalStatus(parsed.data.status),
        reason: parsed.data.reason ?? existing.reason,
        entryZoneLow: toDecimalOrNull(parsed.data.entryZoneLow) ?? existing.entryZoneLow,
        entryZoneHigh: toDecimalOrNull(parsed.data.entryZoneHigh) ?? existing.entryZoneHigh,
        target: toDecimalOrNull(parsed.data.target) ?? existing.target,
        stopLoss: toDecimalOrNull(parsed.data.stopLoss) ?? existing.stopLoss,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Could not update watchlist item." };
  }
}

export async function removeStockFromWatchlist(
  input: RemoveFromWatchlistInput
): Promise<ActionResult> {
  const parsed = removeFromWatchlistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const user = await getCurrentUserForDemo();
    const stock = await prisma.stock.findUnique({ where: { symbol: parsed.data.symbol } });
    if (!stock) return { success: false, error: "Stock not found." };

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
    });
    if (!existing) return { success: false, error: "Watchlist item not found." };

    await prisma.watchlistItem.delete({ where: { id: existing.id } });

    return { success: true };
  } catch {
    return { success: false, error: "Could not remove stock from watchlist." };
  }
}

export async function createAlertRule(
  input: CreateAlertInput
): Promise<ActionResult> {
  const parsed = createAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const threshold = parseFloat(parsed.data.threshold);
  if (isNaN(threshold)) {
    return { success: false, error: "Threshold must be a valid number." };
  }

  try {
    const user = await getCurrentUserForDemo();
    const stock = await prisma.stock.findUnique({ where: { symbol: parsed.data.symbol } });
    if (!stock) return { success: false, error: "Stock not found." };

    await prisma.alertRule.create({
      data: {
        userId: user.id,
        stockId: stock.id,
        type: mapAlertType(parsed.data.type),
        threshold,
        frequency: mapAlertFrequency(parsed.data.frequency),
        notifyVia: "in-app",
        isActive: true,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Could not create alert." };
  }
}
