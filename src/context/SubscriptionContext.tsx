import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  PRICING_CONFIG,
  type BillingInterval,
  type PricingPlan,
} from "@/src/config/pricing.ts";

export type PlanId = "free_starter" | "author_pro" | "publisher_elite" | string;

export interface SubscriptionPlan extends PricingPlan {
  id: string;
  name: string;
  currency: PricingPlan["currency"];
  prices: PricingPlan["prices"];
  features: Record<string, boolean>;
  usageLimits: Record<string, number>;
}

export interface SubscriptionEntitlements {
  planId: PlanId;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  specialAccess: string[];
}

interface SubscriptionContextType {
  entitlements: SubscriptionEntitlements | null;
  billing: any | null;
  availablePlans: SubscriptionPlan[];
  isLoading: boolean;
  canAccess: (featureKey: string) => boolean;
  getLimit: (limitKey: string) => number;
  refreshSubscription: () => Promise<void>;
  upgradePlan: (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => Promise<void>;
  checkoutPlan: (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => Promise<void>;
  grantEarlyAccess: (days?: number) => Promise<void>;
  grantLifetimePartner: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

const DEFAULT_AVAILABLE_PLANS: SubscriptionPlan[] = PRICING_CONFIG.plans.map(
  (plan) => ({
    ...plan,
    usageLimits: { ...plan.usageLimits },
    features: { ...plan.features },
    prices: { ...plan.prices },
  }),
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entitlements, setEntitlements] =
    useState<SubscriptionEntitlements | null>(null);
  const [billing, setBilling] = useState<any | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>(
    DEFAULT_AVAILABLE_PLANS,
  );
  const [isLoading, setIsLoading] = useState(true);

  const { token } = useAuth();

  const refreshSubscription = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await fetch("/api/subscriptions/me", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEntitlements(data.data.entitlements);
        setBilling(data.data.billing);
        setAvailablePlans(
          (data.data.availablePlans || DEFAULT_AVAILABLE_PLANS).map(
            (plan: any) => ({
              id: plan.id,
              name: plan.name,
              description: plan.description || "",
              currency: plan.currency || PRICING_CONFIG.defaultCurrency,
              prices: {
                ...(plan.prices || { monthly: 0, yearly: 0, lifetime: 0 }),
              },
              billingIntervals: plan.billingIntervals || ["monthly"],
              trialPeriodDays: plan.trialPeriodDays ?? 0,
              usageLimits: { ...(plan.usageLimits || {}) },
              features: { ...(plan.features || {}) },
              promotionalAccess: plan.promotionalAccess || [],
              isActive: plan.isActive ?? true,
            }),
          ),
        );
      }
    } catch (e) {
      console.error("Failed to load subscription context", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [token]);

  const canAccess = (featureKey: string) => {
    if (!entitlements) return false;
    return !!entitlements.features[featureKey];
  };

  const getLimit = (limitKey: string) => {
    if (!entitlements) return 0;
    return entitlements.limits[limitKey] || 0;
  };

  const upgradePlan = async (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => {
    if (!token) {
      throw new Error("Authentication required");
    }
    const res = await fetch("/api/subscriptions/change-plan", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId, billingCycle }),
    });

    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error("Failed to change plan");
    }
  };

  const checkoutPlan = async (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => {
    if (!token) {
      throw new Error("Authentication required");
    }
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId, billingCycle }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.data.checkoutUrl) {
      window.location.href = data.data.checkoutUrl;
    } else {
      throw new Error(data.error || "Failed to initiate checkout");
    }
  };

  const grantEarlyAccess = async (days = 30) => {
    if (!token) {
      throw new Error("Authentication required");
    }
    const res = await fetch("/api/subscriptions/grant-early-access", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ days }),
    });

    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error("Failed to grant early access");
    }
  };

  const grantLifetimePartner = async () => {
    if (!token) {
      throw new Error("Authentication required");
    }
    const res = await fetch("/api/subscriptions/grant-lifetime-partner", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error("Failed to grant lifetime partner access");
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        entitlements,
        billing,
        availablePlans,
        isLoading,
        canAccess,
        getLimit,
        refreshSubscription,
        upgradePlan,
        checkoutPlan,
        grantEarlyAccess,
        grantLifetimePartner,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
