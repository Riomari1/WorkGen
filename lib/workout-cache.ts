import { createHash } from "node:crypto";
import type { WorkoutInput, WorkoutPlan } from "@/lib/workout";

type CacheEntry = {
  createdAt: number;
  value: WorkoutPlan;
};

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12;
const cache = new Map<string, CacheEntry>();

function getTtlMs() {
  const rawValue = process.env.WORKOUT_CACHE_TTL_MS;
  const parsed = Number(rawValue);

  if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TTL_MS;
  }

  return parsed;
}

function normalizeInput(input: WorkoutInput) {
  return {
    goal: input.goal.trim().toLowerCase(),
    experienceLevel: input.experienceLevel,
    durationMinutes: input.durationMinutes,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    equipment: input.equipment.trim().toLowerCase(),
    limitations: (input.limitations || "").trim().toLowerCase(),
  };
}

export function createWorkoutCacheKey(input: WorkoutInput, model: string) {
  const normalized = JSON.stringify({
    model,
    input: normalizeInput(input),
  });

  return createHash("sha256").update(normalized).digest("hex");
}

export function getCachedWorkout(key: string) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > getTtlMs()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedWorkout(key: string, value: WorkoutPlan) {
  cache.set(key, {
    createdAt: Date.now(),
    value,
  });
}
