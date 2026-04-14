# Workout Generator

Workout Generator is a polished AI MVP that creates personalized workout sessions from a few user inputs. It is built as a simple, single-page Next.js app for fast demos and straightforward deployment.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Server-side DeepSeek Chat Completions API call with JSON output
- Zod validation for request and response safety

## Project Structure

```text
app/
  api/generate/route.ts   # server endpoint for DeepSeek workout generation
  globals.css             # global styles and field primitives
  layout.tsx
  page.tsx                # single-page UI shell
components/
  workout-generator.tsx   # form, loading, regenerate, error handling
  workout-plan-view.tsx   # structured workout output cards
lib/
  prompts.ts              # model instructions
  workout.ts              # schemas and shared types
```

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the example and add your key:

   ```bash
   # PowerShell
   Copy-Item .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Environment Variables

- `DEEPSEEK_API_KEY`: required
- `DEEPSEEK_MODEL`: optional, defaults to `deepseek-chat`

## Deployment Notes

- The app is ready for Vercel or any standard Next.js host.
- Add the same environment variables in your deployment platform.
- The AI call happens server-side in `app/api/generate/route.ts`, so the API key is not exposed to the client.
