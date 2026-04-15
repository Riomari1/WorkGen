import type { WorkoutPlan } from "@/lib/workout";

type WorkoutPlanViewProps = {
  plan: WorkoutPlan | null;
  isLoading: boolean;
  saveAction?: React.ReactNode;
};

function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] sm:p-6">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function WorkoutPlanView({
  plan,
  isLoading,
  saveAction,
}: Readonly<WorkoutPlanViewProps>) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)]">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded-full bg-slate-200" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-32 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Result Preview
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Your workout plan appears here.
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            The generated session will be split into warm-up, main workout,
            cooldown, body metrics, calorie estimates, and a short explanation
            of how it helps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <SectionCard subtitle={plan.summary.focus} title={plan.summary.title}>
        {saveAction ? <div className="mb-4 flex justify-end">{saveAction}</div> : null}
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Estimated Time
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {plan.summary.estimatedMinutes} min
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Intensity
            </p>
            <p className="mt-2 text-lg font-semibold capitalize text-slate-950">
              {plan.summary.intensity}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Estimated Burn
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {plan.summary.estimatedCalories} cal
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Weight
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {plan.userMetrics ? `${plan.userMetrics.weightKg} kg` : "Approximate"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              BMI
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {plan.userMetrics ? plan.userMetrics.bmi : "Not used"}
            </p>
            {plan.userMetrics ? (
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {plan.userMetrics.bmiCategory}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Session Flow
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Warm-up, focused main block, and cooldown in one session.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Warm-up"
        subtitle="Prepare joints, temperature, and movement quality."
      >
        <div className="grid gap-3 2xl:grid-cols-2">
          {plan.warmup.map((item) => (
            <div
              className="rounded-2xl border border-slate-200 p-4"
              key={`${item.name}-${item.duration}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-950">{item.name}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.details}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {item.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Main Workout"
        subtitle="Working sets with clear reps and recovery."
      >
        <div className="grid gap-3">
          {plan.mainWorkout.map((item, index) => (
            <div
              className="rounded-2xl border border-slate-200 p-4"
              key={`${item.name}-${index + 1}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-slate-950">
                      {item.name}
                    </h4>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.details}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.sets}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.reps}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Rest {item.rest}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                    {item.estimatedMinutes} min
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 capitalize text-emerald-800">
                    {item.intensity}
                  </span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-white">
                    {item.estimatedCalories} cal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Cooldown"
          subtitle="Bring effort down and finish cleanly."
        >
          <div className="grid gap-3">
            {plan.cooldown.map((item) => (
              <div
                className="rounded-2xl border border-slate-200 p-4"
                key={`${item.name}-${item.duration}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {item.name}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.details}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {item.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="How This Helps You"
          subtitle="Benefits tied to the user inputs and session design."
        >
          <div className="space-y-5">
            <p className="text-sm leading-7 text-slate-700">{plan.howItHelps}</p>
            <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Time Breakdown
              </p>
              <div className="grid gap-2">
                {plan.sessionTimeBreakdown.map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                    key={item.label}
                  >
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-950">
                      {item.minutes} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
