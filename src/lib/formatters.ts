export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatSignedNumber(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function formatScore(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return Math.round(Number(value)).toString();
}

export function formatMetricPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function formatRatio(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "N/A";
  return Number(value).toFixed(decimals);
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  const n = Number(value);
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
