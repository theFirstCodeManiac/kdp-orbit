import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import { QuickActionModal, QuickActionType } from "./QuickActionModal.tsx";
import {
  OnboardingModal,
  getOnboardingProfile,
  OnboardingAnswers,
} from "./OnboardingModal.tsx";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  formatMoney,
  getLocaleForRegion,
  convertUsdToCurrency,
} from "@/src/config/i18n.ts";

interface DashboardData {
  welcome: {
    displayName: string;
    greeting: string;
    role: string;
    country: string;
    preferredCurrency: "NGN" | "USD" | "GBP";
    lastLoginAt: string;
  };
  subscription: {
    planId: string;
    planName: string;
    status: string;
    currency: string;
    amount: number;
    nextBillingDate: string;
    paymentMethodLast4: string;
  };
  usage: {
    month: string;
    keywordSearches: {
      used: number;
      limit: number;
      remaining: number;
      percent: number;
    };
    nicheQueries: {
      used: number;
      limit: number;
      remaining: number;
      percent: number;
    };
    aiCredits: {
      used: number;
      limit: number;
      remaining: number;
      percent: number;
    };
    coverExports: {
      used: number;
      limit: number;
      remaining: number;
      percent: number;
    };
  };
  recentSearches: Array<{
    id: string;
    userId: string;
    query: string;
    type: "keyword" | "niche" | "book";
    resultsCount: number;
    timestamp: string;
  }>;
  savedNiches: Array<{
    id: string;
    title: string;
    type: string;
    payload: any;
    createdAt: string;
  }>;
  trendingOpportunities: Array<{
    id: string;
    keyword: string;
    category: string;
    opportunityScore: number;
    rating: string;
    demand: string;
    competition: string;
    trend: string;
    avgBSR: number;
    monthlySearches: number;
    estimatedMonthlyRevenueUSD: number;
    cpcUSD: number;
    whyHot: string;
  }>;
}

export const DashboardView: React.FC<{
  onNavigateToNiche?: () => void;
  onNavigateToBook?: () => void;
  theme?: "dark" | "light";
}> = ({ onNavigateToNiche, onNavigateToBook, theme = "dark" }) => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] =
    useState<QuickActionType>("keyword");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers | null>(() =>
    getOnboardingProfile(),
  );

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(
          json.error?.message ||
            "We couldn't load your dashboard right now. Please try again.",
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(
        "Something went wrong. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const profile = getOnboardingProfile();
    setOnboarding(profile);
    setOnboardingOpen(!profile || (!profile.completed && !profile.skipped));
  }, []);

  const handleOpenQuickAction = (type: QuickActionType) => {
    if (type === "niche" && onNavigateToNiche) {
      onNavigateToNiche();
      return;
    }
    if (type === "book" && onNavigateToBook) {
      onNavigateToBook();
      return;
    }
    setActiveQuickAction(type);
    setQuickActionModalOpen(true);
  };

  const formatCurrency = (valUSD: number) => {
    if (!data) return formatMoney(valUSD, "USD", "en-US");

    const currency = (data.welcome.preferredCurrency ?? "NGN") as
      | "NGN"
      | "USD"
      | "GBP";
    const locale = getLocaleForRegion(data.welcome.country ?? "NG");
    const amount =
      currency === "USD" ? valUSD : convertUsdToCurrency(valUSD, currency);

    return formatMoney(amount, currency, locale);
  };

  const timeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "recent";
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 py-6">
        <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-800/70" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="my-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-600" />
        <p className="text-sm font-semibold text-rose-900">
          {error || "Unable to load dashboard."}
        </p>
        <button
          onClick={fetchDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: "Keyword searches",
      value: data.usage.keywordSearches.remaining,
      meta: `${data.usage.keywordSearches.used}/${data.usage.keywordSearches.limit} used`,
    },
    {
      label: "Niche dives",
      value: data.usage.nicheQueries.remaining,
      meta: `${data.usage.nicheQueries.used}/${data.usage.nicheQueries.limit} used`,
    },
    {
      label: "AI credits",
      value: data.usage.aiCredits.remaining,
      meta: `${data.usage.aiCredits.used}/${data.usage.aiCredits.limit} used`,
    },
    {
      label: "Cover exports",
      value: data.usage.coverExports.remaining,
      meta: `${data.usage.coverExports.used}/${data.usage.coverExports.limit} used`,
    },
  ];

  return (
    <div className="space-y-6 pb-10 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live workspace
            </div>
            <h1 className="text-2xl font-bold text-white">
              {data.welcome.greeting}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Welcome back. Your KDP research pipeline is active and ready.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
            <div className="font-semibold text-white">
              {data.subscription.planName}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {formatMoney(
                data.subscription.amount || 0,
                data.subscription.currency === "NGN" ? "NGN" : "USD",
                getLocaleForRegion(data.welcome.country || "NG"),
              )}{" "}
              / month
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="text-xs font-medium text-slate-400">
              {stat.label}
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-slate-400">{stat.meta}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Trending opportunities
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              Market signal
            </span>
          </div>
          <div className="space-y-3">
            {data.trendingOpportunities.slice(0, 3).map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-white">{opp.keyword}</div>
                  <span className="text-xs font-semibold text-emerald-300">
                    {opp.opportunityScore}/100
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-300">{opp.whyHot}</div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Est. rev {formatCurrency(opp.estimatedMonthlyRevenueUSD)} •
                  BSR #{(opp.avgBSR || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Saved niches
            </h2>
            <button
              type="button"
              onClick={() => handleOpenQuickAction("niche")}
              className="text-xs font-semibold text-emerald-300"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {data.savedNiches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No saved niches yet.
              </div>
            ) : (
              data.savedNiches.slice(0, 3).map((niche) => (
                <div
                  key={niche.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="font-semibold text-white">{niche.title}</div>
                  <div className="mt-1 text-xs text-slate-300">
                    {niche.payload?.notes || "Saved for later review"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Recent searches
            </h2>
            <span className="text-[10px] text-slate-400">Last actions</span>
          </div>
          <div className="space-y-2">
            {data.recentSearches.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <span className="truncate pr-2 text-slate-200">
                  {entry.query}
                </span>
                <span className="text-[10px] text-slate-400">
                  {timeAgo(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Quick actions
            </h2>
            <span className="text-[10px] text-slate-400">Jump in</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOpenQuickAction("keyword")}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-left text-xs font-medium text-emerald-200"
            >
              Keyword research
            </button>
            <button
              type="button"
              onClick={() => handleOpenQuickAction("niche")}
              className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-left text-xs font-medium text-blue-200"
            >
              Niche research
            </button>
            <button
              type="button"
              onClick={() => handleOpenQuickAction("book")}
              className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-left text-xs font-medium text-violet-200"
            >
              Book research
            </button>
            <button
              type="button"
              onClick={() => handleOpenQuickAction("cover")}
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-left text-xs font-medium text-amber-200"
            >
              Cover editor
            </button>
          </div>
        </div>
      </div>

      <QuickActionModal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        initialAction={activeQuickAction}
        onActionComplete={fetchDashboard}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={(answers) => setOnboarding(answers)}
      />
    </div>
  );
};
