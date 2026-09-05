import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { logAppError } from "@/src/lib/errors.ts";
import {
  GOAL_OPTIONS,
  createOnboardingProfile,
  type ExperienceLevel,
  type OnboardingAnswers,
  validateExperience,
  validateOnboardingAnswers,
} from "@/src/lib/validation.ts";

export type { OnboardingAnswers } from "@/src/lib/validation.ts";

const STORAGE_KEY = "kdp_orbit_onboarding";

export const getOnboardingProfile = (): OnboardingAnswers | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
    if (!parsed || typeof parsed !== "object") return null;

    const result = createOnboardingProfile(parsed);
    return result;
  } catch (error) {
    logAppError(error, "Failed to read onboarding profile");
    return null;
  }
};

export const saveOnboardingProfile = (answers: OnboardingAnswers) => {
  if (typeof window === "undefined") return;

  const normalized = createOnboardingProfile(answers);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (answers: OnboardingAnswers) => void;
}

const experienceOptions: ExperienceLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [experience, setExperience] = useState<ExperienceLevel>("Beginner");
  const [bookTypes, setBookTypes] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const existing = getOnboardingProfile();
    if (existing) {
      setExperience(validateExperience(existing.experience));
      setBookTypes(existing.bookTypes || "");
      setGoals(existing.goals || []);
      return;
    }

    setExperience("Beginner");
    setBookTypes("");
    setGoals([]);
  }, [isOpen]);

  const helperText = useMemo(() => {
    if (experience === "Beginner") {
      return "We will keep the workflow simple and highlight the essentials.";
    }

    if (experience === "Intermediate") {
      return "We will prioritize fast wins and deeper research actions.";
    }

    return "We will surface advanced publishing workflows and optimization ideas.";
  }, [experience]);

  const toggleGoal = (goal: string) => {
    setGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal],
    );
  };

  const buildProfile = (
    overrides?: Partial<OnboardingAnswers>,
  ): OnboardingAnswers => {
    const draft: Partial<OnboardingAnswers> = {
      experience,
      bookTypes,
      goals,
      completed: true,
      skipped: false,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };

    const { profile } = validateOnboardingAnswers(draft);
    return profile;
  };

  const handleSave = () => {
    const profile = buildProfile({ completed: true, skipped: false });
    saveOnboardingProfile(profile);
    onComplete?.(profile);
    onClose();
  };

  const handleSkip = () => {
    const profile = buildProfile({ completed: false, skipped: true });
    saveOnboardingProfile(profile);
    onComplete?.(profile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> Quick setup
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Personalize your dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-800">
              What is your KDP experience?
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {experienceOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setExperience(option)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    experience === option
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{helperText}</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="book-types"
              className="text-sm font-semibold text-slate-800"
            >
              What type of books do you publish?{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="book-types"
              value={bookTypes}
              onChange={(event) => setBookTypes(event.target.value)}
              placeholder="e.g. romance, children’s books, business guides"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-800">
              What are you trying to accomplish?
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save setup
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
