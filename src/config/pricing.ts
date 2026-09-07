export type BillingInterval = "monthly" | "yearly" | "lifetime";
export type CurrencyCode = "NGN" | "USD" | "GBP";

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  currency: CurrencyCode;
  prices: Record<BillingInterval, number>;
  billingIntervals: BillingInterval[];
  trialPeriodDays: number;
  usageLimits: Record<string, number>;
  features: Record<string, boolean>;
  promotionalAccess: string[];
  isActive: boolean;
}

export const PRICING_CONFIG: {
  defaultCurrency: CurrencyCode;
  defaultBillingInterval: BillingInterval;
  plans: PricingPlan[];
} = {
  defaultCurrency: "NGN",
  defaultBillingInterval: "monthly",
  plans: [
    {
      id: "free_starter",
      name: "Free",
      description: "For early-stage authors exploring the platform.",
      currency: "NGN",
      prices: {
        monthly: 0,
        yearly: 0,
        lifetime: 0,
      },
      billingIntervals: ["monthly"],
      trialPeriodDays: 0,
      usageLimits: {
        keywordSearches: 15,
        nicheQueries: 5,
        aiCredits: 5,
        coverExports: 2,
      },
      features: {
        canExportCover: false,
        aiAssistant: false,
        premiumMetrics: false,
      },
      promotionalAccess: [],
      isActive: true,
    },
    {
      id: "author_pro",
      name: "Author Pro",
      description: "Built for serious indie authors shipping faster.",
      currency: "NGN",
      prices: {
        monthly: 14990,
        yearly: 149900,
        lifetime: 0,
      },
      billingIntervals: ["monthly", "yearly"],
      trialPeriodDays: 14,
      usageLimits: {
        keywordSearches: 250,
        nicheQueries: 100,
        aiCredits: 150,
        coverExports: 25,
      },
      features: {
        canExportCover: true,
        aiAssistant: true,
        premiumMetrics: true,
      },
      promotionalAccess: ["early_access"],
      isActive: true,
    },
    {
      id: "publisher_elite",
      name: "Publisher Elite",
      description:
        "For aggressive publishing operations and multi-title teams.",
      currency: "NGN",
      prices: {
        monthly: 34990,
        yearly: 349900,
        lifetime: 0,
      },
      billingIntervals: ["monthly", "yearly"],
      trialPeriodDays: 21,
      usageLimits: {
        keywordSearches: 1000,
        nicheQueries: 500,
        aiCredits: 1000,
        coverExports: 100,
      },
      features: {
        canExportCover: true,
        aiAssistant: true,
        premiumMetrics: true,
      },
      promotionalAccess: ["partner", "lifetime"],
      isActive: true,
    },
  ],
};

export const getPricingPlan = (planId: string) =>
  PRICING_CONFIG.plans.find((plan) => plan.id === planId) ??
  PRICING_CONFIG.plans[0];

export const getPlanPrice = (
  planId: string,
  billingInterval: BillingInterval = PRICING_CONFIG.defaultBillingInterval,
) => {
  const plan = getPricingPlan(planId);
  return plan.prices[billingInterval] ?? plan.prices.monthly;
};

export const getPlanDisplayPrice = (
  planId: string,
  billingInterval: BillingInterval = PRICING_CONFIG.defaultBillingInterval,
) => {
  const plan = getPricingPlan(planId);
  const amount = getPlanPrice(planId, billingInterval);
  return {
    amount,
    currency: plan.currency,
    billingInterval,
  };
};
