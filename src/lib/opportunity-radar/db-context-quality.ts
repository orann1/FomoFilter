/**
 * Assess the quality and completeness of database context for Opportunity Radar scans
 * Used to warn admins if data completeness is low
 */

import { prisma } from "@/src/lib/db/prisma";

export interface DbContextQuality {
  totalStocks: number;
  stocksWithQuote: number;
  stocksWithScore: number;
  stocksWithAnalyst: number;
  quoteCompleteness: number; // 0-100
  scoreCompleteness: number; // 0-100
  analystCompleteness: number; // 0-100
  overallCompleteness: number; // 0-100
  warning: string | null;
}

/**
 * Analyze DB context quality
 * Returns completeness metrics and warnings if data is significantly missing
 */
export async function assessDbContextQuality(
  contextLimit: number = 20
): Promise<DbContextQuality> {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        symbol: true,
        quote: {
          select: {
            id: true,
          },
        },
        score: {
          select: {
            id: true,
          },
        },
        analystData: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        symbol: "asc",
      },
      take: contextLimit,
    });

    const totalStocks = stocks.length;
    const stocksWithQuote = stocks.filter((s) => s.quote).length;
    const stocksWithScore = stocks.filter((s) => s.score).length;
    const stocksWithAnalyst = stocks.filter((s) => s.analystData).length;

    const quoteCompleteness = totalStocks > 0 ? Math.round((stocksWithQuote / totalStocks) * 100) : 0;
    const scoreCompleteness = totalStocks > 0 ? Math.round((stocksWithScore / totalStocks) * 100) : 0;
    const analystCompleteness = totalStocks > 0 ? Math.round((stocksWithAnalyst / totalStocks) * 100) : 0;
    const overallCompleteness = Math.round((quoteCompleteness + scoreCompleteness + analystCompleteness) / 3);

    // Determine warning level
    let warning: string | null = null;
    if (totalStocks === 0) {
      warning = "No active stocks in database. Run Universe Sync and Company Data Sync first.";
    } else if (overallCompleteness < 50) {
      warning = `Database context has low data completeness (${overallCompleteness}%). ` +
        `Quotes: ${quoteCompleteness}%, Scores: ${scoreCompleteness}%, Analyst data: ${analystCompleteness}%. ` +
        `Run recent syncs to improve data quality.`;
    } else if (overallCompleteness < 80) {
      warning = `Database context has moderate data completeness (${overallCompleteness}%). ` +
        `Consider running recent syncs to ensure data is fresh.`;
    }

    return {
      totalStocks,
      stocksWithQuote,
      stocksWithScore,
      stocksWithAnalyst,
      quoteCompleteness,
      scoreCompleteness,
      analystCompleteness,
      overallCompleteness,
      warning,
    };
  } catch (error) {
    console.error("Failed to assess DB context quality:", error);
    return {
      totalStocks: 0,
      stocksWithQuote: 0,
      stocksWithScore: 0,
      stocksWithAnalyst: 0,
      quoteCompleteness: 0,
      scoreCompleteness: 0,
      analystCompleteness: 0,
      overallCompleteness: 0,
      warning: "Failed to assess database context quality. Check server logs.",
    };
  }
}
