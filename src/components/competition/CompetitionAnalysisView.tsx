import React, { useState, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import {
  Search,
  Swords,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Tags,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  formatMoney,
  convertUsdToCurrency,
  getLocaleForRegion,
} from "@/src/config/i18n.ts";

interface CompetitionData {
  keyword: string;
  competitionLevel: "Low" | "Moderate" | "High";
  summaryReason: string;
  metrics: {
    totalBooksFound: number;
    avgPrice: number;
    avgReviews: number;
    avgRating: number;
    bestsellerCount: number;
  };
  successfulBookProfile: string;
  marketTrend: "Growing" | "Stable" | "Declining";
  topKeywords: { word: string; overlap: number }[];
  distributions: {
    price: { range: string; percentage: number }[];
    rating: { range: string; percentage: number }[];
    publication: { year: string; count: number }[];
  };
}

export const CompetitionAnalysisView: React.FC = () => {
  const { token, user } = useAuth();
  const locale = getLocaleForRegion(user?.country || "NG");
  const formatLocalPrice = (amountUsd: number) =>
    formatMoney(convertUsdToCurrency(amountUsd, "NGN"), "NGN", locale);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailed, setShowDetailed] = useState(false);

  const performAnalysis = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!token || !query.trim()) return;

      setIsLoading(true);
      setError(null);
      setData(null);
      setShowDetailed(false);

      try {
        const res = await fetch("/api/competition/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ keyword: query }),
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(
            json.error?.message ||
              "We couldn't analyze the competition right now. Please try again.",
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
    },
    [query, token],
  );

  const levelColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "Moderate":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "High":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 border border-orange-200 mb-3">
          <Swords className="h-3.5 w-3.5" />
          Competition Analysis
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Analyze Your Competition
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Understand how crowded a niche is, typical pricing, and what
          successful books look like.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 max-w-3xl">
        <form onSubmit={performAnalysis} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter a broad niche or keyword (e.g., 'Blank Journal', 'FODMAP Diet')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-transparent text-slate-900 focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-slate-900 text-white font-semibold rounded-lg px-6 py-3 text-sm hover:bg-slate-800 transition disabled:opacity-70 whitespace-nowrap"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => performAnalysis()}
            className="px-4 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-bold transition whitespace-nowrap"
          >
            Retry Request
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-slate-700">
            Analyzing Market Data
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Calculating crowding, pricing models, and keyword overlap...
          </p>
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-6">
          {/* Simple Summary (Beginner Friendly) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div
              className={`p-8 border-b text-center ${levelColor(data.competitionLevel).replace("border", "border-b")}`}
            >
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
                Competition Level
              </h2>
              <div className="text-4xl sm:text-5xl font-black mb-4">
                {data.competitionLevel}
              </div>
              <p className="max-w-2xl mx-auto text-sm sm:text-base opacity-90 leading-relaxed font-medium">
                {data.summaryReason}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 text-center">
              <div className="p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                  Books Found
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {data.metrics.totalBooksFound.toLocaleString()}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                  Avg Price
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {formatLocalPrice(data.metrics.avgPrice)}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                  Avg Reviews
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {data.metrics.avgReviews.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-slate-50">
                <button
                  onClick={() => setShowDetailed(!showDetailed)}
                  className="w-full h-full flex items-center justify-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  {showDetailed ? "Hide Details" : "Show Detailed Analysis"}
                  {showDetailed ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Analysis Section (Advanced) */}
          {showDetailed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
              {/* Successful Book Profile */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">
                    What Successful Books Look Like
                  </h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {data.successfulBookProfile}
                </p>
              </div>

              {/* Pricing Distribution */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Typical Pricing Distribution
                  </h3>
                </div>
                <div className="space-y-3">
                  {data.distributions.price.map((p, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          {p.range}
                        </span>
                        <span className="text-slate-500">{p.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${p.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Rating Distribution
                  </h3>
                </div>
                <div className="space-y-3">
                  {data.distributions.rating.map((r, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          {r.range} Stars
                        </span>
                        <span className="text-slate-500">{r.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${r.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publication Activity */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Publication Activity (Recent Years)
                  </h3>
                </div>
                <div className="h-40 flex items-end justify-between gap-2 pt-4">
                  {data.distributions.publication.map((pub, idx) => {
                    const max = Math.max(
                      ...data.distributions.publication.map((p) => p.count),
                    );
                    const height = (pub.count / max) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end group"
                      >
                        <div className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                          {pub.count} books
                        </div>
                        <div
                          className="w-full bg-emerald-100 hover:bg-emerald-300 rounded-t-sm transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-[10px] font-semibold text-slate-600 mt-2 text-center">
                          {pub.year}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Keyword Overlap */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Tags className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Keyword Overlap
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.topKeywords.map((kw, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center gap-2"
                    >
                      <span className="font-semibold text-slate-700">
                        {kw.word}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                        {kw.overlap}% overlap
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-3">
                  <Info className="h-3 w-3" />
                  Percentage of top 100 books ranking for this exact phrase.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
