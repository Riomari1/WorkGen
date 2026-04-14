"use client";

import { useState } from "react";
import {
  calculateBmi,
  getBmiCategory,
  workoutPlanSchema,
  type WorkoutInput,
  type WorkoutPlan
} from "@/lib/workout";
import { WorkoutPlanView } from "@/components/workout-plan-view";

const initialForm: WorkoutInput = {
  goal: "",
  experienceLevel: "beginner",
  durationMinutes: 30,
  heightCm: 175,
  weightKg: 75,
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
  const bmi = calculateBmi(form.heightCm, form.weightKg);
  const bmiCategory = getBmiCategory(bmi);

  async function submitForm() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
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
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to generate a workout right now.";

      setError(message);
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
              <span className="text-sm font-medium text-slate-800">Height (cm)</span>
              <input
                className="field"
                max={230}
                min={120}
                step={1}
                type="number"
                value={form.heightCm}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    heightCm: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Weight (kg)</span>
              <input
                className="field"
                max={250}
                min={35}
                step={1}
                type="number"
                value={form.weightKg}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weightKg: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-amber-900">
              <span className="font-semibold">BMI {bmi}</span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                {bmiCategory}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Height and weight are used to personalize the prompt and to calculate
              exercise calorie estimates in the generated plan.
            </p>
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
            onClick={submitForm}
            type="button"
          >
            {isLoading ? "Generating workout..." : "Generate workout"}
          </button>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 xl:w-full 2xl:w-auto"
            disabled={isLoading || !plan}
            onClick={submitForm}
            type="button"
          >
            Regenerate
          </button>
        </div>

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
