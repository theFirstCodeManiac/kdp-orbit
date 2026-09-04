import React, { createContext, useContext, useState, useEffect } from 'react';

type PlanId = 'free_starter' | 'author_pro' | 'publisher_elite' | string;

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
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
  upgradePlan: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<void>; // legacy mock
  checkoutPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<void>;
  grantEarlyAccess: (days?: number) => Promise<void>;
  grantLifetimePartner: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entitlements, setEntitlements] = useState<SubscriptionEntitlements | null>(null);
  const [billing, setBilling] = useState<any | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await fetch('/api/subscriptions/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEntitlements(data.data.entitlements);
        setBilling(data.data.billing);
        setAvailablePlans(data.data.availablePlans);
      }
    } catch (e) {
      console.error("Failed to load subscription context", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  const canAccess = (featureKey: string) => {
    if (!entitlements) return false;
    return !!entitlements.features[featureKey];
  };

  const getLimit = (limitKey: string) => {
    if (!entitlements) return 0;
    return entitlements.limits[limitKey] || 0;
  };

  const upgradePlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/subscriptions/change-plan', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planId, billingCycle })
    });
    
    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error('Failed to change plan');
    }
  };

  const checkoutPlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planId, billingCycle })
    });
    
    const data = await res.json();
    if (res.ok && data.success && data.data.checkoutUrl) {
      // Redirect to provider hosted checkout
      window.location.href = data.data.checkoutUrl;
    } else {
      throw new Error(data.error || 'Failed to initiate checkout');
    }
  };

  const grantEarlyAccess = async (days = 30) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/subscriptions/grant-early-access', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ days })
    });
    
    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error('Failed to grant early access');
    }
  };

  const grantLifetimePartner = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/subscriptions/grant-lifetime-partner', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      await refreshSubscription();
    } else {
      throw new Error('Failed to grant lifetime partner access');
    }
  };

  return (
    <SubscriptionContext.Provider value={{
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
      grantLifetimePartner
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
