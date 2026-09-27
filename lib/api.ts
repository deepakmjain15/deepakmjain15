import "server-only";
import { NextResponse } from "next/server";
import { ConfigError } from "./supabase";

// Consistent JSON error responses for route handlers.
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleUnexpected(err: unknown, fallback: string) {
  console.error(err);
  if (err instanceof ConfigError) return jsonError(err.message, 500);
  return jsonError(fallback, 500);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
