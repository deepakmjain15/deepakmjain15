import { Badge, ButtonLink, Card, ProgressBar, FitValue } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";

const STEPS = [
  {
    title: "Create a trip",
    body: "Name it, say roughly how many people are coming, and get a short link to drop in the group chat.",
  },
  {
    title: "Everyone adds their preferences",
    body: "Budget, dates, the kind of place and trip they want, and what they'd rather avoid. Two minutes, no account.",
  },
  {
    title: "See where you agree and where you don't",
    body: "TripMate lines up everyone's constraints and shows the overlap, the conflicts and the trade-offs.",
  },
  {
    title: "Choose from balanced options",
    body: "Get 2–3 realistic destinations with an honest fit score for every person. Then your group decides.",
  },
];

const CYCLE = ["Someone suggests a destination", "Others react", "A date or budget clash appears", "The conversation dies", "Repeat"];

const SAMPLE_FIT = [
  { name: "Aisha", fit: 88 },
  { name: "Rohan", fit: 81 },
  { name: "Mei", fit: 74 },
  { name: "Daniel", fit: 62 },
];

function ProductPreview() {
  return (
    <Card className="w-full max-w-md p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Option 1 of 3</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Lisbon, Portugal</h3>
          <p className="mt-0.5 text-sm text-muted">Mid-budget city break with beach days</p>
        </div>
        <div className="text-right">
          <FitValue fit={76} className="text-2xl" />
          <p className="text-xs text-subtle">group fit</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone="brand">€650 – €850 pp</Badge>
        <Badge>12 – 17 Oct</Badge>
        <Badge tone="good">Fits 4 of 4 date ranges</Badge>
      </div>
      <div className="mt-5 space-y-2.5">
        {SAMPLE_FIT.map((p) => (
          <div key={p.name} className="grid grid-cols-[64px_1fr_40px] items-center gap-3 text-sm">
            <span className="text-muted">{p.name}</span>
            <ProgressBar value={p.fit} tone="fit" size="sm" />
            <FitValue fit={p.fit} className="text-right text-xs" />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-warn-soft px-3 py-2.5 text-xs leading-relaxed text-warn">
        <span className="font-semibold">Daniel&apos;s compromise:</span> about €80 over budget and less
        hiking than hoped.
      </div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <>
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Badge tone="brand">For group trips stuck in the chat</Badge>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[56px]">
              Turn everyone&apos;s trip preferences into a plan everyone can actually agree on.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Collect each friend&apos;s budget, dates and must-haves in one place. TripMate shows where your group
              agrees, where it doesn&apos;t, and a few balanced options to choose from.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/create" size="lg">
                Create a Trip
              </ButtonLink>
              <ButtonLink href="/join" size="lg" variant="secondary">
                Join a Trip
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-subtle">No sign-up. Share one link with your group.</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProductPreview />
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-brand">The problem</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
                1,200 messages. Three months. Zero plans.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Group chats are great for talking and terrible for deciding. Nobody has a clear view of everyone&apos;s
                constraints, so every suggestion hits the same wall. Another poll won&apos;t fix that.
              </p>
            </div>
            <ol className="space-y-2 self-center">
              {CYCLE.map((item, i) => (
                <li key={item} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-subtle ring-1 ring-line">
                    {i === CYCLE.length - 1 ? "↻" : i + 1}
                  </span>
                  <span className={i === CYCLE.length - 1 ? "text-subtle" : "text-ink"}>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-medium text-brand">How it works</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-balance">
            A structured process instead of another poll
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Card key={step.title} className="p-5">
                <span className="text-sm font-semibold text-brand tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Principle */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-8 rounded-3xl bg-ink px-6 py-12 text-white sm:px-12 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">The AI suggests. Your group decides.</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                TripMate never crowns a single &quot;best&quot; destination. It shows the options, the trade-offs, and
                exactly who would be compromising on what, so the choice stays with you.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <ButtonLink href="/create" size="lg" variant="inverse">
                Create a Trip
              </ButtonLink>
              <ButtonLink href="/join" size="lg" variant="ghostInverse">
                I have a code
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
