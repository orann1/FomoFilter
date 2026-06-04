import type { HotStock } from "@/src/lib/mock-data";

export type DecisionSummary = {
  strengths: string[];
  concerns: string[];
  badge: string;
  badgeColor: string;
};

export function buildDecisionSummary(stock: HotStock): DecisionSummary {
  const strengths: string[] = [];
  const concerns: string[] = [];

  const fund = stock.fundamentalScore ?? 0;
  const opp = stock.oppScore ?? 0;
  const val = stock.valuationScore ?? 0;
  const stab = stock.riskContextScore ?? 0;
  const upside = stock.analystUpsidePercent;
  const growth = stock.growthScore ?? 0;
  const profit = stock.profitabilityScore ?? 0;
  const health = stock.financialHealthScore ?? 0;

  if (fund >= 80) strengths.push("Strong fundamentals");
  if (upside != null && upside >= 20) strengths.push("High analyst upside");
  if (growth >= 80) strengths.push("Strong growth metrics");
  if (profit >= 80) strengths.push("Strong profitability");
  if (val >= 70) strengths.push("Reasonable valuation");
  if (stab >= 75) strengths.push("Low volatility context");
  if (health >= 75) strengths.push("Strong financial health");

  if (val < 40) concerns.push("Expensive valuation");
  else if (val < 55) concerns.push("Elevated valuation");
  if (stab < 50) concerns.push("High volatility/risk context");
  else if (stab < 65) concerns.push("Elevated beta / risk context");
  if (upside != null && upside < 0) concerns.push("Negative analyst upside");
  else if (upside != null && upside < 10) concerns.push("Limited analyst upside");
  if (growth < 40 && growth > 0) concerns.push("Weak growth metrics");
  if (profit < 40 && profit > 0) concerns.push("Weak profitability");

  let badge = "Neutral";
  let badgeColor = "text-slate-400 bg-slate-800/60 border border-slate-700/50";
  if (opp >= 80) {
    badge = "Strong Opportunity";
    badgeColor = "text-emerald-300 bg-emerald-500/10 border border-emerald-600/30";
  } else if (opp >= 65) {
    badge = "Attractive";
    badgeColor = "text-emerald-400/80 bg-emerald-500/8 border border-emerald-700/30";
  } else if (opp >= 50) {
    badge = "Watch";
    badgeColor = "text-amber-300 bg-amber-500/10 border border-amber-600/30";
  } else if (opp > 0) {
    badge = "Lower Priority";
    badgeColor = "text-slate-400 bg-slate-800/60 border border-slate-700/50";
  }

  return { strengths, concerns, badge, badgeColor };
}

export function ratingToStars(stock: HotStock): number {
  const total = stock.analystCount;
  if (total && total > 0) {
    const weighted =
      ((stock.analystStrongBuyCount ?? 0) * 5 +
        (stock.analystBuyCount ?? 0) * 4 +
        (stock.analystHoldCount ?? 0) * 3 +
        (stock.analystSellCount ?? 0) * 2 +
        (stock.analystStrongSellCount ?? 0) * 1) /
      total;
    return Math.round(weighted * 2) / 2;
  }
  switch (stock.analystRatingNormalized) {
    case "Strong Buy": return 5;
    case "Buy": return 4;
    case "Hold": return 3;
    case "Sell": return 2;
    case "Strong Sell": return 1;
    default: return 0;
  }
}

// ── Rule-based narrative ───────────────────────────────────────────────────

export type StockDecisionNarrative = {
  headline: string;
  summary: string;
  mainCheck: string;
};

