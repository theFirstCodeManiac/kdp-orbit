import express, { Request, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth.ts';
import { db } from './db.ts';

export const subscriptionsRouter = express.Router();

export type BillingCycle = 'monthly' | 'yearly' | 'lifetime' | 'none';

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export const availablePlans: SubscriptionPlan[] = [
  {
    id: 'free_starter',
    name: 'Free',
    monthlyPriceUSD: 0,
    yearlyPriceUSD: 0,
    features: {
      canExportCover: false,
      aiAssistant: false,
      premiumMetrics: false,
    },
    limits: {
      keywordSearches: 15,
      nicheQueries: 5,
      aiCredits: 5,
      coverExports: 2,
    }
  },
  {
    id: 'author_pro',
    name: 'Premium',
    monthlyPriceUSD: 14.99,
    yearlyPriceUSD: 149.99,
    features: {
      canExportCover: true,
      aiAssistant: true,
      premiumMetrics: true,
    },
    limits: {
      keywordSearches: 250,
      nicheQueries: 100,
      aiCredits: 150,
      coverExports: 25,
    }
  },
  {
    id: 'publisher_elite',
    name: 'Elite',
    monthlyPriceUSD: 34.99,
    yearlyPriceUSD: 349.99,
    features: {
      canExportCover: true,
      aiAssistant: true,
      premiumMetrics: true,
    },
    limits: {
      keywordSearches: 1000,
      nicheQueries: 500,
      aiCredits: 1000,
      coverExports: 100,
    }
  }
];

export function resolveUserEntitlements(userId: string) {
  const billingInfo = db.billingRecords.get(userId);
  
  if (!billingInfo) {
    // Return default free tier if no billing record exists
    return {
      planId: 'free_starter',
      features: availablePlans[0].features,
      limits: availablePlans[0].limits,
      specialAccess: []
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
        action: 'EARLY_ACCESS_EXPIRED',
        details: 'Early access automatically expired.'
      });
    }
  }

  const basePlan = availablePlans.find(p => p.id === billingInfo.planId) || availablePlans[0];
  
  const features = { ...basePlan.features };
  const limits = { ...basePlan.limits };
  const specialAccess = [];

  const hasSpecialAccess = billingInfo.promotionalAccess || 
                           billingInfo.lifetimeAccess || 
                           billingInfo.partnerAccount || 
                           billingInfo.adminGrantedAccess || 
                           billingInfo.earlyAdopterAccess ||
                           hasValidEarlyAccess;

  if (hasSpecialAccess) {
    if (billingInfo.promotionalAccess) specialAccess.push('promotional');
    if (billingInfo.lifetimeAccess) specialAccess.push('lifetime');
    if (billingInfo.partnerAccount) specialAccess.push('partner');
    if (billingInfo.adminGrantedAccess) specialAccess.push('admin_granted');
    if (billingInfo.earlyAdopterAccess) specialAccess.push('early_adopter');
    if (hasValidEarlyAccess) specialAccess.push('early_access');

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
    specialAccess
  };
}

subscriptionsRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const billingInfo = db.billingRecords.get(userId);
  const entitlements = resolveUserEntitlements(userId);
  
  res.json({
    success: true,
    data: {
      billing: billingInfo || null,
      entitlements,
      availablePlans
    }
  });
});

