import React, { useState, Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/context/AuthContext.tsx";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext.tsx";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext.tsx";
import { BRAND_CONFIG } from "@/src/config/brand.ts";
import { AuthPage } from "@/src/components/auth/AuthPage.tsx";
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
  Search,
  MoreHorizontal,
  ArrowRight,
  Sparkles,
  Globe,
  MessageSquare,
  Users,
  Star,
  ArrowUpRight,
  Sun,
  Moon,
  Menu,
} from "lucide-react";

type LandingPageKey = "home" | "about" | "pricing" | "contact" | "team";

const landingPages: Array<{ key: LandingPageKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "pricing", label: "Pricing" },
  { key: "contact", label: "Contact" },
  { key: "team", label: "Team" },
];

const socialProof = [
  { label: "Research signals tracked", value: "12K+" },
  { label: "Ideas validated", value: "9.4x" },
  { label: "Time saved", value: "48h" },
  { label: "User satisfaction", value: "96%" },
];

const featureCards = [
  {
    icon: Search,
    title: "Keyword research",
    description:
      "Surface high-intent phrases and market demand before you invest time.",
  },
  {
    icon: Target,
    title: "Niche research",
    description:
      "Discover underserved angles with stronger publishing potential.",
  },
  {
    icon: BookOpen,
    title: "Book research",
    description:
      "Study competitive books and understand why readers respond to them.",
  },
  {
    icon: Flame,
    title: "Opportunity discovery",
    description:
      "Focus on the ideas most likely to convert into sustainable pipeline.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    blurb: "For first-time authors testing ideas.",
    price: "Flexible",
    accent: "emerald",
    features: [
      "Core keyword insights",
      "Limited niche analysis",
      "AI cover prompts",
    ],
  },
  {
    name: "Pro",
    blurb: "Built for active publishing workflows.",
    price: "Most popular",
    accent: "sky",
    features: [
      "Full market scanning",
      "Saved research library",
      "Advanced trend alerts",
    ],
  },
  {
    name: "Elite",
    blurb: "For power users scaling production.",
    price: "Custom",
    accent: "violet",
    features: [
      "Team workspace",
      "Priority AI support",
      "Expanded publishing intelligence",
    ],
  },
];

const teamMembers = [
  {
    name: "Aisha Okafor",
    role: "Product strategist",
    bio: "Shapes the workflow around clarity, speed, and actual publishing outcomes.",
  },
  {
    name: "Daniel Sanni",
    role: "AI systems lead",
    bio: "Connects research, trend signals, and practical output for better decisions.",
  },
  {
    name: "Mariam Yusuf",
    role: "Design systems",
    bio: "Builds sharp, intuitive interfaces that stay readable on every device.",
  },
  {
    name: "Jude Eke",
    role: "Publisher operations",
    bio: "Keeps the product grounded in real publishing workflows and what teams need.",
  },
];

// Lazy loaded views
const ProfileAndSecurityView = lazy(() =>
  import("@/src/components/account/ProfileAndSecurityView.tsx").then((m) => ({
    default: m.ProfileAndSecurityView,
  })),
);
const DashboardView = lazy(() =>
  import("@/src/components/dashboard/DashboardView.tsx").then((m) => ({
    default: m.DashboardView,
  })),
);
const NicheResearchView = lazy(() =>
  import("@/src/components/niche/NicheResearchView.tsx").then((m) => ({
    default: m.NicheResearchView,
  })),
);
const BookResearchView = lazy(() =>
  import("@/src/components/books/BookResearchView.tsx").then((m) => ({
    default: m.BookResearchView,
  })),
);
const CompetitionAnalysisView = lazy(() =>
  import("@/src/components/competition/CompetitionAnalysisView.tsx").then(
    (m) => ({ default: m.CompetitionAnalysisView }),
  ),
);
const TrendingResearchView = lazy(() =>
  import("@/src/components/trends/TrendingResearchView.tsx").then((m) => ({
    default: m.TrendingResearchView,
  })),
);
const SavedResearchView = lazy(() =>
  import("@/src/components/saved/SavedResearchView.tsx").then((m) => ({
    default: m.SavedResearchView,
  })),
);
const CoverDesignerView = lazy(() =>
  import("@/src/components/cover/CoverDesignerView.tsx").then((m) => ({
    default: m.CoverDesignerView,
  })),
);
const AiAssistantView = lazy(() =>
  import("@/src/components/ai/AiAssistantView.tsx").then((m) => ({
    default: m.AiAssistantView,
  })),
);
const SubscriptionView = lazy(() =>
  import("@/src/components/subscription/SubscriptionView.tsx").then((m) => ({
    default: m.SubscriptionView,
  })),
);
const AdminDashboardView = lazy(() =>
  import("@/src/components/admin/AdminDashboardView.tsx").then((m) => ({
    default: m.AdminDashboardView,
  })),
);