export function buildStockDecisionNarrative(stock: HotStock): StockDecisionNarrative {
  const fund = stock.fundamentalScore ?? 0;
  const opp = stock.oppScore ?? 0;
  const val = stock.valuationScore ?? 0;
  const stab = stock.riskContextScore ?? 0;
  const upside = stock.analystUpsidePercent;
  const growth = stock.growthScore ?? 0;
  const profit = stock.profitabilityScore ?? 0;
  const health = stock.financialHealthScore ?? 0;
  const rating = stock.analystRatingNormalized;

  // Headline — pick the most prominent signal
  let headline: string;
  if (opp >= 80 && fund >= 75) {
    headline = "Strong quality profile with a favorable opportunity context";
  } else if (opp >= 65 && upside != null && upside >= 15) {
    headline = "Solid profile with meaningful analyst upside";
  } else if (fund >= 80) {
    headline = "Strong fundamental profile worth reviewing";
  } else if (profit >= 80 && val >= 65) {
    headline = "Favorable combination of profitability and valuation";
  } else if (upside != null && upside >= 20) {
    headline = "Meaningful analyst upside detected from synced data";
  } else if (val >= 70 && health >= 75) {
    headline = "Reasonable valuation with a healthy financial profile";
  } else if (opp >= 50) {
    headline = "Moderate opportunity context — worth tracking";
  } else {
    headline = "Limited positive signals from current synced data";
  }

  // Positives list for summary
  const positives: string[] = [];
  if (fund >= 80) positives.push("strong fundamentals");
  if (profit >= 80) positives.push("strong profitability");
  if (growth >= 80) positives.push("strong revenue and earnings growth");
  if (val >= 70) positives.push("reasonable valuation");
  if (health >= 75) positives.push("healthy financial position");
  if (stab >= 75) positives.push("low volatility context");
  if (upside != null && upside >= 20)
    positives.push(`notable analyst upside (+${upside.toFixed(1)}%)`);
  else if (upside != null && upside >= 10)
    positives.push(`positive analyst upside (+${upside.toFixed(1)}%)`);
  if (rating === "Strong Buy") positives.push("strong analyst consensus");
  else if (rating === "Buy") positives.push("positive analyst consensus");

  // Summary sentence
  let summary: string;
  if (positives.length >= 3) {
    summary = `${stock.symbol} stands out because it combines ${positives[0]}, ${positives[1]}, and ${positives[2]}.`;
  } else if (positives.length === 2) {
    summary = `${stock.symbol} stands out because it shows ${positives[0]} and ${positives[1]}.`;
  } else if (positives.length === 1) {
    summary = `${stock.symbol} stands out for its ${positives[0]}.`;
  } else {
    summary = `${stock.symbol} does not show strong signals from the current synced data. Review the detailed evidence below before making a decision.`;
  }

  // Main check — pick the most important concern
  const checks: string[] = [];
  if (val < 40)
    checks.push("Valuation appears stretched — check whether the growth profile justifies the multiple");
  else if (val < 55)
    checks.push("Valuation is elevated — verify whether the current price still offers adequate risk/reward");
  if (upside != null && upside < 0)
    checks.push("Analyst consensus target implies downside from the current price");
  else if (upside != null && upside < 5)
    checks.push("Analyst upside is limited — verify whether the risk/reward is still favorable");
  if (stab < 50)
    checks.push("Higher volatility context — consider position sizing carefully before tracking");
  if (stock.change > 5)
    checks.push("Strong recent daily move — check whether entry timing is still favorable");

  const h52 = stock.week52High;
  const l52 = stock.week52Low;
  if (h52 != null && l52 != null && h52 !== l52) {
    const pos52 = (stock.price - l52) / (h52 - l52);
    if (pos52 > 0.92)
      checks.push("Trading near its 52-week high — review whether there is still adequate upside from current levels");
  }

  const mainCheck =
    checks.length > 0 ? checks[0] + "." : "No major concerns detected from the current synced data.";

  return { headline, summary, mainCheck };
}

// ── Signal cards ───────────────────────────────────────────────────────────

export type SignalColor = "emerald" | "blue" | "amber" | "red" | "slate";

export type SignalCard = {
  label: string;
  status: string;
  statusColor: SignalColor;
  detail: string;
  keyValue: string;
};

