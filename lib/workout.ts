import { z } from "zod";

export const workoutInputSchema = z.object({
  goal: z.string().trim().min(2, "Goal is required."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  durationMinutes: z.number().min(10).max(120),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
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

const userMetricsSchema = z.object({
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  bmi: z.number().min(10).max(80),
  bmiCategory: z.enum(["underweight", "healthy", "overweight", "obesity"]),
});

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
  const bmi = calculateBmi(input.heightCm, input.weightKg);
  const bmiCategory = getBmiCategory(bmi);

  const mainWorkout = plan.mainWorkout.map((exercise) => ({
    ...exercise,
    // Use the standard MET calorie formula so the estimate is driven by
    // user body weight plus the exercise-specific duration/intensity pair.
    estimatedCalories: estimateCalories(
      input.weightKg,
      exercise.estimatedMinutes,
      getMetFromIntensity(exercise.intensity),
    ),
  }));

  const warmupCalories = estimateCalories(
    input.weightKg,
    inferSupportBlockMinutes(plan.sessionTimeBreakdown, "warm"),
    3.5,
  );
  const cooldownCalories = estimateCalories(
    input.weightKg,
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
    userMetrics: {
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      bmi,
      bmiCategory,
    },
    mainWorkout,
  };
}