const PageLoader = () => (
  <div
    className="flex h-full w-full items-center justify-center"
    style={{ minHeight: 400 }}
  >
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      <div className="text-sm font-medium text-slate-500">Loading view...</div>
    </div>
  </div>
);

const typewriterPhrases = [
  "Research smarter.",
  "Create better.",
  "Publish with confidence.",
];

const TypewriterHeadline = () => {
  return (
    <div className="inline-block text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
      Research smarter.
    </div>
  );
};

function MainApp() {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login",
  );
  const [landingPage, setLandingPage] = useState<LandingPageKey>(() => {
    if (typeof window === "undefined") return "home";
    const raw = window.location.hash.replace("#", "").trim();
    return landingPages.some((page) => page.key === raw)
      ? (raw as LandingPageKey)
      : "home";
  });
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "niche"
    | "book"
    | "competition"
    | "trends"
    | "saved"
    | "cover"
    | "ai"
    | "billing"
    | "account"
    | "admin"
  >("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      const nextHash = `#${landingPage}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }
  }, [landingPage, user]);

  const openAuth = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleTabChange = (
    tab:
      | "dashboard"
      | "niche"
      | "book"
      | "competition"
      | "trends"
      | "saved"
      | "cover"
      | "ai"
      | "billing"
      | "account"
      | "admin",
  ) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderLandingPage = () => {
    switch (landingPage) {
      case "about":
        return (
          <div className="page-shell">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                About
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Built for real publishing decisions.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                KDP Orbit helps authors and teams validate ideas before they
                invest time and capital.
              </p>
            </section>
          </div>
        );
      case "pricing":
        return (
          <div className="page-shell">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/40">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Pricing
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
                Flexible plans for different publishing stages.
              </h1>
            </section>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-6"
                >
                  <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">
                    {plan.name}
                  </div>
                  <div className="text-3xl font-black text-white">
                    {plan.price}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{plan.blurb}</p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </div>
        );
      case "contact":
        return (
          <div className="page-shell">
            <section className="grid gap-8 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Contact
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
                  Talk to the team.
                </h1>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8">
                <div className="grid gap-4">
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
                    placeholder="Your name"
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
                    placeholder="Email address"
                    type="email"
                  />
                  <textarea
                    className="min-h-28 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
                    placeholder="Tell us what you need"
                  />
                  <button className="rounded-xl bg-linear-to-r from-emerald-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950">
                    Send message
                  </button>
                </div>
              </div>
            </section>
          </div>
        );
      case "team":
        return (
          <div className="page-shell">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/40">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Team
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
                A sharp team building practical publishing tools.
              </h1>
            </section>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-sky-500 font-black text-lg text-slate-950">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-emerald-300">{member.role}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {member.bio}
                  </p>
                </div>
              ))}
            </section>
          </div>
        );
      case "home":
      default:
        return (
          <div className="page-shell">
            <section className="grid gap-8 rounded-4xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Smarter publishing starts here
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  <TypewriterHeadline />
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  KDP Orbit turns raw publishing signals into focused decisions
                  so authors and teams can move faster with more clarity.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => openAuth("register")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-emerald-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20"
                  >
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLandingPage("pricing")}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Explore pricing
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Opportunity pulse</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">
                    Live
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <div className="text-2xl font-black text-white">92</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      Score
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <div className="text-2xl font-black text-white">8.4k</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      Search
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <div className="text-2xl font-black text-white">High</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      Trend
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-4">
              {socialProof.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <div className="text-2xl font-black text-white">
                    {item.value}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    {item.label}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {description}
                  </p>
                </div>
              ))}
            </section>
          </div>
        );
    }
  };

  const renderAuthenticatedApp = () => {
    const navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "niche", label: "Niches", icon: Target },
      { id: "book", label: "Books", icon: BookOpen },
      { id: "competition", label: "Competition", icon: Swords },
      { id: "trends", label: "Trends", icon: Flame },
      { id: "saved", label: "Saved", icon: Bookmark },
      { id: "cover", label: "Cover", icon: Paintbrush },
      { id: "ai", label: "AI", icon: Bot },
      { id: "billing", label: "Plans", icon: CreditCard },
      { id: "account", label: "Account", icon: Shield },
      ...(user?.role === "admin" ? [{ id: "admin", label: "Admin", icon: Server }] : []),
    ] as const;

    const content = (() => {
      switch (activeTab) {
        case "niche":
          return <NicheResearchView />;
        case "book":
          return <BookResearchView />;
        case "competition":
          return <CompetitionAnalysisView />;
        case "trends":
          return <TrendingResearchView />;
        case "saved":
          return (
            <SavedResearchView
              onNavigateToNiche={() => setActiveTab("niche")}
              onNavigateToBook={() => setActiveTab("book")}
              onNavigateToKeyword={() => setActiveTab("book")}
            />
          );
        case "cover":
          return <CoverDesignerView />;
        case "ai":
          return <AiAssistantView />;
        case "billing":
          return <SubscriptionView />;
        case "admin":
          return <AdminDashboardView />;
        case "account":
          return <ProfileAndSecurityView />;
        case "dashboard":
        default:
          return (
            <DashboardView
              onNavigateToNiche={() => setActiveTab("niche")}
              onNavigateToBook={() => setActiveTab("book")}
            />
          );
      }
    })();

    return (
      <div className={`min-h-screen transition-colors duration-200 ${theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          theme === "dark" ? "border-white/10 bg-slate-950/80" : "border-slate-200 bg-white/85"
        }`}>
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-3 cursor-pointer shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-sky-500 text-slate-950 shadow-lg shadow-emerald-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="text-left hidden sm:block">
                <div className={`text-base font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {BRAND_CONFIG.name}
                </div>
                <div className={`text-[10px] uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Publishing workflow
                </div>
              </div>
            </button>

            <nav className="hidden flex-1 items-center justify-center gap-1.5 overflow-x-auto md:flex px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id as any)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? theme === "dark"
                          ? "bg-white/10 text-white shadow-xs"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs"
                        : theme === "dark"
                          ? "text-slate-300 hover:bg-white/5 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition cursor-pointer ${
                  theme === "dark"
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={logout}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition cursor-pointer ${
                  theme === "dark"
                    ? "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border md:hidden cursor-pointer ${
                  theme === "dark"
                    ? "border-white/10 bg-white/5 text-slate-200"
                    : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className={`border-t md:hidden transition-colors ${
              theme === "dark" ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95"
            }`}>
              <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id as any)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                        isActive
                          ? theme === "dark"
                            ? "bg-white/10 text-white"
                            : "bg-indigo-50 text-indigo-700 font-semibold"
                          : theme === "dark"
                            ? "text-slate-300 hover:bg-white/5"
                            : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<PageLoader />}>
            {content}
          </Suspense>
        </main>
      </div>
    );
  };

  if (authModalOpen && !user) {
    return (
      <AuthPage
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      {!user ? (
        <>
          <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
            theme === "dark" ? "border-white/10 bg-slate-950/75" : "border-slate-200 bg-white/80"
          }`}>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setLandingPage("home")}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-sky-500 text-slate-950 shadow-lg shadow-emerald-500/20">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className={`text-base font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    {BRAND_CONFIG.name}
                  </div>
                  <div className={`text-[10px] uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Futuristic publishing
                  </div>
                </div>
              </button>

              <nav className="hidden flex-1 items-center justify-center gap-2 overflow-x-auto md:flex">
                {landingPages.map((page) => (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => setLandingPage(page.key)}
                    className={`rounded-full px-3 py-2 text-sm transition cursor-pointer ${
                      landingPage === page.key
                        ? theme === "dark" ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900 font-semibold"
                        : theme === "dark" ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition cursor-pointer ${
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition cursor-pointer ${
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <LogIn className="h-4 w-4" /> Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="hidden items-center gap-2 rounded-full bg-linear-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 sm:inline-flex cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Create Account
                </button>
              </div>
            </div>
          </header>

          <main className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-[-10%] top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-[-10%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-10">
              {renderLandingPage()}
            </div>
          </main>
        </>
      ) : (
        renderAuthenticatedApp()
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <MainApp />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const mobileNavItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "book", label: "Search", icon: Search },
  { id: "niche", label: "Niche", icon: Target },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "more", label: "More", icon: MoreHorizontal },
] as const;

const mobileSecondaryActions = [
  { id: "cover", label: "Cover", icon: Paintbrush },
  { id: "billing", label: "Plans", icon: CreditCard },
  { id: "account", label: "Account", icon: Shield },
] as const;
