"use client";

import { useState } from "react";
import {
  calculateBmi,
  cmToInches,
  getBmiCategory,
  hasReasonableBodyMetrics,
  inchesToCm,
  kgToLb,
  lbToKg,
  workoutPlanSchema,
  type WorkoutInput,
  type WorkoutPlan,
} from "@/lib/workout";
import { WorkoutPlanView } from "@/components/workout-plan-view";

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

export function WorkoutGenerator() {
  const [form, setForm] = useState<WorkoutInput>(initialForm);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<"HIT" | "MISS" | "BYPASS" | "">(
    "",
  );

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

      const data = (await response.json()) as unknown;

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

          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Days per week</span>
              <input
                className="field"
                min={1}
                max={7}
                step={1}
                type="number"
                value={form.daysPerWeek}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    daysPerWeek: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Workout duration
              </span>
              <input
                className="field"
                min={10}
                max={120}
                step={5}
                type="number"
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">
                Height ({form.unitSystem === "metric" ? "cm" : "in"})
              </span>
              <input
                className="field"
                placeholder={form.unitSystem === "metric" ? "Optional" : "Optional"}
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

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
            {hasMetrics && bmi !== null && bmiCategory ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm text-amber-900">
                  <span className="font-semibold">BMI {bmi}</span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    {bmiCategory}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  Height and weight are being used for BMI and calorie estimates.
                </p>
              </>
            ) : (
              <p className="text-sm leading-6 text-amber-900/80">
                Height and weight are optional. If they are missing or unrealistic,
                the workout still generates and uses generic calorie assumptions.
              </p>
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">
              Available equipment
            </span>
            <textarea
              className="field min-h-24 resize-y"
              placeholder="Dumbbells, bench, resistance bands, treadmill, none"
              value={form.equipment}
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
      </div>

      <WorkoutPlanView plan={plan} isLoading={isLoading} />
    </section>
  );
}
