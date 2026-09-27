import type { Currency, DestinationType, Flexibility, TripStyle } from "./constants";

export type Trip = {
  id: string;
  code: string;
  name: string;
  coordinatorName: string;
  expectedTravellers: number;
  departingFrom: string | null;
  currency: Currency;
  createdAt: string;
};

export type PreferenceInput = {
  name: string;
  budgetMax: number;
  availableStart: string; // YYYY-MM-DD
  availableEnd: string; // YYYY-MM-DD
  destinationTypes: DestinationType[];
  tripStyles: TripStyle[];
  mustHaves: string;
  avoid: string;
  flexibility: Flexibility;
};

export type ParticipantResponse = PreferenceInput & {
  participantId: string;
  updatedAt: string;
};

// ---- AI analysis (the shape we ask Gemini to return, after normalisation) ----

export type Insight = { title: string; detail: string };
export type Conflict = Insight & { participants: string[] };

export type IndividualFit = {
  name: string;
  fit: number | null; // 0–100; null if the model skipped this person
  note: string;
  compromise: string; // empty if no compromise is needed
};

export type TripOption = {
  destination: string;
  country: string;
  tagline: string;
  groupFit: number; // 0–100, average of individual fits
  whyItWorks: string;
  strengths: string[];
  tradeOffs: string[];
  costMin: number;
  costMax: number;
  costNote: string;
  suggestedStart: string;
  suggestedEnd: string;
  datesNote: string;
  individualFit: IndividualFit[];
};

export type AnalysisResult = {
  overview: string;
  agreements: Insight[];
  conflicts: Conflict[];
  tradeOffs: Insight[];
  constraints: {
    budget: string;
    dates: string;
    destinationTypes: string;
    tripStyles: string;
  };
  options: TripOption[];
  decisionNote: string;
};

export type StoredAnalysis = {
  id: string;
  responseCount: number;
  responsesUpdatedAt: string | null;
  model: string;
  result: AnalysisResult;
  createdAt: string;
};
