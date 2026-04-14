import { NextResponse } from "next/server";
import {
  enrichWorkoutPlan,
  workoutInputSchema,
  workoutPlanSchema,
  type ModelWorkoutPlan,
} from "@/lib/workout";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

async function generateWorkoutJson(
  messages: Array<{ role: "system" | "user"; content: string }>,
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY.");
  }

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1800,
      response_format: {
        type: "json_object",
      },
    }),
  });

  const data = (await response.json()) as DeepSeekResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || "The model request failed.");
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("The model returned an empty response.");
  }

  return content;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedInput = workoutInputSchema.safeParse(json);

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Please complete the required fields before generating." },
        { status: 400 },
      );
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt() },
      { role: "user" as const, content: buildUserPrompt(parsedInput.data) },
    ];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await generateWorkoutJson(messages);
        const parsed = JSON.parse(raw) as ModelWorkoutPlan;
        const enriched = enrichWorkoutPlan(parsed, parsedInput.data);
        const validated = workoutPlanSchema.parse(enriched);

        return NextResponse.json(validated);
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { error: "The workout could not be generated right now." },
      { status: 502 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating the workout.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
