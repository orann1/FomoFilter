import { z } from "zod";

export const addToWatchlistSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  reason: z.string().min(1, "Reason for tracking is required"),
  status: z.enum(["Watching", "Waiting", "Ready to Buy"]),
  entryZoneLow: z.string().optional(),
  entryZoneHigh: z.string().optional(),
  target: z.string().optional(),
  stopLoss: z.string().optional(),
});

export const editWatchlistSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  status: z.enum(["Watching", "Waiting", "Ready to Buy"]),
  reason: z.string().optional(),
  entryZoneLow: z.string().optional(),
  entryZoneHigh: z.string().optional(),
  target: z.string().optional(),
  stopLoss: z.string().optional(),
});

export const createAlertSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum([
    "Price Above",
    "Price Below",
    "Hot Score Above",
    "Opportunity Score Above",
    "Relative Volume Above",
  ]),
  threshold: z.string().min(1, "Threshold is required"),
  frequency: z.enum(["Once", "Daily", "Always"]),
});

export const removeFromWatchlistSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
});

export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;
export type EditWatchlistInput = z.infer<typeof editWatchlistSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type RemoveFromWatchlistInput = z.infer<typeof removeFromWatchlistSchema>;
