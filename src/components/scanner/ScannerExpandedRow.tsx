import type { HotStock } from "@/src/lib/mock-data";
import { formatRatio, formatMetricPercent, formatScore } from "@/src/lib/formatters";

function MetricItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs tabular-nums font-medium ${highlight ? "text-emerald-300" : "text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">{title}</p>
      <div className="divide-y divide-slate-800/60">{children}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const n = value != null ? Math.round(Number(value)) : null;
  const color = n == null ? "bg-slate-700" : n >= 75 ? "bg-emerald-500" : n >= 55 ? "bg-amber-500" : n >= 40 ? "bg-slate-500" : "bg-red-500/70";
  const textColor = n == null ? "text-slate-600" : n >= 75 ? "text-emerald-300" : n >= 55 ? "text-amber-300" : "text-slate-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: n != null ? `${n}%` : "0%" }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${textColor}`}>
        {n != null ? n : "N/A"}
      </span>
    </div>
  );
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function fmtRatio(v: number | null | undefined, decimals = 1): string {
  if (v == null) return "N/A";
  return Number(v).toFixed(decimals) + "x";
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ScannerExpandedRowProps {
  stock: HotStock;
  colSpan: number;
}

export default function ScannerExpandedRow({ stock, colSpan }: ScannerExpandedRowProps) {
  return (
    <tr className="bg-[#0d0f14]/80">
      <td colSpan={colSpan} className="px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-6">

          {/* Score Breakdown */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Section title="Opportunity Score">
              <div className="space-y-2 pt-1">
                <ScoreBar label="Opportunity" value={stock.oppScore} />
              </div>
              {stock.oppScore != null && (
                <p className="text-[10px] text-slate-600 mt-1.5">
                  Combines fundamental quality (35%), valuation (30%), growth (20%), risk/context (10%), and 52W price position (5%).
                </p>
              )}
              {stock.oppScore == null && (
                <p className="text-[10px] text-amber-600 mt-1.5">
                  Run &quot;Calculate Opportunity Scores&quot; in Admin Sync to populate.
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5">
                <MetricItem label="Opp. Version" value={stock.oppScoreVersion ?? "N/A"} />
                <MetricItem label="Opp. Calc At" value={fmtDate(stock.oppCalculatedAt)} />
              </div>
            </Section>
            <div className="mt-3">
              <Section title="Fundamental Score">
                <div className="space-y-2 pt-1">
                  <ScoreBar label="Fundamental" value={stock.fundamentalScore} />
                  <ScoreBar label="Growth" value={stock.growthScore} />
                  <ScoreBar label="Profitability" value={stock.profitabilityScore} />
                  <ScoreBar label="Valuation" value={stock.valuationScore} />
                  <ScoreBar label="Financial Health" value={stock.financialHealthScore} />
                  <ScoreBar label="Risk / Context" value={stock.riskContextScore} />
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5">
                  <MetricItem label="Score Version" value={stock.scoreVersion ?? "N/A"} />
                  <MetricItem label="Last Calculated" value={fmtDate(stock.scoreLastCalculated)} />
                </div>
              </Section>
            </div>
          </div>

          {/* Growth & Profitability */}
          <div>
            <Section title="Growth">
              <MetricItem label="Revenue Growth TTM" value={fmtPct(stock.revenueGrowth)} />
              <MetricItem label="EPS Growth TTM" value={fmtPct(stock.epsGrowth)} />
              <MetricItem label="Revenue Growth 3Y" value={fmtPct(stock.revenueGrowth3Y)} />
              <MetricItem label="EPS Growth 3Y" value={fmtPct(stock.epsGrowth3Y)} />
            </Section>
            <div className="mt-3">
              <Section title="Profitability">
                <MetricItem label="Gross Margin" value={fmtPct(stock.grossMargin)} />
                <MetricItem label="Operating Margin" value={fmtPct(stock.operatingMargin)} />
                <MetricItem label="Net Margin" value={fmtPct(stock.netMargin)} />
                <MetricItem label="ROE" value={stock.roe != null ? `${stock.roe.toFixed(1)}%` : "N/A"} />
                <MetricItem label="ROA" value={stock.roa != null ? `${stock.roa.toFixed(1)}%` : "N/A"} />
              </Section>
            </div>
          </div>

          {/* Valuation */}
          <div>
            <Section title="Valuation">
              <MetricItem label="P/E" value={formatRatio(stock.peRatio)} />
              <MetricItem label="Forward P/E" value={formatRatio(stock.forwardPE)} />
              <MetricItem label="PEG" value={formatRatio(stock.pegRatio, 2)} />
              <MetricItem label="Forward PEG" value={formatRatio(stock.forwardPEG, 2)} />
              <MetricItem label="P/S" value={formatRatio(stock.ps, 2)} />
              <MetricItem label="P/B" value={formatRatio(stock.pb, 2)} />
              <MetricItem label="EV/EBITDA" value={formatRatio(stock.evToEbitda, 1)} />
            </Section>
          </div>

          {/* Financial Health & Data Freshness */}
          <div>
            <Section title="Financial Health">
              <MetricItem label="Debt / Equity" value={formatRatio(stock.debtToEquity, 2)} />
              <MetricItem label="Current Ratio" value={fmtRatio(stock.currentRatio)} />
              <MetricItem label="Quick Ratio" value={fmtRatio(stock.quickRatio)} />
              <MetricItem label="Interest Coverage" value={fmtRatio(stock.interestCoverage)} />
            </Section>
            <div className="mt-3">
              <Section title="Context">
                <MetricItem label="Beta" value={stock.beta != null ? Number(stock.beta).toFixed(2) : "N/A"} />
              </Section>
            </div>
            <div className="mt-3">
              <Section title="Data Freshness">
                <MetricItem label="Quote Synced" value={fmtDate(stock.quoteLastSynced)} />
                <MetricItem label="Quote Source" value={stock.quoteSource ?? "N/A"} />
                <MetricItem label="Metrics Synced" value={fmtDate(stock.metricsLastSynced)} />
                <MetricItem label="Metrics Source" value={stock.metricsSource ?? "N/A"} />
                <MetricItem label="Analyst Synced" value={fmtDate(stock.analystLastSyncedAt)} />
                <MetricItem label="Analyst Source" value={stock.analystSource ?? "N/A"} />
              </Section>
            </div>
          </div>

          {/* Analyst Data */}
          <div>
            <Section title="Analyst Data">
              <MetricItem
                label="Target Price"
                value={stock.analystTargetPrice != null ? `$${Number(stock.analystTargetPrice).toFixed(2)}` : "N/A"}
                highlight={stock.analystUpsidePercent != null && stock.analystUpsidePercent > 0}
              />
              <MetricItem
                label="Upside %"
                value={stock.analystUpsidePercent != null
                  ? `${stock.analystUpsidePercent >= 0 ? "+" : ""}${Number(stock.analystUpsidePercent).toFixed(1)}%`
                  : "N/A"}
                highlight={stock.analystUpsidePercent != null && stock.analystUpsidePercent > 0}
              />
              <MetricItem label="Rating" value={stock.analystRatingNormalized ?? "N/A"} />
              <MetricItem label="Analysts" value={stock.analystCount != null ? String(stock.analystCount) : "N/A"} />
              <MetricItem
                label="Target High"
                value={stock.analystTargetHigh != null ? `$${Number(stock.analystTargetHigh).toFixed(2)}` : "N/A"}
              />
              <MetricItem
                label="Target Low"
                value={stock.analystTargetLow != null ? `$${Number(stock.analystTargetLow).toFixed(2)}` : "N/A"}
              />
            </Section>
          </div>

        </div>
      </td>
    </tr>
  );
}
