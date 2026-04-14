import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { WorkoutInput, WorkoutPlan } from "@/lib/workout";

type CacheEntry = {
  createdAt: number;
  value: WorkoutPlan;
};

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12;
const cache = new Map<string, CacheEntry>();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getTtlMs() {
  const rawValue = process.env.WORKOUT_CACHE_TTL_MS;
  const parsed = Number(rawValue);

  if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TTL_MS;
  }

  return parsed;
}

function normalizeInput(input: WorkoutInput) {
  const normalizeText = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const normalizeList = (value: string) =>
    normalizeText(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .sort();

  return {
    goal: normalizeText(input.goal),
    experienceLevel: input.experienceLevel,
    durationMinutes: input.durationMinutes,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    equipment: normalizeList(input.equipment),
    limitations: normalizeText(input.limitations || ""),
  };
}

export function createWorkoutCacheKey(input: WorkoutInput, model: string) {
  const normalized = JSON.stringify({
    model,
    input: normalizeInput(input),
  });

  return createHash("sha256").update(normalized).digest("hex");
}

export async function getCachedWorkout(key: string) {
  const redis = getRedisClient();

  if (redis) {
    const sharedValue = await redis.get<WorkoutPlan>(`workout:${key}`);

    if (sharedValue) {
      return sharedValue;
    }
  }

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

export async function setCachedWorkout(key: string, value: WorkoutPlan) {
  const redis = getRedisClient();

  if (redis) {
    const ttlSeconds = Math.max(1, Math.floor(getTtlMs() / 1000));

    await redis.set(`workout:${key}`, value, { ex: ttlSeconds });
  }

  cache.set(key, {
    createdAt: Date.now(),
    value,
  });
}
