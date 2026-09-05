import React, { useState } from "react";
import {
  X,
  Search,
  Compass,
  BookOpen,
  Palette,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import { analytics } from "@/src/services/analytics/analytics.ts";

export type QuickActionType = "keyword" | "niche" | "book" | "cover" | "ai";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction: QuickActionType;
  onActionComplete: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  initialAction,
  onActionComplete,
}) => {
  const { token, user } = useAuth();
  const [actionType, setActionType] = useState<QuickActionType>(initialAction);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const actionConfigs: Record<
    QuickActionType,
    {
      title: string;
      icon: React.ReactNode;
      description: string;
      placeholder: string;
      primaryButtonText: string;
      sampleSuggestions: string[];
      badge: string;
    }
  > = {
    keyword: {
      title: "Research a Keyword",
      icon: <Search className="h-5 w-5 text-emerald-600" />,
      description:
        "Audit Amazon search volume, customer purchase intent, competition levels, and CPC bids.",
      placeholder:
        "e.g., swear word coloring book for nurses, logic puzzles for adults...",
      primaryButtonText: "Run Keyword Analysis",
      sampleSuggestions: [
        "african folktales kids coloring book",
        "bible study journal for women 2026",
        "cryptic crossword large print seniors",
        "adhd daily planner spiral bound",
      ],
      badge: "Amazon US & UK Live Index",
    },
    niche: {
      title: "Find a Niche",
      icon: <Compass className="h-5 w-5 text-blue-600" />,
      description:
        "Discover high-margin, low-competition subcategories with high indie author success rates.",
      placeholder:
        "e.g., Children Activity Books, Christian Living, Puzzles & Games...",
      primaryButtonText: "Explore Niche Subcategories",
      sampleSuggestions: [
        "Children Folklore & Geography",
        "Men Spiritual Growth & Prayer",
        "Language Learning Flashcards",
        "Self-Care & Mindful Journals",
      ],
      badge: "Niche Opportunity Score",
    },
    book: {
      title: "Research a Book or ASIN",
      icon: <BookOpen className="h-5 w-5 text-purple-600" />,
      description:
        "Reverse-engineer top Amazon bestseller BSR, estimated daily royalties, and keyword rankings.",
      placeholder: "Enter Amazon ASIN (e.g. B08F1V4W9K) or exact Book Title...",
      primaryButtonText: "Inspect Book Royalties",
      sampleSuggestions: [
        "B08F1V4W9K (Bestselling Devotional)",
        "B097C2V9K1 (Anxiety Relief Adult Coloring)",
        "Atomic Habits Paperback Edition",
      ],
      badge: "BSR & Royalty Reverse-Engine",
    },
    cover: {
      title: "Create a KDP Cover Project",
      icon: <Palette className="h-5 w-5 text-amber-600" />,
      description:
        "Generate exact KDP-ready cover dimensions with calculated spine width, bleeds, and safety margins.",
      placeholder:
        "Book title (e.g., African Animal Fables & Activity Book)...",
      primaryButtonText: "Start Cover Project",
      sampleSuggestions: [
        "West African Tales: 8.5 x 11 in (84 pages)",
        "War Room Devotional: 6 x 9 in (140 pages)",
        "Senior Logic Grids: 8.5 x 11 in (200 pages)",
      ],
      badge: "KDP Print Dimension Calc",
    },
    ai: {
      title: "Ask KDP AI Publishing Assistant",
      icon: <Sparkles className="h-5 w-5 text-indigo-600" />,
      description:
        "Get instant algorithmic recommendations on subtitle formatting, back-cover blurb copywriting, or 7 KDP backend keyword boxes.",
      placeholder:
        "e.g., Give me 7 high-CTR backend keywords for an African kids coloring book...",
      primaryButtonText: "Consult KDP AI Intelligence",
      sampleSuggestions: [
        "Give me 7 backend keyword combinations for adult coloring books",
        "Suggest 5 high-converting subtitle formulas for prayer journals",
        "What pricing yields the highest 70% royalty on Amazon US?",
      ],
      badge: "Gemini KDP Intelligence",
    },
  };

  const currentConfig = actionConfigs[actionType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/dashboard/quick-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType,
          query: query.trim(),
        }),
      });

      if (res.ok) {
        setResultMessage(
          `Search recorded: "${query.trim()}". Dashboard updated.`,
        );
        const eventMap = {
          keyword: "search_performed",
          niche: "niche_viewed",
          book: "book_analyzed",
          cover: "cover_created",
          ai: "ai_request_made",
        } as const;

        analytics.track(
          eventMap[actionType],
          {
            source: "quick_action",
            action_type: actionType,
          },
          user?.id,
        );

        setTimeout(() => {
          onActionComplete();
          onClose();
          setResultMessage(null);
          setQuery("");
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="quick-action-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs">
              {currentConfig.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {currentConfig.title}
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                {currentConfig.badge}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Type Selector Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-100/60 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => {
              setActionType("keyword");
              setResultMessage(null);
            }}
            className={`py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              actionType === "keyword"
                ? "bg-white font-semibold text-emerald-700 border-b-2 border-emerald-600"
                : "hover:bg-slate-200/50"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keyword</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType("niche");
              setResultMessage(null);
            }}
            className={`py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              actionType === "niche"
                ? "bg-white font-semibold text-blue-700 border-b-2 border-blue-600"
                : "hover:bg-slate-200/50"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Niche</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType("book");
              setResultMessage(null);
            }}
            className={`py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              actionType === "book"
                ? "bg-white font-semibold text-purple-700 border-b-2 border-purple-600"
                : "hover:bg-slate-200/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Book</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType("cover");
              setResultMessage(null);
            }}
            className={`py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              actionType === "cover"
                ? "bg-white font-semibold text-amber-700 border-b-2 border-amber-600"
                : "hover:bg-slate-200/50"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cover</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType("ai");
              setResultMessage(null);
            }}
            className={`py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              actionType === "ai"
                ? "bg-white font-semibold text-indigo-700 border-b-2 border-indigo-600"
                : "hover:bg-slate-200/50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {currentConfig.description}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Query or Target Title
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentConfig.placeholder}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              autoFocus
            />
          </div>

          {/* Preset Prompts / Clickable Suggestions */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-slate-400" /> Suggested
              Prompts & Live Lookups
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentConfig.sampleSuggestions.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuery(sample)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 transition text-left"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback message */}
          {resultMessage && (
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !query.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{currentConfig.primaryButtonText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
