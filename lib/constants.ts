// Shared option lists. Safe to import from both server and client code.

export const DESTINATION_TYPES = ["Beach", "Mountains", "City", "Nature", "Any"] as const;
export const TRIP_STYLES = ["Relaxation", "Adventure", "Nightlife", "Culture", "Food", "Mixed"] as const;
export const FLEXIBILITY_LEVELS = ["Low", "Medium", "High"] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED"] as const;

export type DestinationType = (typeof DESTINATION_TYPES)[number];
export type TripStyle = (typeof TRIP_STYLES)[number];
export type Flexibility = (typeof FLEXIBILITY_LEVELS)[number];
export type Currency = (typeof CURRENCIES)[number];

export const FLEXIBILITY_HINTS: Record<Flexibility, string> = {
  Low: "My dates and budget are fixed",
  Medium: "I can bend a little",
  High: "I'm easy, happy to adapt",
};

export const LIMITS = {
  nameMax: 60,
  tripNameMax: 80,
  textMax: 500,
  maxTravellers: 50,
  maxBudget: 10_000_000,
};
