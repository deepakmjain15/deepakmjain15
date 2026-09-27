@AGENTS.md

# TripMate AI

## Product context

TripMate AI is a group-trip decision-making tool for friends who can't agree on a trip because everyone has
different schedules, budgets and preferences.

The canonical user story: five friends have tried to plan a trip for three months. Their group chat has 1,200+
messages and zero confirmed plans. The loop repeats: someone suggests a destination → others react → a date or
budget conflict appears → the conversation dies → repeat. There's no structured record of preferences and no
synthesis of constraints. The coordinator wants a structured process, not another poll.

**Core principle: the product helps the group decide, it never decides for them.** The AI surfaces agreement,
conflict, trade-offs and options. Humans make the final choice. Never label an option "best" or "recommended".

## Product requirements (MVP)

Flow: Create trip → share link → friends submit preferences → coordinator dashboard → analyse → 2–3 options with
individual fit and trade-offs → group decides.

- **Create trip** (`/create`): trip name, coordinator name, approx. number of travellers (+ optional departure
  city and budget currency). Generates a 6-char code and share URL `/t/{CODE}`.
- **Join** (`/join` or `/t/{CODE}`): name, max budget per person, available start/end dates, destination types
  (Beach, Mountains, City, Nature, Any), trip styles (Relaxation, Adventure, Nightlife, Culture, Food, Mixed),
  must-haves, things to avoid, flexibility (Low/Medium/High). **Submitting again with the same name
  (case/whitespace-insensitive) updates the existing response.**
- **Dashboard** (`/t/{CODE}/dashboard`): responses received vs expected, submitted and pending travellers,
  deterministic group summary (budget range, common/best date window, destination & style tallies),
  share link, "Analyze Trip Options". **Analysis must work with partial responses** and clearly show the count.
- **Analysis** (`POST /api/trips/{CODE}/analyze`): Gemini finds common/conflicting preferences, budget and
  date constraints, destination/style overlap and trade-offs, and returns 2–3 options. Each option has:
  destination, group fit %, why it works, strengths, trade-offs, cost range, suggested dates, and individual fit
  + compromise for every participant.
- **Results** (`/t/{CODE}/results`): heading "Your Group's Trip Options", "Where the group agrees",
  "Where the group has trade-offs", constraint summaries, 2–3 option cards, and a hand-off to the group
  (copy summary for the group chat). Warns when responses changed since the last analysis.

**Out of scope — do not build:** authentication, payments, flight/hotel booking, maps, email invites,
complex voting, chat, extra external APIs.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first config: tokens live in `app/globals.css` under `@theme`)
- Supabase (Postgres) via `@supabase/supabase-js`, **server-side only**, service role key
- Gemini via its REST API using `fetch` (no SDK), structured JSON output (`responseSchema`)
- Deploy target: Vercel

Dependencies are intentionally minimal: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `server-only`.
Don't add libraries (UI kits, form libs, validation libs, ORMs, AI SDKs) without a strong reason.

## Architecture

```
app/
  page.tsx                      Landing page
  create/page.tsx               Create trip (CreateTripForm)
  join/page.tsx                 Enter trip code (JoinCodeForm)
  t/[code]/layout.tsx           Trip header + tabs (loads trip, 404s if missing)
  t/[code]/page.tsx             Participant preference form
  t/[code]/dashboard/page.tsx   Coordinator dashboard
  t/[code]/results/page.tsx     AI trip options
  api/trips/route.ts                      POST create trip
  api/trips/[code]/responses/route.ts     GET (lookup by name) / POST (create or update) preferences
  api/trips/[code]/analyze/route.ts       POST run Gemini analysis and store it
components/                     UI. Files with "use client" are interactive; everything else is a server component
  ui.tsx                        Shared primitives (buttons, cards, badges, progress bars, inputs)
lib/
  constants.ts   Option lists + limits (shared client/server)
  types.ts       Domain types incl. AnalysisResult
  validation.ts  Request body validation (hand-written, no library)
  summary.ts     Deterministic group summary: budget stats, date-overlap sweep, tallies
  format.ts      Money/date formatting helpers
  supabase.ts    server-only Supabase client
  db.ts          server-only data access (all SQL/queries live here)
  gemini.ts      server-only prompt, JSON schema, Gemini call, output normalisation
  trip-loader.ts server-only request-cached loaders for pages
  env.ts         server-only check for missing env var names
supabase/schema.sql  Tables: trips, participants, preferences, analyses (RLS on, no policies)
```

Data flow: pages are server components that read via `lib/trip-loader.ts` → `lib/db.ts`. Client components
mutate through the route handlers in `app/api`. After a mutation, clients call `router.refresh()`.

Analysis: `summarise()` computes exact facts (budget min/median/max, date windows, tallies) which are sent to
Gemini alongside raw responses so the model doesn't miscount. The model's output is normalised in
`lib/gemini.ts`: individual fits are re-keyed to real participant names (every participant always present),
numbers clamped, dates validated, and **group fit is recomputed as the average of individual fits** so the
headline number is explainable.

## Important development rules

1. **Secrets stay on the server.** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are only read in files that
   `import "server-only"`. Never prefix them with `NEXT_PUBLIC_`, never import `lib/db.ts`, `lib/supabase.ts`
   or `lib/gemini.ts` from a `"use client"` file.
2. **Never hardcode keys.** Use `.env.local` (gitignored) locally and Vercel env vars in production.
   `.env.example` holds placeholders only.
3. **All DB access goes through `lib/db.ts`** using the service role client. RLS is enabled with no policies, so
   the anon key can't read anything. Keep it that way.
4. **Validate every request body server-side** in `lib/validation.ts`; client checks are only for UX.
5. **Decision support, not decision making.** Prompts and UI copy must never crown a single option. Keep the
   "Where the group agrees / has trade-offs" framing and per-person compromises visible.
6. **Partial responses are first-class.** Never block analysis on everyone responding. Always show
   "based on X of Y responses".
7. Next 16 conventions: route `params` are Promises (`await params`); there is no `next lint`.
   Check `node_modules/next/dist/docs/` when unsure about an API.
8. Keep it simple and beginner-friendly: server components by default, `"use client"` only for interactivity,
   no global state libraries, Tailwind utility classes with the tokens in `globals.css`.
9. Design: clean and calm. Neutral paper background, one brand green, semantic good/warn/bad colours. No
   decorative gradients or heavy animation. Every async action needs loading and error states, and every list
   needs an empty state.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # production build (also type-checks)
```
