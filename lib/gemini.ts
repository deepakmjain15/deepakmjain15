import "server-only";
import type { AnalysisResult, Conflict, IndividualFit, Insight, ParticipantResponse, Trip, TripOption } from "./types";
import type { GroupSummary } from "./summary";
import { nameKey } from "./db";

// Calls the Gemini REST API directly with fetch (no SDK needed).
// Docs: https://ai.google.dev/api/generate-content

const DEFAULT_MODEL = "gemini-3.8-flash";

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

const SYSTEM_INSTRUCTION = `You are TripMate AI, a neutral decision-support assistant for a group of friends planning a trip together.

Your job is to help the group decide, NOT to decide for them.
- Surface where the group agrees, where it conflicts, and the real trade-offs.
- Propose 2 or 3 genuinely different, realistic destination options that each balance the group differently.
- Never call any option "the best", "the winner", or say the group "should" pick it. Present options as choices with honest pros and cons.
- Be honest about fit. If an option asks someone to compromise (over budget, outside their dates, a style they dislike, something on their avoid list), say so plainly and name them.
- Respect hard constraints: "avoid" items and low-flexibility participants' budgets and dates matter most.
- Only reference participants by the exact names provided. Include every participant in every option's individualFit.
- Costs are per person in the trip currency and should include accommodation, food, local transport, activities and an estimate of return travel from the departure region if one is given. Be realistic for the suggested dates.
- Suggested dates must be YYYY-MM-DD and should fall inside the dates most people are available.
- Keep writing concise, specific and friendly. No marketing language.`;

// JSON schema for Gemini's structured output (OpenAPI subset).
const S = { type: "STRING" } as const;
const INT = { type: "INTEGER" } as const;
const INSIGHT = {
  type: "OBJECT",
  properties: { title: S, detail: S },
  required: ["title", "detail"],
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    overview: { ...S, description: "2-3 neutral sentences summarising the group's situation." },
    agreements: { type: "ARRAY", items: INSIGHT, description: "Where the group agrees." },
    conflicts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { title: S, detail: S, participants: { type: "ARRAY", items: S } },
        required: ["title", "detail", "participants"],
      },
      description: "Conflicting preferences, naming who is involved.",
    },
    tradeOffs: { type: "ARRAY", items: INSIGHT, description: "Important trade-offs the group must weigh." },
    constraints: {
      type: "OBJECT",
      properties: {
        budget: { ...S, description: "Budget constraints in one or two sentences." },
        dates: { ...S, description: "Date compatibility in one or two sentences." },
        destinationTypes: { ...S, description: "Destination-type overlap." },
        tripStyles: { ...S, description: "Trip-style overlap." },
      },
      required: ["budget", "dates", "destinationTypes", "tripStyles"],
    },
    options: {
      type: "ARRAY",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "OBJECT",
        properties: {
          destination: { ...S, description: "City or region name." },
          country: S,
          tagline: { ...S, description: "Max 8 words describing what kind of balance this option strikes, e.g. 'Lowest cost, lighter on nightlife'." },
          whyItWorks: { ...S, description: "2-3 sentences." },
          strengths: { type: "ARRAY", items: S },
          tradeOffs: { type: "ARRAY", items: S },
          costMin: { ...INT, description: "Low end of per-person total cost." },
          costMax: { ...INT, description: "High end of per-person total cost." },
          costNote: { ...S, description: "What the cost includes, one short sentence." },
          suggestedStart: { ...S, description: "YYYY-MM-DD" },
          suggestedEnd: { ...S, description: "YYYY-MM-DD" },
          datesNote: { ...S, description: "Why these dates, and who they exclude if anyone." },
          individualFit: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: S,
                fit: { ...INT, description: "0-100 how well this option fits this person." },
                note: { ...S, description: "One short sentence on why." },
                compromise: { ...S, description: "The compromise this person would make, or empty string if none." },
              },
              required: ["name", "fit", "note", "compromise"],
            },
          },
        },
        required: [
          "destination", "country", "tagline", "whyItWorks", "strengths", "tradeOffs",
          "costMin", "costMax", "costNote", "suggestedStart", "suggestedEnd", "datesNote", "individualFit",
        ],
      },
    },
    decisionNote: { ...S, description: "One or two sentences handing the decision back to the group, e.g. what they should discuss to choose." },
  },
  required: ["overview", "agreements", "conflicts", "tradeOffs", "constraints", "options", "decisionNote"],
};

function buildPrompt(trip: Trip, responses: ParticipantResponse[], summary: GroupSummary): string {
  const groupData = {
    trip: {
      name: trip.name,
      currency: trip.currency,
      departingFrom: trip.departingFrom || "not specified",
      expectedTravellers: trip.expectedTravellers,
      responsesReceived: responses.length,
      today: new Date().toISOString().slice(0, 10),
    },
    participants: responses.map((r) => ({
      name: r.name,
      maxBudgetPerPerson: r.budgetMax,
      availableFrom: r.availableStart,
      availableTo: r.availableEnd,
      destinationTypes: r.destinationTypes,
      tripStyles: r.tripStyles,
      mustHaves: r.mustHaves || "none",
      avoid: r.avoid || "none",
      flexibility: r.flexibility,
    })),
    computedFacts: {
      budget: summary.budget,
      dateWindowEveryoneAvailable: summary.commonWindow,
      dateWindowMostPeopleAvailable: summary.bestWindow,
      destinationTypeVotes: summary.destinationTypes.filter((t) => t.count > 0).map((t) => ({ type: t.label, count: t.count })),
      tripStyleVotes: summary.tripStyles.filter((t) => t.count > 0).map((t) => ({ style: t.label, count: t.count })),
    },
  };

  const pending = trip.expectedTravellers - responses.length;
  return [
    `Analyse this group's trip preferences and propose 2-3 balanced destination options.`,
    pending > 0
      ? `Note: only ${responses.length} of ${trip.expectedTravellers} travellers have responded so far. Base the analysis on the responses available and mention that it may change as others respond.`
      : `All expected travellers have responded.`,
    `The "computedFacts" are calculated exactly; trust them over your own arithmetic.`,
    ``,
    JSON.stringify(groupData, null, 2),
  ].join("\n");
}

