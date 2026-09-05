import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from '@/src/context/AuthContext.tsx';
import { SubscriptionProvider } from '@/src/context/SubscriptionContext.tsx';
import { BRAND_CONFIG } from '@/src/config/brand.ts';
import { AuthModal } from '@/src/components/auth/AuthModal.tsx';

// Lazy loaded views
const ProfileAndSecurityView = lazy(() => import('@/src/components/account/ProfileAndSecurityView.tsx').then(m => ({ default: m.ProfileAndSecurityView })));
const DashboardView = lazy(() => import('@/src/components/dashboard/DashboardView.tsx').then(m => ({ default: m.DashboardView })));
const NicheResearchView = lazy(() => import('@/src/components/niche/NicheResearchView.tsx').then(m => ({ default: m.NicheResearchView })));
const BookResearchView = lazy(() => import('@/src/components/books/BookResearchView.tsx').then(m => ({ default: m.BookResearchView })));
const CompetitionAnalysisView = lazy(() => import('@/src/components/competition/CompetitionAnalysisView.tsx').then(m => ({ default: m.CompetitionAnalysisView })));
const TrendingResearchView = lazy(() => import('@/src/components/trends/TrendingResearchView.tsx').then(m => ({ default: m.TrendingResearchView })));
const SavedResearchView = lazy(() => import('@/src/components/saved/SavedResearchView.tsx').then(m => ({ default: m.SavedResearchView })));
const CoverDesignerView = lazy(() => import('@/src/components/cover/CoverDesignerView.tsx').then(m => ({ default: m.CoverDesignerView })));
const AiAssistantView = lazy(() => import('@/src/components/ai/AiAssistantView.tsx').then(m => ({ default: m.AiAssistantView })));
const SubscriptionView = lazy(() => import('@/src/components/subscription/SubscriptionView.tsx').then(m => ({ default: m.SubscriptionView })));
const AdminDashboardView = lazy(() => import('@/src/components/admin/AdminDashboardView.tsx').then(m => ({ default: m.AdminDashboardView })));

// Loading fallback
const PageLoader = () => (
  <div className="flex h-full min-h-[400px] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      <div className="text-sm font-medium text-slate-500">Loading view...</div>
    </div>
  </div>
);

import {
  BookOpen,
  LayoutDashboard,
  Target,
  Swords,
  Flame,
  Shield,
  LogIn,
  UserPlus,
  LogOut,
  Lock,
  Server,
  Zap,
  Bookmark,
  Paintbrush,
  Bot,
  CreditCard,
} from 'lucide-react';

function MainApp() {
  const { user, logout, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'niche' | 'book' | 'competition' | 'trends' | 'saved' | 'cover' | 'ai' | 'billing' | 'account' | 'admin'>('dashboard');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Banner: Stage Notification */}
      <div className="bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-semibold">{BRAND_CONFIG.name}</span>
            <span className="text-slate-400">| Phase 3: High-Utility Publishing & Intelligence Dashboard</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" /> Real-Time Quotas
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" /> Isolated Tenant Store
            </span>
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3 text-emerald-400" /> HTTP 403 Guards
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-slate-900 tracking-tight">{BRAND_CONFIG.name}</span>
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {BRAND_CONFIG.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">{BRAND_CONFIG.tagline}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 text-xs font-medium">
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-niche-btn"
              onClick={() => setActiveTab('niche')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'niche'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>Niche Finder</span>
            </button>
            <button
              id="nav-book-btn"
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'book'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span>Book Research</span>
            </button>
            <button
              id="nav-comp-btn"
              onClick={() => setActiveTab('competition')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'competition'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Swords className="h-3.5 w-3.5 text-orange-600" />
              <span>Competition</span>
            </button>
            <button
              id="nav-trends-btn"
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'trends'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-violet-600" />
              <span>Trends</span>
            </button>
            <button
              id="nav-saved-btn"
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'saved'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 text-rose-500" />
              <span>Saved</span>
            </button>
            <button
              id="nav-cover-btn"
              onClick={() => setActiveTab('cover')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'cover'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Paintbrush className="h-3.5 w-3.5 text-fuchsia-500" />
              <span>Design</span>
            </button>
            <button
              id="nav-ai-btn"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'ai'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-indigo-500" />
              <span>AI Assistant</span>
            </button>
            <button
              id="nav-account-btn"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'account'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Security & Account</span>
            </button>
            <button
              id="nav-billing-btn"
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'billing'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-sky-600" />
              <span>Billing & Plans</span>
            </button>
            {user?.role === 'admin' && (
              <button
                id="nav-admin-btn"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                  activeTab === 'admin'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Server className="h-3.5 w-3.5 text-indigo-600" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* User Status / Actions */}
          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <button
                  id="user-profile-header-btn"
                  onClick={() => setActiveTab('account')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-left hover:border-slate-300 transition"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                    {user.displayName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900">{user.displayName}</div>
                    <div className="text-[10px] text-slate-500">
                      {user.country === 'NG' ? '🇳🇬 NGN Plan' : '🇺🇸 USD Plan'} • {user.role}
                    </div>
                  </div>
                </button>
                <button
                  id="user-logout-btn"
                  onClick={() => logout()}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-signin-btn"
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </button>
                <button
                  id="header-register-btn"
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${activeTab === 'cover' ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Suspense fallback={<PageLoader />}>
          {activeTab === 'account' ? (
            <ProfileAndSecurityView />
          ) : activeTab === 'niche' ? (
            <NicheResearchView />
          ) : activeTab === 'book' ? (
            <BookResearchView />
          ) : activeTab === 'competition' ? (
            <CompetitionAnalysisView />
          ) : activeTab === 'trends' ? (
            <TrendingResearchView />
          ) : activeTab === 'saved' ? (
            <SavedResearchView 
              onNavigateToNiche={() => setActiveTab('niche')} 
              onNavigateToBook={() => setActiveTab('book')} 
            />
          ) : activeTab === 'cover' ? (
            <CoverDesignerView />
          ) : activeTab === 'ai' ? (
            <AiAssistantView />
          ) : activeTab === 'billing' ? (
            <SubscriptionView />
          ) : activeTab === 'admin' ? (
            <AdminDashboardView />
          ) : (
            <DashboardView onNavigateToNiche={() => setActiveTab('niche')} onNavigateToBook={() => setActiveTab('book')} />
          )}
        </Suspense>
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <MainApp />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
