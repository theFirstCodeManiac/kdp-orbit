import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { QuickActionModal, QuickActionType } from './QuickActionModal.tsx';
import {
  Search,
  Compass,
  BookOpen,
  Palette,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Zap,
  Bookmark,
  Layers,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Award,
  CheckCircle2,
  FolderOpen,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface DashboardData {
  welcome: {
    displayName: string;
    greeting: string;
    role: string;
    country: string;
    preferredCurrency: 'NGN' | 'USD' | 'GBP';
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
    keywordSearches: { used: number; limit: number; remaining: number; percent: number };
    nicheQueries: { used: number; limit: number; remaining: number; percent: number };
    aiCredits: { used: number; limit: number; remaining: number; percent: number };
    coverExports: { used: number; limit: number; remaining: number; percent: number };
  };
  recentSearches: Array<{
    id: string;
    userId: string;
    query: string;
    type: 'keyword' | 'niche' | 'book';
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
  recentProjects: Array<{
    id: string;
    type: 'cover' | 'niche';
    title: string;
    subtitle: string;
    badge: string;
    spineWidth?: string;
    updatedAt: string;
  }>;
  recentCovers: Array<{
    id: string;
    title: string;
    trimSize: string;
    pageCount: number;
    paperType: string;
    spineWidthInches: number;
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

export const DashboardView: React.FC<{ onNavigateToNiche?: () => void; onNavigateToBook?: () => void }> = ({ onNavigateToNiche, onNavigateToBook }) => {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType>('keyword');
  const [selectedNiche, setSelectedNiche] = useState<any | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load dashboard.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error loading dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleOpenQuickAction = (type: QuickActionType) => {
    if (type === 'niche' && onNavigateToNiche) {
      onNavigateToNiche();
      return;
    }
    if (type === 'book' && onNavigateToBook) {
      onNavigateToBook();
      return;
    }
    setActiveQuickAction(type);
    setQuickActionModalOpen(true);
  };

  const formatCurrency = (valUSD: number) => {
    if (!data) return `$${valUSD.toLocaleString()}`;
    if (data.welcome.preferredCurrency === 'NGN') {
      const ngnRate = 1450;
      return `₦${(valUSD * ngnRate).toLocaleString()}`;
    }
    return `$${valUSD.toLocaleString()}`;
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
      return 'recent';
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 py-6">
        <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center my-8">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
        <p className="text-sm font-semibold text-rose-900">{error || 'Unable to load dashboard.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div id="kdp-dashboard-container" className="space-y-8 pb-12">
      {/* 1. WELCOME HEADER & SUBSCRIPTION SUMMARY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace • KDP Orbit Production Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data.welcome.greeting}!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your Amazon KDP intelligence hub is online. Here is your current publishing velocity, real-time quota
              consumption, and curated market breakout opportunities.
            </p>
          </div>

          {/* Current Subscription Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Current Subscription
                </div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{data.subscription.planName}</span>
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-semibold uppercase">
                    {data.subscription.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {data.subscription.currency === 'NGN'
                    ? `₦${(data.subscription.amount || 0).toLocaleString()}/month`
                    : `$${data.subscription.amount || 0}/month`}{' '}
                  • Renews {data.subscription.nextBillingDate}
                </div>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center text-xs text-slate-500">
              <span>Card ending in •••• {data.subscription.paymentMethodLast4}</span>
              <span className="text-[11px] text-slate-400">
                Region: {data.welcome.country === 'NG' ? 'Nigeria (NGN)' : 'Global (USD)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REMAINING RESEARCH CREDITS & USAGE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Remaining Research Credits & Monthly Quota ({data.usage.month})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Resets on 1st of next month</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Searches */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-emerald-600" /> Keyword Audits
              </span>
              <span className="font-medium text-slate-500">{data.usage.keywordSearches.remaining} left</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-slate-900">
                {data.usage.keywordSearches.remaining}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {data.usage.keywordSearches.used} / {data.usage.keywordSearches.limit} used
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${data.usage.keywordSearches.percent}%` }}
              />
            </div>
          </div>

          {/* Niche Deep Dives */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-blue-600" /> Niche Deep Dives
              </span>
              <span className="font-medium text-slate-500">{data.usage.nicheQueries.remaining} left</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-slate-900">
                {data.usage.nicheQueries.remaining}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {data.usage.nicheQueries.used} / {data.usage.nicheQueries.limit} used
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${data.usage.nicheQueries.percent}%` }}
              />
            </div>
          </div>

          {/* AI Credits */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> AI Prompts & Blurbs
              </span>
              <span className="font-medium text-slate-500">{data.usage.aiCredits.remaining} left</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-slate-900">
                {data.usage.aiCredits.remaining}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {data.usage.aiCredits.used} / {data.usage.aiCredits.limit} used
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${data.usage.aiCredits.percent}%` }}
              />
            </div>
          </div>

          {/* Cover Exports */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-amber-600" /> KDP Cover Exports
              </span>
              <span className="font-medium text-slate-500">{data.usage.coverExports.remaining} left</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-slate-900">
                {data.usage.coverExports.remaining}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {data.usage.coverExports.used} / {data.usage.coverExports.limit} used
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-500"
                style={{ width: `${data.usage.coverExports.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Publishing Quick Actions
          </h2>
          <span className="text-xs text-slate-500">Launch direct analysis tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            id="qa-keyword-btn"
            onClick={() => handleOpenQuickAction('keyword')}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs transition text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition mb-3">
              <Search className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
              Research a Keyword
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Search volume & CPC</span>
          </button>

          <button
            id="qa-niche-btn"
            onClick={() => handleOpenQuickAction('niche')}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xs transition text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition mb-3">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
              Find a Niche
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Score & saturation</span>
          </button>

          <button
            id="qa-book-btn"
            onClick={() => handleOpenQuickAction('book')}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-xs transition text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
              Research a Book
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Reverse BSR & royalties</span>
          </button>

          <button
            id="qa-cover-btn"
            onClick={() => handleOpenQuickAction('cover')}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:shadow-xs transition text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition mb-3">
              <Palette className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
              Create a Cover
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Spine & bleed calculator</span>
          </button>

          <button
            id="qa-ai-btn"
            onClick={() => handleOpenQuickAction('ai')}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-xs transition text-left group col-span-2 sm:col-span-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
              Ask AI
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Backend keywords & blurbs</span>
          </button>
        </div>
      </div>

      {/* 4. TRENDING OPPORTUNITIES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Trending Amazon Opportunities (Live Algorithmic Radar)
            </h2>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Real Market Signals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.trendingOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {opp.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                      {opp.keyword}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      Score: {opp.opportunityScore}/100
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opp.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  <strong className="text-slate-700">Market Signal:</strong> {opp.whyHot}
                </p>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-4 gap-2 text-center py-2.5 border-y border-slate-100 mb-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Demand</div>
                    <div className="font-bold text-slate-800">{opp.demand}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Competition</div>
                    <div className="font-bold text-slate-800">{opp.competition}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Avg BSR</div>
                    <div className="font-bold text-slate-800">#{(opp.avgBSR || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Est. Monthly Rev</div>
                    <div className="font-bold text-emerald-700">{formatCurrency(opp.estimatedMonthlyRevenueUSD)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Est. CPC Bid: ${(opp.cpcUSD || 0).toFixed(2)} • {(opp.monthlySearches || 0).toLocaleString()} searches/mo
                </span>
                <button
                  onClick={() => {
                    handleOpenQuickAction('keyword');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
                >
                  Inspect Keyword <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SAVED NICHES & RECENT SEARCHES DUAL COLUMN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Niches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Saved Niches & Categories ({data.savedNiches.length})
              </h2>
            </div>
            <button
              onClick={() => handleOpenQuickAction('niche')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Find New Niche
            </button>
          </div>

          <div className="space-y-3">
            {data.savedNiches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white">
                <FolderOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-600">No saved niches yet.</p>
                <button
                  onClick={() => handleOpenQuickAction('niche')}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Explore high-opportunity categories
                </button>
              </div>
            ) : (
              data.savedNiches.map((niche) => (
                <div
                  key={niche.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                        {niche.payload?.categoryPath || 'Amazon Sub-Category'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{niche.title}</h4>
                      {niche.payload?.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {niche.payload.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                        Score: {niche.payload?.opportunityScore || 85}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{timeAgo(niche.createdAt)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span>
                      Avg BSR: #{niche.payload?.avgBSR?.toLocaleString() || '14,200'} • Daily Sales: ~
                      {niche.payload?.dailySalesTop10 || '24'}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      Est. {formatCurrency(niche.payload?.estimatedRevenueUSD || 1850)}/mo
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Recent Searches & Audits
              </h2>
            </div>
            <span className="text-xs text-slate-400">Last 5 actions</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {data.recentSearches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent searches logged in this session.
              </div>
            ) : (
              data.recentSearches.map((search) => (
                <div
                  key={search.id}
                  className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      {search.type === 'niche' ? (
                        <Compass className="h-4 w-4 text-blue-600" />
                      ) : search.type === 'book' ? (
                        <BookOpen className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Search className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {search.query}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {search.type} search • {search.resultsCount} Amazon catalog results
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">{timeAgo(search.timestamp)}</span>
                    <button
                      onClick={() => handleOpenQuickAction(search.type as QuickActionType)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Re-audit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. RECENT PROJECTS & RECENT COVERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Publishing Projects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Recent Projects ({data.recentProjects.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">All active work</span>
          </div>

          <div className="space-y-3">
            {data.recentProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white text-xs text-slate-500">
                No active projects found. Start a cover or save a niche.
              </div>
            ) : (
              data.recentProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-purple-300 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      {proj.type === 'cover' ? <Palette className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{proj.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{proj.subtitle}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {proj.badge}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{timeAgo(proj.updatedAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Covers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Recent Covers ({data.recentCovers.length})
              </h2>
            </div>
            <button
              onClick={() => handleOpenQuickAction('cover')}
              className="text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              + New Cover Spec
            </button>
          </div>

          <div className="space-y-3">
            {data.recentCovers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white text-xs text-slate-500">
                No custom book covers created yet.
              </div>
            ) : (
              data.recentCovers.map((cover) => (
                <div
                  key={cover.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-amber-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                        KDP Print Template
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{cover.title}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                        {cover.trimSize}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{timeAgo(cover.createdAt)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span>
                      Page Count: {cover.pageCount} pages ({cover.paperType} paper)
                    </span>
                    <span className="font-semibold text-slate-700">
                      Spine: {cover.spineWidthInches} in
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        initialAction={activeQuickAction}
        onActionComplete={fetchDashboard}
      />
    </div>
  );
};
