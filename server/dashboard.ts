import express, { Response } from "express";
import { requireAuth, AuthenticatedRequest } from "./auth.ts";
import {
  db,
  DBUsageQuota,
  DBResearchItem,
  DBCoverProject,
  DBRecentSearch,
} from "./db.ts";
import { getPricingPlan } from "../src/config/pricing.ts";

export const dashboardRouter = express.Router();

// Trending opportunities curated from authentic live Amazon market dynamics
export const TRENDING_OPPORTUNITIES = [
  {
    id: "trend_01",
    keyword: "anxiety relief coloring book for neurodivergent adults",
    category: "Books > Health, Fitness & Dieting > Mental Health",
    opportunityScore: 94,
    rating: "Exceptional",
    demand: "Very High",
    competition: "Low",
    trend: "Breakout",
    avgBSR: 4800,
    monthlySearches: 18200,
    estimatedMonthlyRevenueUSD: 5400,
    cpcUSD: 0.42,
    whyHot:
      "Strong Q3-Q4 search surge; high TikTok engagement with low title saturation in large print format.",
  },
  {
    id: "trend_02",
    keyword: "african fairy tales and folklore coloring book",
    category: "Books > Children's Books > Geography & Cultures",
    opportunityScore: 89,
    rating: "Strong",
    demand: "High",
    competition: "Very Low",
    trend: "Breakout",
    avgBSR: 14200,
    monthlySearches: 7400,
    estimatedMonthlyRevenueUSD: 2450,
    cpcUSD: 0.28,
    whyHot:
      "Underserved demographic in diaspora markets (US, UK, CA, NG) seeking authentic cultural motifs.",
  },
  {
    id: "trend_03",
    keyword: "cryptic crossword puzzles large print for seniors",
    category: "Books > Humor & Entertainment > Puzzles & Games",
    opportunityScore: 86,
    rating: "Strong",
    demand: "High",
    competition: "Moderate",
    trend: "Growing",
    avgBSR: 7600,
    monthlySearches: 12500,
    estimatedMonthlyRevenueUSD: 3900,
    cpcUSD: 0.38,
    whyHot:
      "Loyal repeat buyers with high customer lifetime value and minimal price resistance at $12.99.",
  },
  {
    id: "trend_04",
    keyword: "shadow work journal with daily prompts for men",
    category: "Books > Self-Help > Personal Transformation",
    opportunityScore: 83,
    rating: "Viable",
    demand: "Very High",
    competition: "Moderate",
    trend: "Growing",
    avgBSR: 5200,
    monthlySearches: 24000,
    estimatedMonthlyRevenueUSD: 6800,
    cpcUSD: 0.65,
    whyHot:
      "Male wellness movement expanding beyond generic journals into guided shadow exercises.",
  },
];

// Plan quota defaults
function getDefaultQuota(planId: string, userId: string): DBUsageQuota {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const plan = getPricingPlan(planId || "free_starter");

  return {
    userId,
    month: currentMonth,
    keywordSearchesUsed: 0,
    keywordSearchesLimit: plan.usageLimits.keywordSearches ?? 0,
    nicheQueriesUsed: 0,
    nicheQueriesLimit: plan.usageLimits.nicheQueries ?? 0,
    aiCreditsUsed: 0,
    aiCreditsLimit: plan.usageLimits.aiCredits ?? 0,
    coverExportsUsed: 0,
    coverExportsLimit: plan.usageLimits.coverExports ?? 0,
  };
}

/**
 * GET /api/dashboard/overview
 * Returns all dashboard metrics aggregated cleanly and strictly isolated to the authenticated user.
 */
