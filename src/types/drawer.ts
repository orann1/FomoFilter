export type DrawerAction = "add-watchlist" | "edit-watchlist" | "create-alert" | null;

export type WatchStatusLocal = "Watching" | "Waiting" | "Ready to Buy";

export type LocalWatchlistEntry = {
  watchlist: string;
  reason: string;
  status: WatchStatusLocal;
  entryZoneLow: string;
  entryZoneHigh: string;
  target: string;
  stopLoss: string;
};

export type AlertTypeLocal =
  | "Price Above"
  | "Price Below"
  | "Opportunity Score Above"
  | "Relative Volume Above";

export type AlertFrequencyLocal = "Once" | "Daily" | "Always";
