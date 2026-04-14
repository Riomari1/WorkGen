import type { WorkoutInput } from "@/lib/workout";

export function buildSystemPrompt() {
  return [
    "You are an expert fitness coach creating practical single-session workouts.",
    "Return valid JSON only.",
    "The plan must be safe, realistic, and clearly aligned to the user's goal, experience, available equipment, and limitations.",
    "If a limitation or injury is provided, favor lower-risk variations and avoid movements that could aggravate the issue.",
    "Keep the total estimated session close to the requested duration.",
    "Use concise, readable exercise descriptions.",
    'Use exactly this JSON shape: {"summary":{"title":"string","focus":"string","estimatedMinutes":30,"intensity":"low|moderate|high"},"warmup":[{"name":"string","duration":"string","details":"string"}],"mainWorkout":[{"name":"string","sets":"string","reps":"string","rest":"string","details":"string"}],"cooldown":[{"name":"string","duration":"string","details":"string"}],"sessionTimeBreakdown":[{"label":"string","minutes":1}],"whyItFits":"string"}',
  ].join(" ");
}

export function buildUserPrompt(input: WorkoutInput) {
  return [
    "Create one personalized workout session.",
    `Goal: ${input.goal}.`,
    `Experience level: ${input.experienceLevel}.`,
    `Workout duration: ${input.durationMinutes} minutes.`,
    `Available equipment: ${input.equipment}.`,
    `Limitations or injuries: ${input.limitations || "None provided."}`,
    "Requirements:",
    "- Include a warm-up, main workout, cooldown, session time breakdown, and a short rationale.",
    "- Main workout items must include sets, reps, and rest times.",
    "- Make the explanation specific to the inputs, not generic.",
    "- Keep the structure polished and demo-ready.",
    "- Respond in JSON.",
  ].join("\n");
}
