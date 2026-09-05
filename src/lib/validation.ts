export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface OnboardingAnswers {
  experience: ExperienceLevel;
  bookTypes: string;
  goals: string[];
  completed: boolean;
  skipped: boolean;
  updatedAt: string;
}

const GOAL_CATALOG = [
  "Find profitable niches",
  "Research keywords",
  "Create covers",
  "Find book ideas",
  "Improve existing books",
] as const;

const MAX_BOOK_TYPES_LENGTH = 200;
const MAX_GOALS = GOAL_CATALOG.length;

export const GOAL_OPTIONS = [...GOAL_CATALOG];

export const validateExperience = (value: unknown): ExperienceLevel => {
  if (
    typeof value === "string" &&
    EXPERIENCE_LEVELS.includes(value as ExperienceLevel)
  ) {
    return value as ExperienceLevel;
  }

  return "Beginner";
};

export const sanitizeText = (
  value: unknown,
  maxLength = MAX_BOOK_TYPES_LENGTH,
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

export const normalizeGoals = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueGoals = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed = item.trim();
    if (
      !trimmed ||
      !GOAL_CATALOG.includes(trimmed as (typeof GOAL_CATALOG)[number])
    ) {
      continue;
    }

    uniqueGoals.add(trimmed);
    if (uniqueGoals.size >= MAX_GOALS) {
      break;
    }
  }

  return Array.from(uniqueGoals);
};

export const createOnboardingProfile = (
  input: Partial<OnboardingAnswers> = {},
): OnboardingAnswers => {
  const now = new Date().toISOString();

  return {
    experience: validateExperience(input.experience),
    bookTypes: sanitizeText(input.bookTypes),
    goals: normalizeGoals(input.goals),
    completed: Boolean(input.completed),
    skipped: Boolean(input.skipped),
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now,
  };
};

export const validateOnboardingAnswers = (
  input: Partial<OnboardingAnswers>,
) => {
  const profile = createOnboardingProfile(input);
  const errors: string[] = [];

  if (!EXPERIENCE_LEVELS.includes(profile.experience)) {
    errors.push("Experience level is required.");
  }

  if (profile.goals.length > MAX_GOALS) {
    errors.push("You can select up to 5 goals.");
  }

  return {
    isValid: errors.length === 0,
    profile,
    errors,
  };
};
