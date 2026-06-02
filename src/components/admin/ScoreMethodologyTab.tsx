"use client";

import { BookOpen, TrendingUp, DollarSign, Shield, BarChart3, Activity, Info, AlertTriangle } from "lucide-react";
import { SCORE_VERSION } from "@/src/lib/scoring/fundamental-score";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TableHeader({ headers }: { headers: string[] }) {
  return (
    <thead>
      <tr className="border-b border-slate-700">
        {headers.map((h) => (
          <th key={h} className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-left">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

const METRIC_ROWS = [
  // Growth
  { metric: "Revenue Growth TTM YoY", category: "Growth", source: "revenueGrowthTTMYoy", direction: "Higher is better", rule: "≥25% → 10, 15-25% → 8, 8-15% → 6, 0-8% → 4, <0% → 1", notes: "" },
  { metric: "EPS Growth TTM YoY", category: "Growth", source: "epsGrowthTTMYoy", direction: "Higher is better", rule: "≥25% → 10, 15-25% → 8, 8-15% → 6, 0-8% → 4, <0% → 1", notes: "" },
  { metric: "Revenue Growth 3Y", category: "Growth", source: "revenueGrowth3Y", direction: "Higher is better", rule: "≥25% → 10, 15-25% → 8, 8-15% → 6, 0-8% → 4, <0% → 1", notes: "" },
  { metric: "EPS Growth 3Y", category: "Growth", source: "epsGrowth3Y", direction: "Higher is better", rule: "≥25% → 10, 15-25% → 8, 8-15% → 6, 0-8% → 4, <0% → 1", notes: "" },
  // Profitability
  { metric: "Gross Margin TTM", category: "Profitability", source: "grossMarginTTM", direction: "Higher is better", rule: "≥30% → 10, 20-30% → 8, 12-20% → 6, 5-12% → 4, 0-5% → 2, <0% → 0", notes: "" },
  { metric: "Operating Margin TTM", category: "Profitability", source: "operatingMarginTTM", direction: "Higher is better", rule: "≥25% → 10, 15-25% → 8, 8-15% → 6, 0-8% → 3, <0% → 0", notes: "" },
  { metric: "Net Profit Margin TTM", category: "Profitability", source: "netProfitMarginTTM", direction: "Higher is better", rule: "≥20% → 10, 12-20% → 8, 6-12% → 6, 0-6% → 3, <0% → 0", notes: "" },
  { metric: "ROE TTM", category: "Profitability", source: "roeTTM", direction: "Higher is better, capped", rule: "≥30% → 10, 20-30% → 8, 12-20% → 6, 5-12% → 3, 0-5% → 1, <0% → 0", notes: "Capped at 60% for scoring. Buyback-heavy companies can show extreme ROE." },
  { metric: "ROA TTM", category: "Profitability", source: "roaTTM", direction: "Higher is better", rule: "≥15% → 10, 10-15% → 8, 6-10% → 6, 3-6% → 4, 0-3% → 2, <0% → 0", notes: "" },
  // Financial Health
  { metric: "Debt / Equity", category: "Financial Health", source: "totalDebtToEquityAnnual", direction: "Lower is better", rule: "0-0.5 → 10, 0.5-1.0 → 8, 1.0-2.0 → 5, 2.0-4.0 → 2, >4.0 → 0", notes: "Negative D/E (negative equity) scores 5 — unusual, not penalized heavily." },
  { metric: "Current Ratio", category: "Financial Health", source: "currentRatioAnnual", direction: "Ideal range", rule: "1.5-3.0 → 10, 1.0-1.5 → 7, 3.0-5.0 → 6, 0.7-1.0 → 3, >5.0 → 5, <0.7 → 0", notes: "" },
  { metric: "Quick Ratio", category: "Financial Health", source: "quickRatioAnnual", direction: "Higher is better", rule: "≥1.5 → 10, 1.0-1.5 → 8, 0.7-1.0 → 5, 0.5-0.7 → 3, <0.5 → 0", notes: "" },
  { metric: "Interest Coverage", category: "Financial Health", source: "netInterestCoverageAnnual", direction: "Higher is better, capped", rule: "≥20x → 10, 10-20x → 8, 5-10x → 6, 2-5x → 3, 1-2x → 1, <1x → 0", notes: "Capped at 30x for scoring. Debt-free companies have no interest expense." },
  // Valuation
  { metric: "P/E TTM", category: "Valuation", source: "peBasicExclExtraTTM", direction: "Ideal range", rule: "5-15 → 9, 15-25 → 8, 25-35 → 6, 35-50 → 4, 50-80 → 2, <5 → 5, >80 → 1", notes: "Negative P/E excluded (no earnings). Suspiciously low values don't get max score." },
  { metric: "Forward P/E", category: "Valuation", source: "forwardPE", direction: "Ideal range", rule: "Same thresholds as P/E TTM", notes: "Negative forward P/E excluded." },
  { metric: "PEG TTM", category: "Valuation", source: "pegTTM", direction: "Lower is better", rule: "0.5-1.0 → 10, ≤0.5 → 9, 1.0-1.5 → 8, 1.5-2.0 → 6, 2.0-3.0 → 3, >3.0 → 1", notes: "Negative PEG excluded. Very low PEG (≤0.5) scores 9 to avoid over-rewarding." },
  { metric: "Forward PEG", category: "Valuation", source: "forwardPEG", direction: "Lower is better", rule: "Same thresholds as PEG TTM", notes: "" },
  { metric: "P/S TTM", category: "Valuation", source: "psTTM", direction: "Lower is better", rule: "≤1 → 10, 1-3 → 8, 3-6 → 6, 6-10 → 4, 10-20 → 2, >20 → 1", notes: "" },
  { metric: "EV/EBITDA TTM", category: "Valuation", source: "evEbitdaTTM", direction: "Lower is better", rule: "8-12 → 10, ≤8 → 9, 12-18 → 8, 18-25 → 6, 25-35 → 3, >35 → 1", notes: "Negative EV/EBITDA excluded. Very low values score 9 to avoid over-rewarding." },
  // Risk / Context
  { metric: "Beta", category: "Risk / Context", source: "beta", direction: "Ideal range", rule: "0.8-1.4 → 10, 0.5-0.8 → 8, 1.4-1.8 → 6, 1.8-2.5 → 3, >2.5 → 1, <0.5 → 6", notes: "Moderate beta rewarded. Extreme volatility penalized." },
  { metric: "Market Cap", category: "Risk / Context", source: "marketCapitalization", direction: "Higher is better", rule: "≥$100B → 10, $50-100B → 8, $20-50B → 6, $5-20B → 4, $1-5B → 2, <$1B → 1", notes: "Slightly rewards company scale/stability. Not a major driver due to 5% category weight." },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Growth": "text-emerald-400",
  "Profitability": "text-blue-400",
  "Financial Health": "text-cyan-400",
  "Valuation": "text-purple-400",
  "Risk / Context": "text-amber-400",
};

export default function ScoreMethodologyTab() {
  return (
    <div className="space-y-5">

      {/* Overview */}
      <Section title="Overview" icon={<BookOpen className="w-4 h-4" />}>
        <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <p>
            <span className="font-semibold text-white">Fundamental Score v1</span> rates company quality from{" "}
            <span className="font-mono text-emerald-300">0 to 100</span> using FMP Starter financial metrics
            (ratios TTM, financial growth, company profile). Finnhub provides analyst recommendation counts.
            Metric values are stored in <span className="font-mono text-slate-300">StockMetric</span> during{" "}
            <span className="font-mono text-slate-300">Company Data Sync</span>.
          </p>
          <p className="text-slate-400">
            It is <strong className="text-slate-200">deterministic</strong> and{" "}
            <strong className="text-slate-200">transparent</strong> — every score can be explained by the threshold
            rules below. It does not use AI, news, analyst targets, or external API calls during calculation.
          </p>
          <div className="flex items-start gap-2 rounded bg-blue-900/20 border border-blue-800/40 px-3 py-2.5 mt-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Version label: <span className="font-mono font-semibold">{SCORE_VERSION}</span>.
              The scanner requires both a quote and a score row to show a stock. Once
              a Fundamental Score is calculated, stocks with a synced quote become scanner-eligible.
            </p>
          </div>
        </div>
      </Section>

      {/* Category Weights */}
      <Section title="Category Weights" icon={<BarChart3 className="w-4 h-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <TableHeader headers={["Category", "Weight", "Main Idea"]} />
            <tbody>
              {[
                { cat: "Growth", weight: "30%", idea: "Revenue and EPS expansion", icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-emerald-400" },
                { cat: "Profitability", weight: "30%", idea: "Margins and returns on equity / assets", icon: <DollarSign className="w-3.5 h-3.5" />, color: "text-blue-400" },
                { cat: "Valuation", weight: "20%", idea: "Price paid relative to earnings / sales / EBITDA / growth", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-purple-400" },
                { cat: "Financial Health", weight: "15%", idea: "Debt, liquidity, and interest coverage", icon: <Shield className="w-3.5 h-3.5" />, color: "text-cyan-400" },
                { cat: "Risk / Context", weight: "5%", idea: "Beta and company size context", icon: <Activity className="w-3.5 h-3.5" />, color: "text-amber-400" },
              ].map((row) => (
                <tr key={row.cat} className="border-b border-slate-700/40">
                  <td className="px-3 py-2.5">
                    <div className={`flex items-center gap-1.5 font-semibold ${row.color}`}>
                      {row.icon}
                      {row.cat}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-200">{row.weight}</td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs">{row.idea}</td>
                </tr>
              ))}
              <tr className="bg-slate-900/40">
                <td className="px-3 py-2 text-xs font-semibold text-slate-500">Total</td>
                <td className="px-3 py-2 font-mono font-bold text-slate-200">100%</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            If a category has no scoreable metrics, it is excluded from the weighted average and the
            remaining weights are re-normalized to 100%.
          </p>
        </div>
      </Section>

      {/* Metric Scoring Rules */}
      <Section title="Metric Scoring Rules" icon={<BarChart3 className="w-4 h-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <TableHeader headers={["Metric", "Category", "Source Field", "Direction", "Scoring Rule", "Notes"]} />
            <tbody>
              {METRIC_ROWS.map((row) => (
                <tr key={row.metric} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                  <td className="px-3 py-2 font-semibold text-slate-200 whitespace-nowrap">{row.metric}</td>
                  <td className={`px-3 py-2 font-semibold whitespace-nowrap ${CATEGORY_COLORS[row.category] ?? "text-slate-400"}`}>
                    {row.category}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">{row.source}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.direction}</td>
                  <td className="px-3 py-2 text-slate-400 text-[10px] whitespace-nowrap">{row.rule}</td>
                  <td className="px-3 py-2 text-slate-500 text-[10px] max-w-[220px]">{row.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Each metric is scored 0–10. Missing metrics are excluded from the category average — they
            do not count as 0. Each category average (0–10) is multiplied by 10 to produce a 0–100
            category score.
          </p>
        </div>
      </Section>

      {/* Caps and Warnings */}
      <Section title="Caps and Known Limitations" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
        <div className="space-y-3 text-xs text-slate-400">
          <div className="rounded bg-amber-900/20 border border-amber-800/40 px-3 py-2.5 space-y-2">
            <p className="font-semibold text-amber-300">Scoring Caps — applied during calculation only, never stored in raw data</p>
            <ul className="space-y-1 list-disc pl-4 text-amber-200/80">
              <li><span className="font-mono">ROE cap: 60%</span> — buyback-heavy companies can show extreme ROE values that do not reflect real economic performance.</li>
              <li><span className="font-mono">Interest Coverage cap: 30×</span> — debt-free companies have no interest expense, producing undefined or very large coverage ratios.</li>
            </ul>
          </div>
          <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
            <p className="font-semibold text-slate-300">Other limitations in v1</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>No sector-relative scoring — all stocks are scored against the same thresholds.</li>
              <li>No peer comparison — a high-margin software company and a low-margin retailer are scored against the same margin thresholds.</li>
              <li>Financials and utilities have structural differences (negative equity, regulated margins) that v1 thresholds do not fully account for.</li>
              <li>Missing metrics reduce information but do not produce a 0 score — they are excluded from the average.</li>
              <li>Valuation metrics exclude negative values (negative earnings, negative EV/EBITDA) rather than penalizing them.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Example Calculation */}
      <Section title="Example Calculation" icon={<BarChart3 className="w-4 h-4" />}>
        <p className="text-xs text-slate-500">Illustrative example — not a real stock.</p>
        <div className="rounded bg-slate-900/70 border border-slate-700/60 px-4 py-3 font-mono text-xs text-slate-300 space-y-1.5">
          <p className="text-slate-500 mb-2">Example Company</p>
          <p>Growth Score:           <span className="text-emerald-300">80</span></p>
          <p>Profitability Score:    <span className="text-emerald-300">75</span></p>
          <p>Valuation Score:        <span className="text-emerald-300">60</span></p>
          <p>Financial Health Score: <span className="text-emerald-300">70</span></p>
          <p>Risk / Context Score:   <span className="text-emerald-300">65</span></p>
          <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
            <p className="text-slate-400">Final Score =</p>
            <p>  80 × 0.30  =  24.00  <span className="text-slate-500">(Growth)</span></p>
            <p>  75 × 0.30  =  22.50  <span className="text-slate-500">(Profitability)</span></p>
            <p>  60 × 0.20  =  12.00  <span className="text-slate-500">(Valuation)</span></p>
            <p>  70 × 0.15  =  10.50  <span className="text-slate-500">(Financial Health)</span></p>
            <p>  65 × 0.05  =   3.25  <span className="text-slate-500">(Risk / Context)</span></p>
            <p className="border-t border-slate-700 pt-1 mt-1 font-bold text-white">= 72.25  →  Fundamental Score: <span className="text-emerald-300">72</span></p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          If one category had no scoreable metrics (e.g., Risk / Context), the remaining 95% of weights
          would be re-normalized to 100% before computing the final score.
        </p>
      </Section>

      {/* ── Opportunity Score v2 ────────────────────────────────────────── */}
      <Section title="Opportunity Score v2" icon={<Activity className="w-4 h-4" />}>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            <span className="font-semibold text-white">Opportunity Score v2</span> estimates how attractive a stock looks right now by combining internal quality scores with analyst target upside and market context.
          </p>
          <p className="text-slate-400">
            Unlike Fundamental Score which asks <strong className="text-slate-300">how strong is the company?</strong>,
            Opportunity Score asks <strong className="text-slate-300">is this a good time to consider it?</strong>{" "}
            A fundamentally strong company trading near its 52W high with low analyst upside will score lower than one with meaningful room to target.
          </p>
          <div className="flex items-start gap-2 rounded bg-blue-900/20 border border-blue-800/40 px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Version label: <span className="font-mono font-semibold">opportunity-v2</span>.
              Requires <span className="font-mono">fundamentalScore</span> to exist — run Fundamental Score first.
              No external API calls during scoring. Raw analyst target values are never modified.
              Missing components are excluded and remaining weights re-normalized.
            </p>
          </div>

          {/* Component weights table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-sm">
              <TableHeader headers={["Component", "Weight", "Source", "Missing"]} />
              <tbody>
                {[
                  { comp: "Fundamental Quality", weight: "25%", source: "StockScore.fundamentalScore", missing: "required" },
                  { comp: "Valuation", weight: "20%", source: "StockScore.valuationScore", missing: "re-normalize" },
                  { comp: "Growth", weight: "15%", source: "StockScore.growthScore", missing: "re-normalize" },
                  { comp: "Analyst Upside", weight: "20%", source: "StockAnalystData.analystUpsidePercent", missing: "re-normalize" },
                  { comp: "Analyst Sentiment", weight: "10%", source: "Finnhub recommendation counts stored in DB", missing: "re-normalize" },
                  { comp: "Price Position", weight: "5%", source: "StockQuote 52-week range", missing: "re-normalize" },
                  { comp: "Risk / Context", weight: "5%", source: "StockScore.riskContextScore", missing: "re-normalize" },
                ].map((row) => (
                  <tr key={row.comp} className="border-b border-slate-700/40">
                    <td className="px-3 py-2 font-medium text-slate-200">{row.comp}</td>
                    <td className="px-3 py-2 font-mono text-emerald-300">{row.weight}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">{row.source}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={row.missing === "required" ? "text-amber-400 font-medium" : "text-slate-500"}>
                        {row.missing}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900/40">
                  <td className="px-3 py-2 text-xs font-semibold text-slate-500">Total</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-200">100%</td>
                  <td /><td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analyst Upside scoring */}
          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyst Upside Scoring</p>
            <p className="text-xs text-slate-500">
              Input: <span className="font-mono text-slate-300">analystUpsidePercent</span>.
              Upside &gt; 60% is capped at 60% for scoring — the raw stored value is never modified.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <TableHeader headers={["Analyst Upside %", "Score"]} />
                <tbody>
                  {[
                    { range: "≥ 60%", score: "100" },
                    { range: "40% to < 60%", score: "90" },
                    { range: "30% to < 40%", score: "82" },
                    { range: "20% to < 30%", score: "72" },
                    { range: "10% to < 20%", score: "60" },
                    { range: "0% to < 10%",  score: "45" },
                    { range: "−10% to < 0%", score: "30" },
                    { range: "< −10%",        score: "15" },
                    { range: "Missing",        score: "null — excluded" },
                  ].map((row) => (
                    <tr key={row.range} className="border-b border-slate-700/40">
                      <td className="px-3 py-1.5 font-mono text-slate-300">{row.range}</td>
                      <td className="px-3 py-1.5 font-mono text-emerald-300">{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analyst Sentiment */}
          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyst Sentiment Formula</p>
            <div className="rounded bg-slate-900/70 border border-slate-700/60 px-4 py-3 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500 mb-1">rawSentiment = (strongBuy×100 + buy×80 + hold×50 + sell×20 + strongSell×0) / totalRecommendations</p>
              <p className="text-slate-500">analystSentimentScore = 50 + (rawSentiment − 50) × confidence</p>
            </div>
            <p className="text-xs text-slate-500">
              The confidence multiplier pulls the score toward neutral (50) when analyst coverage is thin, so a handful of analysts does not carry the same weight as broad consensus.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <TableHeader headers={["Analyst Count", "Confidence"]} />
                <tbody>
                  {[
                    { count: "≥ 30", conf: "1.00 (full weight)" },
                    { count: "20–29", conf: "0.95" },
                    { count: "10–19", conf: "0.90" },
                    { count: "5–9",   conf: "0.80" },
                    { count: "1–4",   conf: "0.65" },
                    { count: "0 / missing", conf: "null — excluded" },
                  ].map((row) => (
                    <tr key={row.count} className="border-b border-slate-700/40">
                      <td className="px-3 py-1.5 font-mono text-slate-300">{row.count}</td>
                      <td className="px-3 py-1.5 text-slate-400">{row.conf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              Example: rawSentiment = 90, analystCount = 4, confidence = 0.65 → score = 50 + (90−50)×0.65 = <span className="font-mono text-slate-300">76</span>.
            </p>
          </div>

          {/* Price Position */}
          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">52-Week Price Position Scoring</p>
            <p className="text-xs text-slate-500">
              Formula: <span className="font-mono text-slate-300">position = (price − week52Low) / (week52High − week52Low)</span>.
              Source: <span className="font-mono text-slate-300">StockQuote.week52High / week52Low</span> (FMP daily sync).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <TableHeader headers={["Position in 52W Range", "Score", "Meaning"]} />
                <tbody>
                  {[
                    { range: "0.20 – 0.60", score: "100", meaning: "Attractive zone — not overextended" },
                    { range: "0.60 – 0.75", score: "80",  meaning: "Reasonable" },
                    { range: "0.75 – 0.90", score: "60",  meaning: "Extended" },
                    { range: "0.90 – 1.00", score: "40",  meaning: "Near 52W high" },
                    { range: "> 1.00",       score: "30",  meaning: "Above 52W high (breakout)" },
                    { range: "0.00 – 0.20",  score: "65",  meaning: "Near 52W low — cheap but possibly weak" },
                    { range: "< 0.00",       score: "50",  meaning: "Below 52W low — neutral" },
                    { range: "Missing / invalid range", score: "null", meaning: "Excluded from weighted average" },
                  ].map((row) => (
                    <tr key={row.range} className="border-b border-slate-700/40">
                      <td className="px-3 py-1.5 font-mono text-slate-300">{row.range}</td>
                      <td className="px-3 py-1.5 font-mono text-emerald-300">{row.score}</td>
                      <td className="px-3 py-1.5 text-slate-400">{row.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Missing data */}
          <div className="flex items-start gap-2 rounded bg-amber-900/20 border border-amber-800/40 px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              <strong>Missing data re-normalization:</strong> If a component is null, it is excluded from the weighted average and the remaining weights are re-normalized to 100%.
              Missing components are <strong>never treated as zero</strong>.{" "}
              <span className="font-mono">fundamentalScore</span> is the only required input — if missing, no score is calculated.
            </p>
          </div>

          {/* Example */}
          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example Calculation</p>
            <div className="rounded bg-slate-900/70 border border-slate-700/60 px-4 py-3 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500 mb-2">Illustrative example — not a real stock</p>
              <p>Fundamental Quality (25%):  <span className="text-emerald-300">70</span>  →  70 × 0.25 = 17.50</p>
              <p>Valuation (20%):            <span className="text-emerald-300">65</span>  →  65 × 0.20 = 13.00</p>
              <p>Growth (15%):               <span className="text-emerald-300">80</span>  →  80 × 0.15 = 12.00</p>
              <p>Analyst Upside 28% (20%):  <span className="text-emerald-300">72</span>  →  72 × 0.20 = 14.40</p>
              <p>Analyst Sentiment (10%):   <span className="text-emerald-300">76</span>  →  76 × 0.10 =  7.60</p>
              <p>Price Position (5%):       <span className="text-emerald-300">80</span>  →  80 × 0.05 =  4.00</p>
              <p>Risk / Context (5%):       <span className="text-emerald-300">60</span>  →  60 × 0.05 =  3.00</p>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <p className="font-bold text-white">Total = 71.50  →  Opportunity Score v2: <span className="text-emerald-300">72</span></p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Analyst Data (Phase 17/18) ──────────────────────────────────── */}
      <Section title="Analyst Data Sources" icon={<Info className="w-4 h-4" />}>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            <span className="font-semibold text-white">Company Data Sync</span> uses FMP Starter as the
            primary source for analyst targets and Finnhub for recommendation counts.
            Analyst data is stored in <span className="font-mono text-slate-300">StockAnalystData</span> and is{" "}
            <strong className="text-white">included in Opportunity Score v2</strong> via the Analyst Upside and Analyst Sentiment components.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <TableHeader headers={["Field", "Source", "How Derived", "Scored In"]} />
              <tbody>
                {[
                  { field: "Analyst Target Price", source: "FMP /stable/price-target-consensus", derived: "targetConsensus (primary consensus price)", scored: "—" },
                  { field: "Target High / Low / Median", source: "FMP /stable/price-target-consensus", derived: "targetHigh, targetLow, targetMedian direct", scored: "—" },
                  { field: "Analyst Upside %", source: "Internal calculation", derived: "((targetConsensus − price) / price) × 100", scored: "Opportunity v2 (20%)" },
                  { field: "Analyst Rating", source: "Finnhub /stock/recommendation", derived: "Normalized from Buy/Hold/Sell counts", scored: "—" },
                  { field: "Recommendation Counts", source: "Finnhub /stock/recommendation", derived: "strongBuy, buy, hold, sell, strongSell", scored: "Opportunity v2 (10%)" },
                ].map((row) => (
                  <tr key={row.field} className="border-b border-slate-700/40">
                    <td className="px-3 py-2 font-medium text-slate-200">{row.field}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">{row.source}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{row.derived}</td>
                    <td className="px-3 py-2">
                      <span className={row.scored !== "—" ? "text-emerald-400 text-xs font-medium" : "text-slate-500 text-xs"}>{row.scored}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 rounded bg-blue-900/20 border border-blue-800/40 px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Raw analyst target values are <strong>never modified</strong> during scoring.
              No external API calls are made during Opportunity Score calculation — all inputs are read from the DB.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Target Discovery (Phase 15 — Legacy) ────────────────────────── */}
      <Section title="Analyst Target Discovery — Legacy (Phase 15)" icon={<Info className="w-4 h-4" />}>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Phase 15 added a <span className="font-semibold text-white">quota-safe target discovery sync</span> that
            used FMP <span className="font-mono text-slate-300">/stable/price-target-summary</span> to gradually
            discover missing analyst target prices. This is now a{" "}
            <span className="font-semibold text-amber-300">legacy fallback</span> for limited/free FMP plans.
            The Company Data Sync (Phase 17) is the primary target sync.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <TableHeader headers={["Parameter", "Value", "Notes"]} />
              <tbody>
                {[
                  { param: "Max attempts per run", value: "40", notes: "Stops to protect daily FMP quota" },
                  { param: "Max targets found per run", value: "16", notes: "Stops early when enough targets found" },
                  { param: "Chunk size", value: "10 symbols", notes: "Processed per HTTP request cycle" },
                  { param: "has_target cooldown", value: "14 days", notes: "Refreshes stale targets" },
                  { param: "no_target_available cooldown", value: "30 days", notes: "Avoids wasteful re-checks" },
                  { param: "provider_error cooldown", value: "1 day", notes: "Retries transient errors next day" },
                  { param: "quota_blocked cooldown", value: "Next day", notes: "Continues after quota resets" },
                ].map((row) => (
                  <tr key={row.param} className="border-b border-slate-700/40">
                    <td className="px-3 py-2 font-mono text-slate-300">{row.param}</td>
                    <td className="px-3 py-2 font-medium text-slate-200">{row.value}</td>
                    <td className="px-3 py-2 text-slate-400">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p>Existing target prices are <strong className="text-slate-300">never deleted</strong> by an empty response — only overwritten when new valid data is found.</p>
              <p>Analyst upside and sentiment are now included in <strong className="text-slate-300">Opportunity Score v2</strong> (Phase 20). This discovery tool is a legacy supplement only.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Future Improvements */}
      <Section title="Future Improvements (Not in v1)" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="text-xs text-slate-400 space-y-2">
          <p>The following are planned improvements for future score versions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {[
              "Sector-relative scoring (compare margins within the same sector)",
              "ROIC (Return on Invested Capital)",
              "Free Cash Flow and FCF Margin",
              "FCF Growth and FCF yield",
              "Book Value Growth",
              "P/FCF ratio",
              "Asset Turnover and Inventory Turnover",
              "Days Sales Outstanding (DSO)",
              "Margin consistency over time",
              "Peer comparison within sector",
              "Z-score normalization for distributions with sufficient data",
              "Moat score (R&D %, brand strength proxy)",
              "Technical trend / moving averages (Opportunity Score v3)",
              "Relative volume anomaly (Opportunity Score v3)",
              "News and catalyst score (Opportunity Score v3)",
              "Earnings timing (Opportunity Score v3)",
              "Sector-relative valuation (Opportunity Score v3)",
              "Drawdown / rebound pattern (Opportunity Score v3)",
              "Analyst Sentiment Score (separate standalone score)",
              "Momentum Score",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

    </div>
  );
}
