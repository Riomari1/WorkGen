import { NextResponse } from "next/server";
import {
  enrichWorkoutPlan,
  workoutInputSchema,
  workoutPlanSchema,
  type ModelWorkoutPlan,
} from "@/lib/workout";
import {
  createWorkoutCacheKey,
  getCachedWorkout,
  setCachedWorkout,
} from "@/lib/workout-cache";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const runtime = "nodejs";
export const maxDuration = 20;

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

async function parseJsonResponse<T>(response: Response) {
  const rawText = await response.text();

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(
      response.ok
        ? "The model endpoint returned invalid JSON."
        : rawText || "The model request failed.",
    );
  }
}

function parseModelJson(rawContent: string) {
  const trimmed = rawContent.trim();

  try {
    return JSON.parse(trimmed) as ModelWorkoutPlan;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("The model returned invalid JSON.");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as ModelWorkoutPlan;
  }
}

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

  const data = await parseJsonResponse<DeepSeekResponse>(response);

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
    const url = new URL(request.url);
    const bypassCache = url.searchParams.get("fresh") === "1";
    const json = await request.json();
    const parsedInput = workoutInputSchema.safeParse(json);

    if (!parsedInput.success) {
      const errorMessage = parsedInput.error.issues
        .map((issue) => {
          switch (issue.path.join(".")) {
            case "goal":
              return "Please enter your fitness goal.";
            case "experienceLevel":
              return "Please select your experience level.";
            default:
              return issue.message;
          }
        })[0] || "Please complete the required fields before generating.";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const cacheKey = createWorkoutCacheKey(parsedInput.data, MODEL);

    if (!bypassCache) {
      const cachedPlan = await getCachedWorkout(cacheKey);

      if (cachedPlan) {
        return NextResponse.json(cachedPlan, {
          headers: {
            "x-workout-cache": "HIT",
          },
        });
      }
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt() },
      { role: "user" as const, content: buildUserPrompt(parsedInput.data) },
    ];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await generateWorkoutJson(messages);
        const parsed = parseModelJson(raw);
        const enriched = enrichWorkoutPlan(parsed, parsedInput.data);
        const validated = workoutPlanSchema.parse(enriched);
        await setCachedWorkout(cacheKey, validated);

        return NextResponse.json(validated, {
          headers: {
            "x-workout-cache": bypassCache ? "BYPASS" : "MISS",
          },
        });
      } catch (error) {
        if (attempt === 1) {
          if (error instanceof Error && error.name === "ZodError") {
            throw new Error("The generated workout was incomplete. Please try again.");
          }
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
