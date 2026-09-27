import "server-only";

// Names (never values) of required server env vars that are missing.
export function missingServerEnv(): string[] {
  return ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"].filter((key) => !process.env[key]);
}
