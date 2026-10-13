import { ZodError } from "zod";
import { sql, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { ApiError, sha384 } from "./rules";

export const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
export function json(value: unknown, status = 200) { return Response.json(value, { status, headers: noStore }); }
export async function handle(action: () => Promise<Response>) {
  try { return await action(); }
  catch (error) {
    if (error instanceof ApiError) return json({ error:error.message,code:error.code },error.status);
    if (error instanceof ZodError) return json({error:"Sprawdź dane formularza i spróbuj ponownie.",code:"INVALID_INPUT",fields:error.issues.map(i => i.path.join("."))},422);
    // Never log request bodies, provider responses, credentials, or passenger information.
    console.error("Booking service error", error instanceof Error ? error.name : "UnknownError");
    return json({error:"Nie udało się zakończyć operacji. Spróbuj ponownie za chwilę.",code:"SERVICE_ERROR"},503);
  }
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new ApiError(403,"ORIGIN","Nieprawidłowe źródło żądania.");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403,"ORIGIN","Nieprawidłowe źródło żądania.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new ApiError(415,"CONTENT_TYPE","Wymagany format JSON.");
  if (Number(request.headers.get("content-length") || 0) > 16_384) throw new ApiError(413,"TOO_LARGE","Żądanie jest zbyt duże.");
  const body = await request.text();
  if (body.length > 16_384) throw new ApiError(413,"TOO_LARGE","Żądanie jest zbyt duże.");
  try { return JSON.parse(body); } catch { throw new ApiError(400,"INVALID_JSON","Nieprawidłowy format danych."); }
}
export async function rateLimit(request: Request, category: string, limit: number) {
  const now = Date.now();
  const ip = request.headers.get("cf-connecting-ip") || "local-preview";
  const id = await sha384(`${category}:${ip}:${Math.floor(now / 60_000)}`);
  const db = getDb();
  const rows = await db.insert(rateLimits).values({id,count:1,expiresAt:now+120_000})
    .onConflictDoUpdate({target:rateLimits.id,set:{count:sql`${rateLimits.count} + 1`}}).returning({count:rateLimits.count});
  if (rows[0].count > limit) throw new ApiError(429,"RATE_LIMIT","Zbyt wiele prób. Spróbuj ponownie za minutę.");
  // Keep short-lived abuse counters bounded; no raw IP addresses are persisted.
  if (rows[0].count === 1) await db.delete(rateLimits).where(lt(rateLimits.expiresAt,now));
}
