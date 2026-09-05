import express, { Request, Response } from "express";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "./auth.ts";
import { db } from "./db.ts";
import { PRICING_CONFIG, type PricingPlan } from "../src/config/pricing.ts";

export const subscriptionsRouter = express.Router();

export type BillingCycle = "monthly" | "yearly" | "lifetime" | "none";

export interface SubscriptionPlan extends PricingPlan {
  id: string;
  name: string;
  currency: PricingPlan["currency"];
  prices: PricingPlan["prices"];
  features: Record<string, boolean>;
  usageLimits: Record<string, number>;
}

export const availablePlans: SubscriptionPlan[] = PRICING_CONFIG.plans.map(
  (plan) => ({
    ...plan,
    usageLimits: { ...plan.usageLimits },
    features: { ...plan.features },
    prices: { ...plan.prices },
  }),
);

export function resolveUserEntitlements(userId: string) {
  const billingInfo = db.billingRecords.get(userId);

  if (!billingInfo) {
    // Return default free tier if no billing record exists
    return {
      planId: "free_starter",
      features: availablePlans[0].features,
      limits: availablePlans[0].usageLimits,
      specialAccess: [],
    };
  }

  // Ensure auditLog exists
  if (!billingInfo.auditLog) {
    billingInfo.auditLog = [];
  }

  // Check and process early access expiration
  let hasValidEarlyAccess = false;
  if (billingInfo.earlyAccessExpiresAt) {
    if (new Date(billingInfo.earlyAccessExpiresAt) > new Date()) {
      hasValidEarlyAccess = true;
    } else {
      // Automatically expire access
      billingInfo.earlyAccessActivatedAt = null;
      billingInfo.earlyAccessExpiresAt = null;
      billingInfo.auditLog.push({
        date: new Date().toISOString(),
        action: "EARLY_ACCESS_EXPIRED",
        details: "Early access automatically expired.",
      });
    }
  }

  const basePlan =
    availablePlans.find((p) => p.id === billingInfo.planId) ||
    availablePlans[0];

  const features = { ...basePlan.features };
  const limits = { ...basePlan.usageLimits };
  const specialAccess = [];

  const hasSpecialAccess =
    billingInfo.promotionalAccess ||
    billingInfo.lifetimeAccess ||
    billingInfo.partnerAccount ||
    billingInfo.adminGrantedAccess ||
    billingInfo.earlyAdopterAccess ||
    hasValidEarlyAccess;

  if (hasSpecialAccess) {
    if (billingInfo.promotionalAccess) specialAccess.push("promotional");
    if (billingInfo.lifetimeAccess) specialAccess.push("lifetime");
    if (billingInfo.partnerAccount) specialAccess.push("partner");
    if (billingInfo.adminGrantedAccess) specialAccess.push("admin_granted");
    if (billingInfo.earlyAdopterAccess) specialAccess.push("early_adopter");
    if (hasValidEarlyAccess) specialAccess.push("early_access");

    // Override features for special access users
    features.canExportCover = true;
    features.aiAssistant = true;
    features.premiumMetrics = true;

    // Expand limits
    limits.keywordSearches = 999999;
    limits.nicheQueries = 999999;
    limits.aiCredits = 999999;
    limits.coverExports = 999999;
  }

  return {
    planId: basePlan.id,
    features,
    limits,
    specialAccess,
  };
}

subscriptionsRouter.get(
  "/me",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const billingInfo = db.billingRecords.get(userId);
    const entitlements = resolveUserEntitlements(userId);

    res.json({
      success: true,
      data: {
        billing: billingInfo || null,
        entitlements,
        availablePlans,
      },
    });
  },
);
