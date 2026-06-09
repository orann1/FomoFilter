"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import ScoreMethodologyTab from "./ScoreMethodologyTab";

function Section({
  title,
  icon,
  children,
  collapsible = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (collapsible) {
    return (
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="text-slate-400">{icon}</span>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        </button>
        {isOpen && (
          <div className="border-t border-slate-700/60 px-4 py-3">
            {children}
          </div>
        )}
      </section>
    );
  }

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

export default function DocumentationTab() {
  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-4">
        <div className="flex gap-2">
          <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
          <div className="text-sm text-slate-300 space-y-2">
            <p>
              This section provides documentation about FomoFilter's data models, sync workflows, scoring systems, and research discovery features.
            </p>
            <p className="text-slate-500">
              For detailed specifications and implementation details, see the Context documentation files in the repository.
            </p>
          </div>
        </div>
      </div>

      {/* Score Methodology */}
      <Section
        title="Score Methodology"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg -mx-4 -my-3">
          <div className="px-4 py-3">
            <ScoreMethodologyTab />
          </div>
        </div>
      </Section>

      {/* Sync Workflows */}
      <Section
        title="Sync Workflows"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-3 text-sm text-slate-300">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200">Universe Sync</h4>
            <p className="text-xs text-slate-400">
              Builds and refreshes stock universe membership (Nasdaq 100, S&P 500).
              Creates missing Stock records, upserts memberships, and marks removed symbols inactive.
              Overlapping symbols remain unique — one Stock record with multiple memberships.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Company Data Sync</h4>
            <p className="text-xs text-slate-400">
              Refreshes company profile, fundamentals, ratios, growth, analyst targets, and recommendation counts
              for all unique active stocks. Uses FMP for profile/metrics and Finnhub for recommendations.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Daily Market Data Sync</h4>
            <p className="text-xs text-slate-400">
              Refreshes daily market quote data (price, volume, 52-week context) from FMP for all unique active stocks
              across all synced universes. Run daily for fresh price/volume context.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Score Calculation</h4>
            <p className="text-xs text-slate-400">
              Internal DB-only calculation of Fundamental Score v1 and Opportunity Score v2.
              No external API calls. Uses stored metrics, quotes, and analyst data.
            </p>
          </div>
        </div>
      </Section>

      {/* Data Inventory Guide */}
      <Section
        title="Data Inventory Guide"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <p className="font-semibold text-slate-200">What is Data Inventory?</p>
            <p className="text-slate-400">
              A read-only snapshot of stock data coverage, freshness, and completeness. Shows which stocks have quotes,
              metrics, scores, analyst data, and which are eligible for the Scanner.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <p className="font-semibold text-slate-200">Key Metrics</p>
            <ul className="text-slate-400 space-y-1 list-disc pl-4">
              <li><strong>Scanner Eligible:</strong> Has quote, metrics, score, and meets minimum data requirements.</li>
              <li><strong>With Quote:</strong> Has recent FMP daily quote (from Daily Market Data Sync).</li>
              <li><strong>With Metrics:</strong> Has FMP fundamentals/ratios (from Company Data Sync).</li>
              <li><strong>With Score:</strong> Has internal Fundamental and/or Opportunity scores.</li>
              <li><strong>Has Analyst Data:</strong> Has FMP targets and Finnhub recommendation counts.</li>
            </ul>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <p className="font-semibold text-slate-200">Filtering</p>
            <p className="text-slate-400">
              Use filters to identify problem rows (missing quotes, stale data, missing scores) and healthy stocks.
              Search by symbol or company name. Sort by universe membership, freshness, or coverage status.
            </p>
          </div>
        </div>
      </Section>

      {/* Opportunity Radar / AI Scan */}
      <Section
        title="Opportunity Radar / AI Scan"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <p className="font-semibold text-slate-200">What is Opportunity Radar?</p>
            <p className="text-slate-400">
              An AI-assisted market discovery surface that uses Claude to identify interesting research candidates.
              Displays candidates in a briefing format with narrative context, signal categories, and analyst context.
              Not financial advice — surfaces research candidates worth further review.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <p className="font-semibold text-slate-200">How It Works</p>
            <p className="text-slate-400">
              Admin can trigger Fixture Scan (test data) or Claude Scan (real AI) from the AI Scan tab.
              Claude analyzes active stocks from the database and generates candidates.
              Results are validated, persisted to the database, and displayed on /opportunity-radar.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <p className="font-semibold text-slate-200">Important</p>
            <ul className="text-slate-400 space-y-1 list-disc pl-4">
              <li>AI execution is server-side only. Normal UI render paths never call Claude directly.</li>
              <li>/opportunity-radar reads persisted DB results — no external API calls from the page.</li>
              <li>Claude Scan uses database-backed context only (controlled source pack mode).</li>
              <li>Candidates are research discoveries, not investment recommendations.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Provider Sources */}
      <Section
        title="Provider Sources"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-3 text-xs text-slate-300">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200">Financial Modeling Prep (FMP)</h4>
            <p className="text-slate-400">
              Company profile, industry, description, fundamentals (ratios TTM, financial growth),
              analyst price targets, and daily quotes.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Finnhub</h4>
            <p className="text-slate-400">
              Analyst recommendation counts and ratings (Strong Buy, Buy, Hold, Sell, Strong Sell).
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Static Fallbacks</h4>
            <p className="text-slate-400">
              Nasdaq 100 and S&P 500 membership use manually validated static lists.
              FMP index constituent endpoints require higher plan tiers.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-2">
            <h4 className="font-semibold text-slate-200">Internal Calculations</h4>
            <p className="text-slate-400">
              Fundamental Score v1 and Opportunity Score v2 are calculated from DB data only.
              No external API calls during scoring.
            </p>
          </div>
        </div>
      </Section>

      {/* Glossary */}
      <Section
        title="Glossary"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-2 text-xs text-slate-300">
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">Key Terms</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
              <div>
                <span className="font-mono font-semibold">Fundamental Score v1</span>
                <p className="text-slate-500">Internal 0–100 quality rating based on growth, profitability, valuation, financial health, and stability.</p>
              </div>
              <div>
                <span className="font-mono font-semibold">Opportunity Score v2</span>
                <p className="text-slate-500">0–100 attractiveness rating combining fundamental quality, valuation, growth, analyst upside, sentiment, price position, and stability.</p>
              </div>
              <div>
                <span className="font-mono font-semibold">Scanner Eligible</span>
                <p className="text-slate-500">Stock has quote, metrics, score, and meets minimum data requirements for display in Scanner.</p>
              </div>
              <div>
                <span className="font-mono font-semibold">Stability</span>
                <p className="text-slate-500">Internal metric combining beta and market cap context. Displayed as "Stability" in UI (formerly "Risk").</p>
              </div>
              <div>
                <span className="font-mono font-semibold">Analyst Upside</span>
                <p className="text-slate-500">Percentage gain from current price to analyst target price. Used in Opportunity Score.</p>
              </div>
              <div>
                <span className="font-mono font-semibold">Decision Tag</span>
                <p className="text-slate-500">Rule-based UI label shown in Scanner expanded row. Indicates strength/concern patterns.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Troubleshooting */}
      <Section
        title="Troubleshooting"
        icon={<BookOpen className="w-4 h-4" />}
        collapsible
      >
        <div className="space-y-3 text-xs text-slate-300">
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">Scanner showing few stocks?</p>
            <p className="text-slate-400">
              Check Data Inventory for stocks without quotes or scores. Run Company Data Sync and Daily Market Data Sync,
              then Calculate Fundamental Scores.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-1">
            <p className="font-semibold text-slate-200">Data looks stale?</p>
            <p className="text-slate-400">
              Check Sync History tab to see last sync times. Run Daily Market Data Sync for fresh quotes.
              Run Company Data Sync for fresh fundamentals and analyst data.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-1">
            <p className="font-semibold text-slate-200">Claude Scan failing?</p>
            <p className="text-slate-400">
              Ensure ANTHROPIC_API_KEY is set in .env. Try Fixture Scan first to verify validation pipeline works.
              Check error message for validation or provider issues.
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-1">
            <p className="font-semibold text-slate-200">Missing analyst targets?</p>
            <p className="text-slate-400">
              Some stocks may not have analyst coverage. Check Data Inventory "Has Analyst Data" filter.
              Opportunity Score is calculated without targets if missing (weights re-normalize).
            </p>
          </div>

          <div className="border-t border-slate-700/40 pt-2 space-y-1">
            <p className="font-semibold text-slate-200">For more details</p>
            <p className="text-slate-500">
              See the Context documentation folder in the repository for detailed specs and algorithms.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
