"use client";

import { useEffect, useState } from "react";
import {
  calculateBmi,
  cmToInches,
  getBmiCategory,
  hasReasonableBodyMetrics,
  inchesToCm,
  kgToLb,
  lbToKg,
  workoutPlanSchema,
  type SavedWorkout,
  type WorkoutInput,
  type WorkoutPlan,
} from "@/lib/workout";
import { WorkoutPlanView } from "@/components/workout-plan-view";

const SAVED_WORKOUTS_KEY = "workout-generator.saved-workouts";

const initialForm: WorkoutInput = {
  goal: "",
  unitSystem: "metric",
  experienceLevel: "beginner",
  daysPerWeek: 3,
  durationMinutes: 30,
  heightCm: undefined,
  weightKg: undefined,
  equipment: "",
  limitations: "",
};

const experienceOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

async function parseApiResponse(response: Response) {
  const rawText = await response.text();

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(rawText || "The server returned an invalid response.");
  }
}

export function WorkoutGenerator() {
  const [form, setForm] = useState<WorkoutInput>(initialForm);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<"HIT" | "MISS" | "BYPASS" | "">(
    "",
  );
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [saveName, setSaveName] = useState("");

  const hasMetrics = hasReasonableBodyMetrics(form.heightCm, form.weightKg);
  const bmi =
    hasMetrics && form.heightCm !== undefined && form.weightKg !== undefined
      ? calculateBmi(form.heightCm, form.weightKg)
      : null;
  const bmiCategory = bmi !== null ? getBmiCategory(bmi) : null;
  const displayedHeight =
    form.heightCm === undefined
      ? ""
      : form.unitSystem === "metric"
        ? String(form.heightCm)
        : String(cmToInches(form.heightCm));
  const displayedWeight =
    form.weightKg === undefined
      ? ""
      : form.unitSystem === "metric"
        ? String(form.weightKg)
        : String(kgToLb(form.weightKg));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_WORKOUTS_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SavedWorkout[];
      setSavedWorkouts(parsed);
    } catch {
      setSavedWorkouts([]);
    }
  }, []);

  function persistSavedWorkouts(nextWorkouts: SavedWorkout[]) {
    setSavedWorkouts(nextWorkouts);
    window.localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(nextWorkouts));
  }

  function updateHeight(rawValue: string) {
    if (!rawValue.trim()) {
      setForm((current) => ({ ...current, heightCm: undefined }));
      return;
    }

    const numeric = Number(rawValue);

    setForm((current) => ({
      ...current,
      heightCm: current.unitSystem === "metric" ? numeric : inchesToCm(numeric),
    }));
  }

  function updateWeight(rawValue: string) {
    if (!rawValue.trim()) {
      setForm((current) => ({ ...current, weightKg: undefined }));
      return;
    }

    const numeric = Number(rawValue);

    setForm((current) => ({
      ...current,
      weightKg: current.unitSystem === "metric" ? numeric : lbToKg(numeric),
    }));
  }

  async function submitForm(forceFresh = false) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/generate${forceFresh ? "?fresh=1" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to generate a workout right now.";

        throw new Error(errorMessage);
      }

      const parsedPlan = workoutPlanSchema.safeParse(data);

      if (!parsedPlan.success) {
        throw new Error("The generated workout was incomplete. Please try again.");
      }

      setPlan(parsedPlan.data);
      setCacheStatus(
        response.headers.get("x-workout-cache") as "HIT" | "MISS" | "BYPASS" | "",
      );
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to generate a workout right now.";

      setError(message);
      setCacheStatus("");
    } finally {
      setIsLoading(false);
    }
  }

  function saveCurrentWorkout() {
    if (!plan) {
      return;
    }

    const nextWorkout: SavedWorkout = {
      id: crypto.randomUUID(),
      name: saveName.trim() || plan.summary.title,
      savedAt: new Date().toISOString(),
      plan,
    };

    // Keep the most recent saves at the top and cap the local collection.
    persistSavedWorkouts([nextWorkout, ...savedWorkouts].slice(0, 20));
    setSaveName("");
  }

  function loadSavedWorkout(savedWorkout: SavedWorkout) {
    setPlan(savedWorkout.plan);
    setCacheStatus("");
    setError("");
  }

  function deleteSavedWorkout(id: string) {
    persistSavedWorkouts(savedWorkouts.filter((workout) => workout.id !== id));
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(390px,500px)_minmax(0,1fr)]">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] sm:p-7 xl:sticky xl:top-5 xl:h-fit">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Build a session
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Keep the inputs specific enough to shape the plan, but light enough for
            a fast demo.
          </p>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">Fitness goal</span>
            <input
              className="field"
              placeholder="Fat loss, strength, mobility, general fitness"
              value={form.goal}
              onChange={(event) =>
                setForm((current) => ({ ...current, goal: event.target.value }))
              }
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Experience level
              </span>
              <select
                className="field"
                value={form.experienceLevel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    experienceLevel: event.target.value as WorkoutInput["experienceLevel"],
                  }))
                }
              >
                {experienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Days per week</span>
              <input
                className="field"
                min={1}
                max={7}
                placeholder="Optional"
                step={1}
                type="number"
                value={form.daysPerWeek ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    daysPerWeek: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Workout duration (min)
              </span>
              <input
                className="field"
                min={10}
                placeholder="Optional"
                step={5}
                type="number"
                value={form.durationMinutes ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Units</span>
              <select
                className="field"
                value={form.unitSystem}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitSystem: event.target.value as WorkoutInput["unitSystem"],
                  }))
                }
              >
                <option value="metric">Metric</option>
                <option value="imperial">Imperial</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Height ({form.unitSystem === "metric" ? "cm" : "in"})
              </span>
              <input
                className="field"
                placeholder="Optional"
                step={0.1}
                type="number"
                value={displayedHeight}
                onChange={(event) => updateHeight(event.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Weight ({form.unitSystem === "metric" ? "kg" : "lb"})
              </span>
              <input
                className="field"
                placeholder="Optional"
                step={0.1}
                type="number"
                value={displayedWeight}
                onChange={(event) => updateWeight(event.target.value)}
              />
            </label>
          </div>

          {hasMetrics && bmi !== null && bmiCategory ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-amber-900">
                <span className="font-semibold">BMI {bmi}</span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  {bmiCategory}
                </span>
              </div>
            </div>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">
              Available equipment
            </span>
            <textarea
              className="field min-h-24 resize-y"
              placeholder="Optional: dumbbells, bench, resistance bands, treadmill"
              value={form.equipment ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, equipment: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">
              Limitations or injuries
            </span>
            <textarea
              className="field min-h-28 resize-y"
              placeholder="Optional: lower-back sensitivity, knee pain, avoid jumping"
              value={form.limitations}
              onChange={(event) =>
                setForm((current) => ({ ...current, limitations: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 xl:w-full 2xl:w-auto"
            disabled={isLoading}
            onClick={() => submitForm(false)}
            type="button"
          >
            {isLoading ? "Generating workout..." : "Generate workout"}
          </button>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 xl:w-full 2xl:w-auto"
            disabled={isLoading || !plan}
            onClick={() => submitForm(true)}
            type="button"
          >
            Regenerate
          </button>
        </div>

        {cacheStatus ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {cacheStatus === "HIT" ? "Loaded from cache" : null}
            {cacheStatus === "MISS" ? "Freshly generated" : null}
            {cacheStatus === "BYPASS" ? "Regenerated without cache" : null}
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Saved Workouts
            </h3>
            <span className="text-xs text-slate-400">{savedWorkouts.length}/20</span>
          </div>
          {savedWorkouts.length ? (
            <div className="grid gap-2">
              {savedWorkouts.map((savedWorkout) => (
                <div
                  className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-3"
                  key={savedWorkout.id}
                >
                  <button
                    className="min-w-0 flex-1 overflow-hidden text-left"
                    onClick={() => loadSavedWorkout(savedWorkout)}
                    type="button"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {savedWorkout.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(savedWorkout.savedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    className="shrink-0 rounded-xl px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => deleteSavedWorkout(savedWorkout.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Save a generated workout to keep a quick client-side library for demoing.
            </p>
          )}
        </div>
      </div>

      <WorkoutPlanView
        isLoading={isLoading}
        plan={plan}
        saveAction={
          plan ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <input
                className="field min-w-[220px] max-w-[260px] py-3 text-sm"
                placeholder="Save as"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
              />
              <button
                aria-label="Save workout"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white transition hover:bg-slate-800"
                onClick={saveCurrentWorkout}
                title="Save workout"
                type="button"
              >
                +
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}