export function buildSignalCards(stock: HotStock): SignalCard[] {
  const cards: SignalCard[] = [];

  // Quality
  const fund = stock.fundamentalScore;
  let qStatus = "N/A", qColor: SignalColor = "slate", qDetail = "No fundamental score calculated";
  if (fund != null) {
    const n = Math.round(fund);
    if (fund >= 80) { qStatus = "Strong"; qColor = "emerald"; qDetail = `Fundamental ${n} — strong quality signals`; }
    else if (fund >= 65) { qStatus = "Good"; qColor = "emerald"; qDetail = `Fundamental ${n} — solid profile`; }
    else if (fund >= 50) { qStatus = "Moderate"; qColor = "blue"; qDetail = `Fundamental ${n} — mixed quality signals`; }
    else { qStatus = "Needs review"; qColor = "amber"; qDetail = `Fundamental ${n} — weaker quality signals`; }
  }
  cards.push({
    label: "Quality",
    status: qStatus,
    statusColor: qColor,
    detail: qDetail,
    keyValue: fund != null ? String(Math.round(fund)) : "N/A",
  });

  // Valuation
  const val = stock.valuationScore;
  let vStatus = "N/A", vColor: SignalColor = "slate", vDetail = "No valuation score calculated";
  if (val != null) {
    const n = Math.round(val);
    if (val >= 70) { vStatus = "Reasonable"; vColor = "emerald"; vDetail = `Valuation score ${n}`; }
    else if (val >= 50) { vStatus = "Moderate"; vColor = "blue"; vDetail = `Valuation score ${n}`; }
    else if (val >= 35) { vStatus = "Elevated"; vColor = "amber"; vDetail = `Valuation score ${n} — stretched vs peers`; }
    else { vStatus = "Expensive"; vColor = "red"; vDetail = `Valuation score ${n} — significantly stretched`; }
  }
  cards.push({
    label: "Valuation",
    status: vStatus,
    statusColor: vColor,
    detail: vDetail,
    keyValue: val != null ? String(Math.round(val)) : "N/A",
  });

  // Analysts
  const upside = stock.analystUpsidePercent;
  const ratingLabel = stock.analystRatingNormalized;
  let aStatus = "N/A", aColor: SignalColor = "slate", aDetail = "No analyst data synced";
  if (upside != null || ratingLabel) {
    const upsideStr = upside != null ? `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% upside` : "";
    const ratingStr = ratingLabel ?? "";
    const combined = [upsideStr, ratingStr].filter(Boolean).join(" · ");
    if ((upside != null && upside >= 20) || ratingLabel === "Strong Buy") {
      aStatus = "Positive"; aColor = "emerald"; aDetail = combined;
    } else if ((upside != null && upside >= 5) || ratingLabel === "Buy") {
      aStatus = "Favorable"; aColor = "emerald"; aDetail = combined;
    } else if (upside != null && upside >= 0) {
      aStatus = "Neutral"; aColor = "blue"; aDetail = combined || "Limited upside";
    } else if (upside != null && upside < 0) {
      aStatus = "Cautious"; aColor = "amber"; aDetail = combined;
    } else {
      aStatus = "Check data"; aColor = "slate"; aDetail = ratingStr || "Limited data";
    }
  }
  const aKeyValue =
    upside != null ? `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}%` : (ratingLabel ?? "N/A");
  cards.push({
    label: "Analysts",
    status: aStatus,
    statusColor: aColor,
    detail: aDetail,
    keyValue: aKeyValue,
  });

  // Stability
  const stab = stock.riskContextScore;
  let sStatus = "N/A", sColor: SignalColor = "slate", sDetail = "No stability score calculated";
  if (stab != null) {
    const n = Math.round(stab);
    if (stab >= 75) { sStatus = "Low volatility"; sColor = "emerald"; sDetail = `Stability ${n}`; }
    else if (stab >= 60) { sStatus = "Moderate"; sColor = "blue"; sDetail = `Stability ${n}`; }
    else if (stab >= 45) { sStatus = "Elevated risk"; sColor = "amber"; sDetail = `Stability ${n} — higher beta context`; }
    else { sStatus = "High volatility"; sColor = "red"; sDetail = `Stability ${n} — significant risk context`; }
  }
  cards.push({
    label: "Stability",
    status: sStatus,
    statusColor: sColor,
    detail: sDetail,
    keyValue: stab != null ? String(Math.round(stab)) : "N/A",
  });

  // Price Position
  let pStatus = "N/A", pColor: SignalColor = "slate", pDetail = "52W data unavailable", pKeyValue = "N/A";
  const h52 = stock.week52High;
  const l52 = stock.week52Low;
  if (h52 != null && l52 != null && h52 !== l52) {
    const pos = (stock.price - l52) / (h52 - l52);
    const posStr = `${(pos * 100).toFixed(0)}% of 52W range`;
    if (pos > 0.92) {
      pStatus = "Near 52W high"; pColor = "amber";
      pDetail = `Trading near yearly high — ${posStr}`;
    } else if (pos > 0.65) {
      pStatus = "Upper range"; pColor = "blue";
      pDetail = `Upper half of 52W range — ${posStr}`;
    } else if (pos > 0.35) {
      pStatus = "Mid range"; pColor = "blue";
      pDetail = `Middle of 52W range — ${posStr}`;
    } else if (pos > 0.10) {
      pStatus = "Lower range"; pColor = "emerald";
      pDetail = `Lower half of 52W range — ${posStr}`;
    } else {
      pStatus = "Near 52W low"; pColor = "emerald";
      pDetail = `Trading near yearly low — ${posStr}`;
    }
    pKeyValue = `${(pos * 100).toFixed(0)}%`;
  } else if (stock.priceAvg50 != null) {
    const vs50 = ((stock.price - stock.priceAvg50) / stock.priceAvg50) * 100;
    if (vs50 > 10) {
      pStatus = "Extended"; pColor = "amber";
      pDetail = `+${vs50.toFixed(1)}% above 50-day avg`;
      pKeyValue = `+${vs50.toFixed(1)}%`;
    } else if (vs50 >= 0) {
      pStatus = "Above avg"; pColor = "blue";
      pDetail = `+${vs50.toFixed(1)}% above 50-day avg`;
      pKeyValue = `+${vs50.toFixed(1)}%`;
    } else {
      pStatus = "Below avg"; pColor = "blue";
      pDetail = `${vs50.toFixed(1)}% below 50-day avg`;
      pKeyValue = `${vs50.toFixed(1)}%`;
    }
  }
  cards.push({
    label: "Price Position",
    status: pStatus,
    statusColor: pColor,
    detail: pDetail,
    keyValue: pKeyValue,
  });

  return cards;
}
