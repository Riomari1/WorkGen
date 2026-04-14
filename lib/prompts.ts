import type { WorkoutInput } from "@/lib/workout";
import { hasReasonableBodyMetrics } from "@/lib/workout";

export function buildSystemPrompt() {
  return [
    "You are an expert fitness coach creating practical single-session workouts.",
    "Return valid JSON only.",
    "The plan must be safe, realistic, and clearly aligned to the user's goal, experience, available equipment, and limitations.",
    "If a limitation or injury is provided, favor lower-risk variations and avoid movements that could aggravate the issue.",
    "Keep the total estimated session close to the requested duration.",
    "Use concise, readable exercise descriptions.",
    "Do not include markdown fences or prose outside the JSON.",
    'Use exactly this JSON shape: {"summary":{"title":"string","focus":"string","estimatedMinutes":30,"intensity":"low|moderate|high"},"warmup":[{"name":"string","duration":"string","details":"string"}],"mainWorkout":[{"name":"string","sets":"string","reps":"string","rest":"string","estimatedMinutes":8,"intensity":"low|moderate|high","details":"string"}],"cooldown":[{"name":"string","duration":"string","details":"string"}],"sessionTimeBreakdown":[{"label":"string","minutes":1}],"howItHelps":"string"}',
  ].join(" ");
}

export function buildUserPrompt(input: WorkoutInput) {
  const hasMetrics = hasReasonableBodyMetrics(input.heightCm, input.weightKg);
  const bmi = hasMetrics
    ? (
        (input.weightKg as number) /
        ((input.heightCm as number) / 100) ** 2
      ).toFixed(1)
    : null;

  return [
    "Create one personalized workout session.",
    `Goal: ${input.goal}.`,
    `Preferred unit system: ${input.unitSystem}.`,
    `Experience level: ${input.experienceLevel}.`,
    `Training frequency target: ${input.daysPerWeek} days per week.`,
    `Workout duration: ${input.durationMinutes} minutes.`,
    ...(hasMetrics
      ? [
          `Height: ${input.heightCm} cm.`,
          `Weight: ${input.weightKg} kg.`,
          `BMI: ${bmi}.`,
        ]
      : ["Ignore body-metric personalization because height/weight were missing or unrealistic."]),
    `Available equipment: ${input.equipment}.`,
    `Limitations or injuries: ${input.limitations || "None provided."}`,
    "Requirements:",
    "- Include a warm-up, main workout, cooldown, session time breakdown, and a short benefits-oriented explanation.",
    "- Main workout items must include sets, reps, rest times, estimated minutes, and intensity.",
    "- Make the explanation specific to the inputs, not generic, and frame it as how the session helps the user.",
    "- Keep the structure polished and demo-ready.",
    "- Respond in JSON.",
  ].join("\n");
}
