import { z } from "zod";

export const workoutInputSchema = z.object({
  goal: z.string().trim().min(2, "Goal is required."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  durationMinutes: z.number().min(10).max(120),
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
  details: z.string().min(1),
});

const timeBlockSchema = z.object({
  label: z.string().min(1),
  minutes: z.number().int().min(1),
});

export const workoutPlanSchema = z.object({
  summary: z.object({
    title: z.string().min(1),
    focus: z.string().min(1),
    estimatedMinutes: z.number().int().min(10).max(120),
    intensity: z.enum(["low", "moderate", "high"]),
  }),
  warmup: z.array(timedStepSchema).min(2).max(5),
  mainWorkout: z.array(exerciseSchema).min(3).max(8),
  cooldown: z.array(timedStepSchema).min(1).max(4),
  sessionTimeBreakdown: z.array(timeBlockSchema).min(3).max(5),
  whyItFits: z.string().min(20),
});

export type WorkoutInput = z.infer<typeof workoutInputSchema>;
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

export const workoutResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        focus: { type: "string" },
        estimatedMinutes: { type: "integer" },
        intensity: {
          type: "string",
          enum: ["low", "moderate", "high"],
        },
      },
      required: ["title", "focus", "estimatedMinutes", "intensity"],
    },
    warmup: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          duration: { type: "string" },
          details: { type: "string" },
        },
        required: ["name", "duration", "details"],
      },
    },
    mainWorkout: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          sets: { type: "string" },
          reps: { type: "string" },
          rest: { type: "string" },
          details: { type: "string" },
        },
        required: ["name", "sets", "reps", "rest", "details"],
      },
    },
    cooldown: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          duration: { type: "string" },
          details: { type: "string" },
        },
        required: ["name", "duration", "details"],
      },
    },
    sessionTimeBreakdown: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          minutes: { type: "integer" },
        },
        required: ["label", "minutes"],
      },
    },
    whyItFits: { type: "string" },
  },
  required: [
    "summary",
    "warmup",
    "mainWorkout",
    "cooldown",
    "sessionTimeBreakdown",
    "whyItFits",
  ],
} as const;