// ---- Normalisation: never trust model output blindly ----

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const clampFit = (v: unknown): number => Math.max(0, Math.min(100, Math.round(num(v))));
const isoOrEmpty = (v: unknown): string => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "");

function insights(v: unknown): Insight[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => ({ title: str(x?.title), detail: str(x?.detail) }))
    .filter((x) => x.title || x.detail);
}

function normaliseOption(raw: Record<string, unknown>, participants: ParticipantResponse[]): TripOption {
  const rawFits = Array.isArray(raw.individualFit) ? (raw.individualFit as Record<string, unknown>[]) : [];

  // One entry per real participant, in response order, using their real names.
  const individualFit: IndividualFit[] = participants.map((p) => {
    const match = rawFits.find((f) => nameKey(str(f?.name)) === nameKey(p.name));
    if (!match) return { name: p.name, fit: null, note: "Not assessed for this option.", compromise: "" };
    return { name: p.name, fit: clampFit(match.fit), note: str(match.note), compromise: str(match.compromise) };
  });

  // Group fit is the average of individual fits, so the headline number is explainable.
  const scored = individualFit.filter((f) => f.fit !== null) as { fit: number }[];
  const groupFit = scored.length ? Math.round(scored.reduce((sum, f) => sum + f.fit, 0) / scored.length) : 0;

  let costMin = Math.max(0, Math.round(num(raw.costMin)));
  let costMax = Math.max(0, Math.round(num(raw.costMax)));
  if (costMin > costMax) [costMin, costMax] = [costMax, costMin];

  let suggestedStart = isoOrEmpty(raw.suggestedStart);
  let suggestedEnd = isoOrEmpty(raw.suggestedEnd);
  if (suggestedStart && suggestedEnd && suggestedEnd < suggestedStart) [suggestedStart, suggestedEnd] = [suggestedEnd, suggestedStart];

  return {
    destination: str(raw.destination, "Unnamed destination"),
    country: str(raw.country),
    tagline: str(raw.tagline),
    groupFit,
    whyItWorks: str(raw.whyItWorks),
    strengths: strList(raw.strengths),
    tradeOffs: strList(raw.tradeOffs),
    costMin,
    costMax,
    costNote: str(raw.costNote),
    suggestedStart,
    suggestedEnd,
    datesNote: str(raw.datesNote),
    individualFit,
  };
}

function normalise(raw: unknown, participants: ParticipantResponse[]): AnalysisResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const c = (r.constraints ?? {}) as Record<string, unknown>;
  const conflicts: Conflict[] = Array.isArray(r.conflicts)
    ? (r.conflicts as Record<string, unknown>[])
        .map((x) => ({ title: str(x?.title), detail: str(x?.detail), participants: strList(x?.participants) }))
        .filter((x) => x.title || x.detail)
    : [];
  const options = Array.isArray(r.options)
    ? (r.options as Record<string, unknown>[]).slice(0, 3).map((o) => normaliseOption(o ?? {}, participants))
    : [];

  if (options.length === 0) throw new Error("The AI response did not include any trip options. Please try again.");

  return {
    overview: str(r.overview),
    agreements: insights(r.agreements),
    conflicts,
    tradeOffs: insights(r.tradeOffs),
    constraints: {
      budget: str(c.budget),
      dates: str(c.dates),
      destinationTypes: str(c.destinationTypes),
      tripStyles: str(c.tripStyles),
    },
    options,
    decisionNote: str(r.decisionNote),
  };
}

export class GeminiError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

export async function analyseGroup(
  trip: Trip,
  responses: ParticipantResponse[],
  summary: GroupSummary,
): Promise<{ result: AnalysisResult; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the server.", 500);
  }
  const model = geminiModel();

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: buildPrompt(trip, responses, summary) }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  // Stay inside the route's 60s limit, retrying when Gemini is temporarily overloaded (500/503).
  const deadline = Date.now() + 55_000;
  let res: Response;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: AbortSignal.timeout(Math.max(1_000, deadline - Date.now())),
      },
    ).catch((err: unknown) => {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new GeminiError(timedOut ? "Gemini took too long to respond. Please try again." : "Could not reach Gemini. Check your connection and try again.");
    });
    const retryable = res.status === 500 || res.status === 503;
    if (!retryable || attempt >= 4 || deadline - Date.now() < 15_000) break;
    console.warn(`Gemini returned ${res.status}, retrying (attempt ${attempt + 1})…`);
    await new Promise((r) => setTimeout(r, 1_000 * attempt));
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Gemini API error ${res.status}:`, body.slice(0, 1000));
    if (res.status === 400 && body.includes("API_KEY_INVALID")) throw new GeminiError("The GEMINI_API_KEY is invalid.", 500);
    if (res.status === 404) throw new GeminiError(`Gemini model "${model}" was not found. Check GEMINI_MODEL.`, 500);
    if (res.status === 429) throw new GeminiError("Gemini rate limit reached. Wait a minute and try again.", 429);
    if (res.status === 503) throw new GeminiError("Gemini is busy right now. Please try again in a moment.", 503);
    throw new GeminiError(`Gemini returned an error (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? "unknown";
    throw new GeminiError(`Gemini returned an empty response (${reason}). Please try again.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned a response we couldn't read. Please try again.");
  }

  return { result: normalise(parsed, responses), model };
}
