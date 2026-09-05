import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  GOAL_OPTIONS,
  createOnboardingProfile,
  validateOnboardingAnswers,
} from "./validation.ts";

describe("validation", () => {
  it("normalizes valid onboarding answers", () => {
    const result = validateOnboardingAnswers({
      experience: "Advanced",
      bookTypes: "   romance, nonfiction   ",
      goals: ["Find profitable niches", "Research keywords"],
      completed: true,
      skipped: false,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.profile.experience, "Advanced");
    assert.equal(result.profile.bookTypes, "romance, nonfiction");
    assert.deepEqual(result.profile.goals, [
      "Find profitable niches",
      "Research keywords",
    ]);
  });

  it("falls back to defaults for invalid input", () => {
    const profile = createOnboardingProfile({
      experience: "Unknown" as never,
      bookTypes: "  ",
      goals: ["Invalid goal"],
    });

    assert.equal(profile.experience, "Beginner");
    assert.equal(profile.bookTypes, "");
    assert.deepEqual(profile.goals, []);
  });

  it("accepts all supported goals", () => {
    assert.deepEqual(GOAL_OPTIONS.length, 5);
    assert.ok(GOAL_OPTIONS.includes("Create covers"));
  });
});