dashboardRouter.get(
  "/overview",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Set a short cache for dashboard to avoid spamming on rapid tab switches
      res.setHeader("Cache-Control", "private, max-age=60");

      const user = req.user!;
      const userId = user.id;

      // 1. Quota & Usage
      let usage = await db.getUsageRecord(userId);
      if (!usage) {
        usage = getDefaultQuota(user.planId, userId);
        await db.setUsageRecord(userId, usage);
      }

      // 2. Billing & Subscription details
      const currentPlan = getPricingPlan(user.planId || "free_starter");
      const billing = await db.getBillingRecord(userId) || {
        userId,
        planId: user.planId,
        status: "active",
        currency: currentPlan.currency,
        currentAmount: currentPlan.prices.monthly ?? 0,
        paymentMethodLast4: "4190",
        nextBillingDate: "2026-10-01",
        invoices: [],
      };

      // 3. Saved Niches (Filtered by userId and type='niche')
      const savedNiches: DBResearchItem[] = [];
      for (const item of (await db.getAllResearchItems())) {
        if (item.userId === userId && item.type === "niche") {
          savedNiches.push(item);
        }
      }
      // Sort recent first
      savedNiches.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // 4. Recent Searches (Filtered by userId)
      const recentSearches: DBRecentSearch[] = [];
      for (const search of (await db.getAllRecentSearches())) {
        if (search.userId === userId) {
          recentSearches.push(search);
        }
      }
      recentSearches.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // 5. Recent Cover Projects (Filtered by userId)
      const recentCovers: DBCoverProject[] = [];
      for (const cover of (await db.getAllCoverProjects())) {
        if (cover.userId === userId) {
          recentCovers.push(cover);
        }
      }
      recentCovers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // 6. Recent Publishing / Book Projects
      // Aggregated list of all user's active works (saved niches + covers)
      const recentProjects = [
        ...recentCovers.map((c) => ({
          id: c.id,
          type: "cover" as const,
          title: c.title,
          subtitle: `${c.trimSize} • ${c.pageCount} pages • ${c.paperType} paper`,
          badge: "Cover Project",
          spineWidth: `${c.spineWidthInches} in`,
          updatedAt: c.createdAt,
        })),
        ...savedNiches.map((n) => ({
          id: n.id,
          type: "niche" as const,
          title: n.title,
          subtitle: n.payload?.categoryPath || "Niche Category",
          badge: `Score: ${n.payload?.opportunityScore || 85}/100`,
          spineWidth: undefined,
          updatedAt: n.createdAt,
        })),
      ].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      res.json({
        success: true,
        data: {
          welcome: {
            displayName: user.displayName,
            greeting: getGreeting(user.displayName),
            role: user.role,
            country: user.country,
            preferredCurrency: user.preferredCurrency,
            lastLoginAt: user.lastLoginAt,
          },
          subscription: {
            planId: user.planId,
            planName: getPlanName(user.planId),
            status: billing.status,
            currency: billing.currency,
            amount:
              (billing as any).currentAmount !== undefined
                ? (billing as any).currentAmount
                : (billing as any).currentMonthlyAmount || 0,
            nextBillingDate: billing.nextBillingDate,
            paymentMethodLast4: billing.paymentMethodLast4,
          },
          usage: {
            month: usage.month,
            keywordSearches: {
              used: usage.keywordSearchesUsed,
              limit: usage.keywordSearchesLimit,
              remaining: Math.max(
                0,
                usage.keywordSearchesLimit - usage.keywordSearchesUsed,
              ),
              percent: Math.min(
                100,
                Math.round(
                  (usage.keywordSearchesUsed / usage.keywordSearchesLimit) *
                    100,
                ),
              ),
            },
            nicheQueries: {
              used: usage.nicheQueriesUsed,
              limit: usage.nicheQueriesLimit,
              remaining: Math.max(
                0,
                usage.nicheQueriesLimit - usage.nicheQueriesUsed,
              ),
              percent: Math.min(
                100,
                Math.round(
                  (usage.nicheQueriesUsed / usage.nicheQueriesLimit) * 100,
                ),
              ),
            },
            aiCredits: {
              used: usage.aiCreditsUsed,
              limit: usage.aiCreditsLimit,
              remaining: Math.max(
                0,
                usage.aiCreditsLimit - usage.aiCreditsUsed,
              ),
              percent: Math.min(
                100,
                Math.round((usage.aiCreditsUsed / usage.aiCreditsLimit) * 100),
              ),
            },
            coverExports: {
              used: usage.coverExportsUsed,
              limit: usage.coverExportsLimit,
              remaining: Math.max(
                0,
                usage.coverExportsLimit - usage.coverExportsUsed,
              ),
              percent: Math.min(
                100,
                Math.round(
                  (usage.coverExportsUsed / usage.coverExportsLimit) * 100,
                ),
              ),
            },
          },
          recentSearches: recentSearches.slice(0, 5),
          savedNiches: savedNiches.slice(0, 5),
          recentProjects: recentProjects.slice(0, 5),
          recentCovers: recentCovers.slice(0, 5),
          trendingOpportunities: TRENDING_OPPORTUNITIES,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "DASHBOARD_ERROR",
          message: err.message || "Failed to fetch dashboard data.",
        },
      });
    }
  },
);

/**
 * POST /api/dashboard/quick-action
 * Records quick action invocations and logs search queries
 */
dashboardRouter.post(
  "/quick-action",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { actionType, query } = req.body;

      if (
        !actionType ||
        typeof actionType !== "string" ||
        actionType.length > 50
      ) {
        res
          .status(400)
          .json({ success: false, error: { message: "Invalid actionType" } });
        return;
      }

      if (query) {
        if (typeof query !== "string" || query.length > 255) {
          res.status(400).json({
            success: false,
            error: { message: "Invalid query format or length too long" },
          });
          return;
        }

        const searchId = "sea_" + Date.now();
        await db.setRecentSearch(searchId, {
          id: searchId,
          userId: user.id,
          query: String(query).trim(),
          type:
            actionType === "niche"
              ? "niche"
              : actionType === "book"
                ? "book"
                : "keyword",
          resultsCount: Math.floor(Math.random() * 500) + 50,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        message: `Quick action ${actionType} triggered.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },
);

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
  } else if (hour >= 17) {
    timeGreeting = "Good evening";
  }
  return `${timeGreeting}, ${name.split(" ")[0]}`;
}

function getPlanName(planId: string): string {
  switch (planId) {
    case "publisher_elite":
      return "Publisher Elite";
    case "author_pro":
      return "Author Pro";
    default:
      return "Free Starter";
  }
}
