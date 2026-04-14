import { WorkoutGenerator } from "@/components/workout-generator";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fde68a_0%,#fff7ed_24%,#fff_65%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-6">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/70 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8 xl:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)] xl:items-end">
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Showcase MVP
              </p>
              <div className="space-y-3">
                <h1 className="max-w-5xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-6xl xl:text-7xl">
                  Workout plans that feel tailored, not generic.
                </h1>
                <p className="max-w-4xl text-base leading-7 text-slate-600 sm:text-lg xl:text-[1.15rem]">
                  Enter your goal, time, equipment, and constraints. The app returns
                  a clear session with warm-up, main block, cooldown, timing, and a
                  short rationale you can demo in one flow.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] bg-slate-950 p-5 text-slate-50 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)] xl:min-h-[240px]">
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  What it generates
                </span>
                <span className="text-sm text-slate-300">
                  Warm-up, working sets, reps, rest, cooldown, session timing, and
                  why the plan fits the inputs.
                </span>
              </div>
              <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Clear, structured output
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Mobile-friendly single page
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Fast regenerate loop
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Deployment-ready env setup
                </div>
              </div>
            </div>
          </div>
        </section>
        <WorkoutGenerator />
      </div>
    </main>
  );
}
