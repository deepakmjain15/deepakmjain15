# TripMate AI

Turn everyone's trip preferences into a plan everyone can actually agree on.

A coordinator creates a trip and shares a link. Friends add their budget, dates and preferences. TripMate
shows where the group agrees and where it doesn't, then uses Gemini to propose 2–3 balanced destination
options with an honest fit score for every person. The group makes the final call.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Go to **Project Settings → API** and copy the **Project URL** and the **service_role** key.

### 3. Get a Gemini API key

Create a key at [Google AI Studio](https://aistudio.google.com/apikey).

### 4. Add environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (secret!) |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-3.8-flash`. Any Gemini model with JSON output works |

These are all server-only. Never commit `.env.local` (it's gitignored) and never prefix these with `NEXT_PUBLIC_`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000. A yellow "Setup needed" banner appears at the top if any variable is missing.

## Test the full flow

1. **Create**: click *Create a Trip*, enter a name, your name and 5 travellers, then copy the link.
2. **Join**: open the link (try a private window to simulate a friend), fill in the form and submit.
   Add 2–3 people with different budgets, dates and styles.
3. **Update**: submit again with an existing name (any capitalisation). The form reloads that person's
   answers and updates their response instead of creating a duplicate.
4. **Dashboard**: open *Group dashboard* to see 3 / 5 responses, the pending slots and the group summary.
5. **Analyze**: click *Analyze Trip Options* without waiting for everyone. It takes 10–30 seconds.
6. **Results**: review the agreements, trade-offs and 2–3 option cards with per-person fit and compromises.
7. **Re-run**: add another response. The dashboard and results page flag that responses changed, so you can
   re-run the analysis.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add the same four environment variables in **Project Settings → Environment Variables**.
3. Deploy. The analysis route allows up to 60 seconds for Gemini to respond.

## Scripts

- `npm run dev`: start the dev server
- `npm run typecheck`: TypeScript check
- `npm run build`: production build
- `npm start`: serve the production build

See [CLAUDE.md](CLAUDE.md) for architecture and development rules.
