import type { HotStock } from "@/src/lib/mock-data";
import { formatRatio, formatCurrency, formatCompactCurrency } from "@/src/lib/formatters";
import { buildDecisionSummary, ratingToStars } from "@/src/lib/scoring/decision-summary";

// --- Shared helpers ---

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${Number(v).toFixed(1)}%`;
}

function fmtNum(v: number | null | undefined, decimals = 1): string {
  if (v == null) return "N/A";
  return Number(v).toFixed(decimals);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPrice(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `$${Number(v).toFixed(2)}`;
}

// --- Sub-components ---

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2 overflow-hidden min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-1.5 mb-0.5">
        {title}
      </p>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  value,
  tooltip,
  valueClass,
}: {
  label: string;
  value: string;
  tooltip: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 min-w-0">
      <span className="text-xs text-slate-500 cursor-help shrink-0 leading-snug" title={tooltip}>
        {label}
      </span>
      <span
        className={`text-xs font-medium text-right min-w-0 truncate leading-snug ${valueClass ?? "text-slate-300"} ${value === "N/A" ? "!text-slate-600" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, value, tooltip }: { label: string; value: number | null | undefined; tooltip: string }) {
  const n = value != null ? Math.round(Number(value)) : null;
  const barColor =
    n == null ? "bg-slate-700" :
    n >= 80 ? "bg-emerald-500" :
    n >= 60 ? "bg-emerald-500/60" :
    n >= 40 ? "bg-amber-500" :
    "bg-red-500/70";
  const textColor =
    n == null ? "text-slate-600" :
    n >= 80 ? "text-emerald-300" :
    n >= 60 ? "text-emerald-400/80" :
    n >= 40 ? "text-amber-300" :
    "text-red-400/70";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-28 shrink-0 cursor-help" title={tooltip}>
        {label}
      </span>
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: n != null ? `${n}%` : "0%" }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-7 text-right ${textColor}`}>
        {n != null ? n : "N/A"}
      </span>
    </div>
  );
}

function StarDisplay({ stars }: { stars: number }) {
  if (stars === 0) return <span className="text-slate-600 text-xs">N/A</span>;
  return (
    <span className="flex items-center gap-0.5 text-[14px] leading-none">
      {[1, 2, 3, 4, 5].map((i) => {
        if (stars >= i) return <span key={i} className="text-amber-400">★</span>;
        if (stars >= i - 0.5) {
          return (
            <span
              key={i}
              style={{
                background: "linear-gradient(90deg, #fbbf24 50%, #475569 50%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ★
            </span>
          );
        }
        return <span key={i} className="text-slate-600">★</span>;
      })}
    </span>
  );
}


// --- Main component ---

interface ScannerExpandedRowProps {
  stock: HotStock;
  colSpan: number;
}

export default function ScannerExpandedRow({ stock, colSpan }: ScannerExpandedRowProps) {
  const { strengths, concerns, badge, badgeColor } = buildDecisionSummary(stock);
  const starCount = ratingToStars(stock);

  const week52Pos =
    stock.week52High != null &&
    stock.week52Low != null &&
    stock.week52High !== stock.week52Low
      ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
      : null;

  return (
    <tr className="bg-[#0a0c11]">
      <td colSpan={colSpan} className="px-4 py-5">

        {/* Section 1: Decision Summary + Company Snapshot — stacked rows */}
        <div className="mb-4 bg-slate-900/60 border border-slate-800/80 rounded-lg overflow-hidden">

          {/* Row 1: Decision Tag, Strengths, Concerns */}
          <div className="px-4 py-3 space-y-2.5 min-w-0 border-b border-slate-800/60">
            {/* Decision Tag */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-20 shrink-0 cursor-help"
                title="Rule-based tag derived from Opportunity Score, fundamentals, valuation, analyst upside, stability, and detected concerns. It is not an external analyst rating."
              >
                Decision Tag
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                {badge}
              </span>
            </div>

            {/* Strengths chips */}
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-20 shrink-0 mt-0.5">Strengths</span>
              <div className="flex flex-wrap gap-1.5">
                {strengths.length > 0 ? (
                  strengths.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-600/20 text-emerald-300/90 whitespace-nowrap">
                      <span className="text-emerald-500 leading-none text-[11px]">+</span>{s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-600 italic">None detected</span>
                )}
              </div>
            </div>

            {/* Concerns chips */}
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-20 shrink-0 mt-0.5">Concerns</span>
              <div className="flex flex-wrap gap-1.5">
                {concerns.length > 0 ? (
                  concerns.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-600/20 text-amber-300/90 whitespace-nowrap">
                      <span className="text-amber-500 leading-none text-[11px]">−</span>{c}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/60 border border-slate-700/30 text-slate-500 whitespace-nowrap">
                    No major concerns detected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Company Snapshot — full width, meta left + description right */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Company Snapshot
            </p>
            <div className="flex items-start gap-6 min-w-0">
              {/* Left: identity (fixed width, compact) */}
              <div className="w-52 shrink-0 space-y-1">
                <div className="text-xs text-slate-200 font-medium leading-tight truncate" title={stock.name}>
                  {stock.name}
                </div>
                {(stock.sector || stock.industry) && (
                  <div className="text-[11px] text-slate-500 truncate">
                    {[stock.sector, stock.industry].filter(Boolean).join(" · ")}
                  </div>
                )}
                {stock.marketCapFull != null && (
                  <div className="text-[11px]">
                    <span className="text-slate-600">Mkt Cap </span>
                    <span className="text-slate-400 font-medium">{formatCompactCurrency(stock.marketCapFull)}</span>
                  </div>
                )}
              </div>

              {/* Right: description — takes remaining width, 3-line clamp */}
              <div className="flex-1 min-w-0">
                {stock.description ? (
                  <p
                    className="text-[11px] text-slate-400 leading-relaxed"
                    style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    title={stock.description}
                  >
                    {stock.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600 italic">Description not available</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sections 2–8 in grid — max 4 columns so cards are wide enough to display values cleanly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* Section 2: Our Calculated Scores — spans 2 columns for wider score bars */}
          <div className="sm:col-span-2 lg:col-span-2">
            <SectionCard title="Our Calculated Scores">
              <p className="text-[10px] text-slate-600 -mt-1 mb-1">Internal scores calculated by FomoFilter from synced financial, market, analyst, and stability data.</p>
              <div className="space-y-1.5">
                <ScoreBar
                  label="Opportunity"
                  value={stock.oppScore}
                  tooltip="Opportunity Score v2. Combines fundamental quality, valuation, growth, analyst upside, analyst sentiment, price position, and stability. Higher is better."
                />
                <ScoreBar
                  label="Fundamental"
                  value={stock.fundamentalScore}
                  tooltip="Internal Fundamental Score based on growth, profitability, valuation, financial health, and stability inputs. Higher is better."
                />
                <ScoreBar
                  label="Growth"
                  value={stock.growthScore}
                  tooltip="Score for revenue and earnings growth trajectory. Higher means stronger growth metrics."
                />
                <ScoreBar
                  label="Profitability"
                  value={stock.profitabilityScore}
                  tooltip="Score for profitability including margins, ROE, and ROA. Higher means better profitability."
                />
                <ScoreBar
                  label="Valuation"
                  value={stock.valuationScore}
                  tooltip="Score for how reasonably valued the stock is based on P/E, P/S, EV/EBITDA, and PEG. Higher means more reasonable valuation."
                />
                <ScoreBar
                  label="Financial Health"
                  value={stock.financialHealthScore}
                  tooltip="Score for balance sheet and liquidity strength. Higher means stronger financial health."
                />
                <ScoreBar
                  label="Stability"
                  value={stock.riskContextScore}
                  tooltip="Stability Score measures the stock's risk context. Higher is better: a higher score generally means lower volatility/risk context based mainly on beta and related risk inputs."
                />
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 space-y-0.5">
                <MetricRow
                  label="Score Version"
                  value={stock.scoreVersion ?? "N/A"}
                  tooltip="Version of the Fundamental Score calculation formula."
                />
                <MetricRow
                  label="Fundamental Calc"
                  value={fmtDate(stock.scoreLastCalculated)}
                  tooltip="Date when Fundamental Score was last calculated by FomoFilter."
                />
                <MetricRow
                  label="Opp. Version"
                  value={stock.oppScoreVersion ?? "N/A"}
                  tooltip="Version of the Opportunity Score calculation formula."
                />
                <MetricRow
                  label="Opportunity Calc"
                  value={fmtDate(stock.oppCalculatedAt)}
                  tooltip="Date when Opportunity Score v2 was last calculated by FomoFilter."
                />
              </div>
            </SectionCard>
          </div>

          {/* Section 3: Analyst View */}
          <div>
            <SectionCard title="Analyst View">
              {/* Stars + value + label */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <StarDisplay stars={starCount} />
                {starCount > 0 && (
                  <span className="text-xs tabular-nums text-slate-400">{starCount.toFixed(1)}</span>
                )}
                {starCount > 0 && <span className="text-slate-600 text-xs">·</span>}
                {stock.analystRatingNormalized ? (
                  <span className={`text-xs font-semibold ${
                    stock.analystRatingNormalized === "Strong Buy" ? "text-emerald-300" :
                    stock.analystRatingNormalized === "Buy" ? "text-emerald-400/70" :
                    stock.analystRatingNormalized === "Hold" ? "text-amber-400" :
                    stock.analystRatingNormalized === "Sell" ? "text-red-400/70" :
                    stock.analystRatingNormalized === "Strong Sell" ? "text-red-400" :
                    "text-slate-400"
                  }`}>{stock.analystRatingNormalized}</span>
                ) : (
                  <span className="text-slate-600 text-xs">No rating</span>
                )}
              </div>
              <MetricRow
                label="Analysts"
                value={stock.analystCount != null ? String(stock.analystCount) : "N/A"}
                tooltip="Number of analysts providing recommendations."
              />
              <MetricRow
                label="Consensus Target"
                value={fmtPrice(stock.analystTargetPrice)}
                tooltip="Consensus (mean) analyst price target from FMP."
                valueClass={stock.analystUpsidePercent != null && stock.analystUpsidePercent > 0 ? "text-emerald-300" : undefined}
              />
              <MetricRow
                label="Analyst Upside"
                value={stock.analystUpsidePercent != null
                  ? `${stock.analystUpsidePercent >= 0 ? "+" : ""}${Number(stock.analystUpsidePercent).toFixed(1)}%`
                  : "N/A"}
                tooltip="Percentage difference between current price and consensus target price. Higher means analysts see more upside."
                valueClass={stock.analystUpsidePercent != null
                  ? (stock.analystUpsidePercent >= 0 ? "text-emerald-400" : "text-red-400")
                  : undefined}
              />
              <MetricRow
                label="Target High"
                value={fmtPrice(stock.analystTargetHigh)}
                tooltip="Highest analyst price target."
              />
              <MetricRow
                label="Target Median"
                value={fmtPrice(stock.analystTargetMedian)}
                tooltip="Median analyst price target."
              />
              <MetricRow
                label="Target Low"
                value={fmtPrice(stock.analystTargetLow)}
                tooltip="Lowest analyst price target."
              />
              <MetricRow
                label="Analyst Synced"
                value={fmtDate(stock.analystLastSyncedAt)}
                tooltip="Date when analyst data was last synced from providers."
              />
              <MetricRow
                label="Source"
                value={stock.analystSource ?? "N/A"}
                tooltip="Data provider for analyst data."
              />
            </SectionCard>
          </div>

          {/* Section 4: Valuation Metrics */}
          <div>
            <SectionCard title="Valuation Metrics">
              <MetricRow
                label="P/E"
                value={formatRatio(stock.peRatio)}
                tooltip="Price-to-Earnings ratio TTM. Lower generally means cheaper relative to earnings."
              />
              <MetricRow
                label="Forward P/E"
                value={formatRatio(stock.forwardPE)}
                tooltip="Price-to-Forward-Earnings estimate. Lower generally means cheaper relative to expected earnings."
              />
              <MetricRow
                label="PEG"
                value={formatRatio(stock.pegRatio, 2)}
                tooltip="Price/Earnings-to-Growth ratio. Values near or below 1 may indicate reasonable valuation relative to growth."
              />
              <MetricRow
                label="Forward PEG"
                value={formatRatio(stock.forwardPEG, 2)}
                tooltip="Forward PEG ratio based on forward earnings estimate."
              />
              <MetricRow
                label="P/S"
                value={formatRatio(stock.ps, 2)}
                tooltip="Price-to-Sales ratio TTM. Lower may indicate more reasonable valuation relative to revenue."
              />
              <MetricRow
                label="P/B"
                value={formatRatio(stock.pb, 2)}
                tooltip="Price-to-Book ratio. Lower may indicate stock is cheaper relative to book value."
              />
              <MetricRow
                label="EV/EBITDA"
                value={formatRatio(stock.evToEbitda, 1)}
                tooltip="Enterprise Value to EBITDA. A lower value often indicates more reasonable valuation."
              />
            </SectionCard>
          </div>

          {/* Section 5: Growth & Profitability — spans 2 columns to prevent % value wrapping */}
          <div className="sm:col-span-2 lg:col-span-2">
            <SectionCard title="Growth &amp; Profitability">
              <MetricRow
                label="Revenue Growth TTM"
                value={fmtPct(stock.revenueGrowth)}
                tooltip="Year-over-year revenue growth for the trailing twelve months."
                valueClass={stock.revenueGrowth != null ? (stock.revenueGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
              />
              <MetricRow
                label="EPS Growth TTM"
                value={fmtPct(stock.epsGrowth)}
                tooltip="Year-over-year earnings per share growth for the trailing twelve months."
                valueClass={stock.epsGrowth != null ? (stock.epsGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
              />
              <MetricRow
                label="Revenue Growth 3Y"
                value={fmtPct(stock.revenueGrowth3Y)}
                tooltip="3-year compound annual revenue growth rate."
                valueClass={stock.revenueGrowth3Y != null ? (stock.revenueGrowth3Y >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
              />
              <MetricRow
                label="EPS Growth 3Y"
                value={fmtPct(stock.epsGrowth3Y)}
                tooltip="3-year compound annual EPS growth rate."
                valueClass={stock.epsGrowth3Y != null ? (stock.epsGrowth3Y >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
              />
              <MetricRow
                label="Gross Margin"
                value={fmtPct(stock.grossMargin)}
                tooltip="Gross profit as a percentage of revenue. Higher means better gross profitability."
              />
              <MetricRow
                label="Operating Margin"
                value={fmtPct(stock.operatingMargin)}
                tooltip="Operating profit as a percentage of revenue. Higher means more operational efficiency."
              />
              <MetricRow
                label="Net Margin"
                value={fmtPct(stock.netMargin)}
                tooltip="Net profit as a percentage of revenue. Higher means more bottom-line profitability."
              />
              <MetricRow
                label="ROE"
                value={stock.roe != null ? `${fmtNum(stock.roe)}%` : "N/A"}
                tooltip="Return on Equity — net income divided by shareholders' equity. Higher generally means better use of equity capital."
              />
              <MetricRow
                label="ROA"
                value={stock.roa != null ? `${fmtNum(stock.roa)}%` : "N/A"}
                tooltip="Return on Assets — net income divided by total assets. Higher generally means better asset efficiency."
              />
            </SectionCard>
          </div>

          {/* Section 6: Financial Health */}
          <div>
            <SectionCard title="Financial Health">
              <MetricRow
                label="Debt / Equity"
                value={formatRatio(stock.debtToEquity, 2)}
                tooltip="Total debt divided by shareholders' equity. Lower generally means less leverage."
              />
              <MetricRow
                label="Current Ratio"
                value={stock.currentRatio != null ? fmtNum(stock.currentRatio) : "N/A"}
                tooltip="Current assets divided by current liabilities. A ratio above 1 generally indicates good short-term liquidity."
              />
              <MetricRow
                label="Quick Ratio"
                value={stock.quickRatio != null ? fmtNum(stock.quickRatio) : "N/A"}
                tooltip="Like current ratio but excluding inventory. A ratio above 1 generally indicates strong liquidity."
              />
              <MetricRow
                label="Interest Coverage"
                value={stock.interestCoverage != null ? `${fmtNum(stock.interestCoverage)}x` : "N/A"}
                tooltip="EBIT divided by interest expense. Higher means the company can more easily cover its interest payments."
              />
            </SectionCard>

            {/* Section 7: Market Position */}
            <div className="mt-3">
              <SectionCard title="Market Position">
                <MetricRow
                  label="Current Price"
                  value={formatCurrency(stock.price)}
                  tooltip="Latest synced market price from FMP Daily Market Data Sync."
                />
                <MetricRow
                  label="Day %"
                  value={fmtPct(stock.change)}
                  tooltip="Daily percentage change from the latest synced quote."
                  valueClass={stock.change >= 0 ? "text-emerald-400" : "text-red-400"}
                />
                <MetricRow
                  label="52W High"
                  value={fmtPrice(stock.week52High)}
                  tooltip="52-week price high from FMP quote data."
                />
                <MetricRow
                  label="52W Low"
                  value={fmtPrice(stock.week52Low)}
                  tooltip="52-week price low from FMP quote data."
                />
                <MetricRow
                  label="Price Avg 50"
                  value={fmtPrice(stock.priceAvg50)}
                  tooltip="50-day simple moving average from FMP quote data."
                />
                <MetricRow
                  label="Price Avg 200"
                  value={fmtPrice(stock.priceAvg200)}
                  tooltip="200-day simple moving average from FMP quote data."
                />
                <MetricRow
                  label="Beta"
                  value={stock.beta != null ? Number(stock.beta).toFixed(2) : "N/A"}
                  tooltip="Beta measures stock volatility relative to the market. Higher beta generally means higher volatility."
                />
                {week52Pos != null && (
                  <div className="mt-1 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 cursor-help w-28 shrink-0" title="Current price position within the 52-week range. 100% = at 52-week high, 0% = at 52-week low.">
                        52W Position
                      </span>
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500/60"
                          style={{ width: `${Math.min(100, Math.max(0, week52Pos))}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums w-9 text-right">
                        {week52Pos.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          {/* Section 8: Data Freshness */}
          <div>
            <SectionCard title="Data Freshness">
              <MetricRow
                label="Quote Synced"
                value={fmtDate(stock.quoteLastSynced)}
                tooltip="Date when price quote data was last synced from FMP."
              />
              <MetricRow
                label="Quote Source"
                value={stock.quoteSource ?? "N/A"}
                tooltip="Data provider for price quote (FMP)."
              />
              <MetricRow
                label="Metrics Synced"
                value={fmtDate(stock.metricsLastSynced)}
                tooltip="Date when fundamental metrics were last synced."
              />
              <MetricRow
                label="Metrics Source"
                value={stock.metricsSource ?? "N/A"}
                tooltip="Data provider for fundamental metrics (FMP)."
              />
              <MetricRow
                label="Analyst Synced"
                value={fmtDate(stock.analystLastSyncedAt)}
                tooltip="Date when analyst data (targets and recommendations) was last synced."
              />
              <MetricRow
                label="Analyst Source"
                value={stock.analystSource ?? "N/A"}
                tooltip="Data provider for analyst data (FMP + Finnhub)."
              />
              <MetricRow
                label="Opp. Calculated"
                value={fmtDate(stock.oppCalculatedAt)}
                tooltip="Date when Opportunity Score v2 was last calculated by FomoFilter."
              />
              <MetricRow
                label="Fund. Calculated"
                value={fmtDate(stock.scoreLastCalculated)}
                tooltip="Date when Fundamental Score was last calculated by FomoFilter."
              />
            </SectionCard>
          </div>

        </div>
      </td>
    </tr>
  );
}
