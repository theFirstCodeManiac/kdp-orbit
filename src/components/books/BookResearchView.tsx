import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import { analytics } from "@/src/services/analytics/analytics.ts";
import { useDebounce } from "@/src/hooks/useDebounce.ts";
import {
  Search,
  BookOpen,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { formatMoney, getLocaleForRegion, convertUsdToCurrency } from "@/src/config/i18n.ts";

const formatLocalizedMoney = (usdAmount: number) =>
  formatMoney(convertUsdToCurrency(usdAmount, "NGN"), "NGN", getLocaleForRegion("NG"));

interface BookOpportunity {
  asin: string;
  title: string;
  author: string;
  priceUSD: number;
  rating: number;
  reviewCount: number;
  publishDate: string;
  categories: string[];
  bestSellerRank: number;
  trend: "Up" | "Down" | "Flat";
  estimatedMonthlySales: number;
  revenueEstUSD: number;
}

export const BookResearchView: React.FC = () => {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [results, setResults] = useState<BookOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Map<string, string>>(new Map());

  // Load user's saved items to reflect saved status
  useEffect(() => {
    if (!token) return;
    const fetchSaved = async () => {
      try {
        const res = await fetch("/api/saved/items?collectionId=all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const map = new Map<string, string>();
          for (const item of json.data) {
            if (item.meta?.asin) {
              map.set(item.meta.asin, item.id);
            }
          }
          setSavedItemsMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch saved items:", err);
      }
    };
    fetchSaved();
  }, [token]);

  const performSearch = useCallback(
    async (searchQuery: string, pageNum: number = 1) => {
      if (!token) return;

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const res = await fetch("/api/books/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: searchQuery,
            page: pageNum,
            limit: 10,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
          if (json.pagination) {
            setTotalPages(json.pagination.totalPages);
          }
          analytics.track(
            "search_performed",
            {
              source: "book_research",
              result_count: Array.isArray(json.data) ? json.data.length : 0,
            },
            user?.id,
          );
          analytics.track(
            "book_analyzed",
            {
              source: "book_research",
              result_count: Array.isArray(json.data) ? json.data.length : 0,
            },
            user?.id,
          );
        } else {
          setError(
            json.error?.message ||
              "We couldn't complete your search right now. Please try again.",
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
    [token],
  );

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      performSearch(debouncedQuery, page);
    }
  }, [debouncedQuery, page, performSearch]);

  const toggleSaveBook = async (book: BookOpportunity) => {
    if (!token) return;
    const isCurrentlySaved = savedItemsMap.has(book.asin);

    if (isCurrentlySaved) {
      const savedId = savedItemsMap.get(book.asin);
      // Optimistic update
      setSavedItemsMap((prev) => {
        const next = new Map(prev);
        next.delete(book.asin);
        return next;
      });

      if (savedId) {
        try {
          await fetch(`/api/saved/items/${savedId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error("Failed to remove saved book:", err);
        }
      }
    } else {
      try {
        const res = await fetch("/api/saved/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: "book",
            title: book.title,
            subtitle: `by ${book.author} • BSR #${book.bestSellerRank.toLocaleString()}`,
            meta: {
              asin: book.asin,
              author: book.author,
              priceUSD: book.priceUSD,
              rating: book.rating,
              reviewCount: book.reviewCount,
              bestSellerRank: book.bestSellerRank,
              estimatedMonthlySales: book.estimatedMonthlySales,
              revenueEstUSD: book.revenueEstUSD,
              categories: book.categories
            }
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          setSavedItemsMap((prev) => {
            const next = new Map(prev);
            next.set(book.asin, json.data.id);
            return next;
          });
          analytics.track(
            "keyword_saved",
            {
              source: "book_research",
              saved_type: "book",
            },
            user?.id,
          );
        }
      } catch (err) {
        console.error("Failed to save book:", err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    performSearch(query, 1);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200 mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          Product Research
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Analyze Competitors & Books
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search by Keyword, ASIN, or Author to uncover estimated sales, BSR
          trends, and pricing strategies.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 max-w-3xl">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Keyword, ASIN (e.g. B08F7J44Q1), or Author Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-transparent text-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white font-semibold rounded-lg px-6 py-3 text-sm hover:bg-indigo-700 transition disabled:opacity-70 whitespace-nowrap"
          >
            {isLoading ? "Searching..." : "Analyze"}
          </button>
        </form>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
        <Info className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-1">
            Methodology Disclaimer
          </strong>
          <p className="text-indigo-800/80 leading-relaxed text-xs">
            Sales and revenue figures are clearly labeled as{" "}
            <strong>Estimated</strong>. They are calculated using proprietary
            algorithms analyzing Best Seller Rank (BSR), category momentum,
            historical trends, and market sizing models. They do not represent
            exact or guaranteed historical figures from Amazon.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => performSearch(debouncedQuery, page)}
            className="px-4 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-bold transition whitespace-nowrap"
          >
            Retry Request
          </button>
        </div>
      )}

      {hasSearched && !isLoading && results.length === 0 && (
        <div className="text-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">No books found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Try a different ASIN, author, or keyword to uncover opportunities.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setHasSearched(false);
            }}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            Clear Search
          </button>
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Explore Amazon KDP Book Metrics
          </h3>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            Search any keyword, author name, or Amazon ASIN to inspect estimated monthly royalties, sales volume, BSR momentum, review count, and price distributions.
          </p>
          <div className="max-w-xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Popular starting points
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Atomic Habits",
                "Coloring book for kids",
                "Daily gratitude journal",
                "Python for beginners",
                "Sudoku puzzle book",
                "High protein meal prep"
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    performSearch(term, 1);
                  }}
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-xs font-medium text-slate-600 transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {results.map((book) => {
            const isSaved = savedItemsMap.has(book.asin);

            return (
              <div
                key={book.asin}
                className="bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {book.categories.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {book.title}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 font-medium">
                        by {book.author}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleSaveBook(book)}
                      className={`shrink-0 p-2 rounded-full transition ${isSaved ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                      title={isSaved ? "Remove from saved" : "Save for later"}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-5 w-5" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 mb-6">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-semibold text-slate-700">
                        ASIN:
                      </span>{" "}
                      {book.asin}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(book.publishDate).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-slate-700">
                        {book.rating.toFixed(1)}
                      </span>
                      <span>({book.reviewCount.toLocaleString()})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-5">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        BSR Rank
                      </div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        #{book.bestSellerRank.toLocaleString()}
                        {book.trend === "Up" && (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {book.trend === "Down" && (
                          <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        {book.trend === "Flat" && (
                          <Minus className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        List Price
                      </div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {formatLocalizedMoney(book.priceUSD)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Est. Sales / Mo
                      </div>
                      <div className="text-sm font-black text-indigo-700">
                        {book.estimatedMonthlySales.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Est. Rev / Mo
                      </div>
                      <div className="text-sm font-black text-emerald-700">
                        {formatLocalizedMoney(book.revenueEstUSD)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 rounded-b-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    Sales and Revenue are strictly <strong>Estimated</strong>
                  </span>
                  <button className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    Track BSR History <TrendingUp className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && results.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
