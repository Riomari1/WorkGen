import { z } from "zod";

const numberField = (label: string, min: number, max: number) =>
  z.coerce
    .number({
      invalid_type_error: `${label} is required.`,
    })
    .finite(`${label} is required.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const optionalNumberField = () =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }, z.number().finite().optional());

export const workoutInputSchema = z.object({
  goal: z.string().trim().min(2, "Goal is required."),
  unitSystem: z.enum(["metric", "imperial"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: numberField("Days per week", 1, 7),
  durationMinutes: numberField("Workout duration", 10, 120),
  heightCm: optionalNumberField(),
  weightKg: optionalNumberField(),
  equipment: z.string().trim().min(2, "Equipment is required."),
  limitations: z.string().trim().max(500).optional().or(z.literal("")),
});

const timedStepSchema = z.object({
  name: z.string().min(1),
  duration: z.string().min(1),
  details: z.string().min(1),
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.string().min(1),
  reps: z.string().min(1),
  rest: z.string().min(1),
  estimatedMinutes: z.number().int().min(2).max(20),
  intensity: z.enum(["low", "moderate", "high"]),
  details: z.string().min(1),
});

const timeBlockSchema = z.object({
  label: z.string().min(1),
  minutes: z.number().int().min(1),
});

const userMetricsSchema = z
  .object({
    heightCm: z.number().min(120).max(230),
    weightKg: z.number().min(35).max(250),
    bmi: z.number().min(10).max(80),
    bmiCategory: z.enum(["underweight", "healthy", "overweight", "obesity"]),
  })
  .nullable();

export const workoutPlanSchema = z.object({
  summary: z.object({
    title: z.string().min(1),
    focus: z.string().min(1),
    estimatedMinutes: z.number().int().min(10).max(120),
    intensity: z.enum(["low", "moderate", "high"]),
    estimatedCalories: z.number().int().min(20).max(2000),
  }),
  userMetrics: userMetricsSchema,
  warmup: z.array(timedStepSchema).min(2).max(5),
  mainWorkout: z
    .array(
      exerciseSchema.extend({
        estimatedCalories: z.number().int().min(5).max(600),
      }),
    )
    .min(3)
    .max(8),
  cooldown: z.array(timedStepSchema).min(1).max(4),
  sessionTimeBreakdown: z.array(timeBlockSchema).min(3).max(5),
  howItHelps: z.string().min(20),
});

export type WorkoutInput = z.infer<typeof workoutInputSchema>;
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

export type ModelWorkoutPlan = Omit<WorkoutPlan, "userMetrics"> & {
  summary: Omit<WorkoutPlan["summary"], "estimatedCalories">;
  mainWorkout: Array<Omit<WorkoutPlan["mainWorkout"][number], "estimatedCalories">>;
};

export function calculateBmi(heightCm: number, weightKg: number) {
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function cmToInches(heightCm: number) {
  return Number((heightCm / 2.54).toFixed(1));
}

export function inchesToCm(heightInches: number) {
  return Number((heightInches * 2.54).toFixed(1));
}

export function kgToLb(weightKg: number) {
  return Number((weightKg * 2.2046226218).toFixed(1));
}

export function lbToKg(weightLb: number) {
  return Number((weightLb / 2.2046226218).toFixed(1));
}

export function hasReasonableBodyMetrics(
  heightCm?: number,
  weightKg?: number,
): boolean {
  return Boolean(
    heightCm &&
      weightKg &&
      heightCm >= 120 &&
      heightCm <= 230 &&
      weightKg >= 35 &&
      weightKg <= 250,
  );
}

export function getBmiCategory(bmi: number) {
  if (bmi < 18.5) {
    return "underweight" as const;
  }

  if (bmi < 25) {
    return "healthy" as const;
  }

  if (bmi < 30) {
    return "overweight" as const;
  }

  return "obesity" as const;
}

function getMetFromIntensity(intensity: "low" | "moderate" | "high") {
  switch (intensity) {
    case "low":
      return 4;
    case "moderate":
      return 6;
    case "high":
      return 8;
  }
}

function estimateCalories(weightKg: number, minutes: number, met: number) {
  return Math.max(1, Math.round((met * 3.5 * weightKg * minutes) / 200));
}

function inferSupportBlockMinutes(
  blocks: WorkoutPlan["sessionTimeBreakdown"],
  keyword: "warm" | "cool",
) {
  return blocks
    .filter((item) => item.label.toLowerCase().includes(keyword))
    .reduce((total, item) => total + item.minutes, 0);
}

export function enrichWorkoutPlan(
  plan: ModelWorkoutPlan,
  input: Pick<WorkoutInput, "heightCm" | "weightKg">,
): WorkoutPlan {
  const hasMetrics = hasReasonableBodyMetrics(input.heightCm, input.weightKg);
  const effectiveWeightKg =
    hasMetrics && input.weightKg !== undefined ? input.weightKg : 70;
  const bmi =
    hasMetrics && input.heightCm !== undefined && input.weightKg !== undefined
      ? calculateBmi(input.heightCm, input.weightKg)
      : null;

  const mainWorkout = plan.mainWorkout.map((exercise) => ({
    ...exercise,
    // Fall back to a neutral reference weight when body metrics are missing or absurd.
    estimatedCalories: estimateCalories(
      effectiveWeightKg,
      exercise.estimatedMinutes,
      getMetFromIntensity(exercise.intensity),
    ),
  }));

  const warmupCalories = estimateCalories(
    effectiveWeightKg,
    inferSupportBlockMinutes(plan.sessionTimeBreakdown, "warm"),
    3.5,
  );
  const cooldownCalories = estimateCalories(
    effectiveWeightKg,
    inferSupportBlockMinutes(plan.sessionTimeBreakdown, "cool"),
    2.5,
  );
  const mainWorkoutCalories = mainWorkout.reduce(
    (total, exercise) => total + exercise.estimatedCalories,
    0,
  );

  return {
    ...plan,
    summary: {
      ...plan.summary,
      estimatedCalories: warmupCalories + mainWorkoutCalories + cooldownCalories,
    },
    userMetrics: hasMetrics
      ? {
          heightCm: input.heightCm as number,
          weightKg: input.weightKg as number,
          bmi: bmi as number,
          bmiCategory: getBmiCategory(bmi as number),
        }
      : null,
    mainWorkout,
  };
}
