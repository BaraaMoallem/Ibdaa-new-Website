import { createHmac } from "node:crypto";
import { validateCase } from "./case-validation";

const maxBytes = 20000;
const attempts = new Map<string, { count: number; expires: number }>();
function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function reject(code: string, status: number, safeToEdit = true) {
  return reply({ ok: false, code, safeToEdit }, status);
}
// This is an early, per-process throttle. Apps Script applies durable limits under a lock.
function throttle(key: string) {
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.expires < now) attempts.delete(id);
  if (attempts.size >= 10000 && !attempts.has(key)) return false;
  const entry = attempts.get(key) || { count: 0, expires: now + 15 * 60 * 1000 };
  entry.count++; attempts.set(key, entry);
  return entry.count <= 20;
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) { await reader.cancel(); throw new Error("body"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function handleCaseSubmission(request: Request) {
  const configuredOrigin = process.env.CASE_ALLOWED_ORIGIN;
  let origin: string;
  try {
    origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    if (process.env.NODE_ENV === "production" && (!configuredOrigin || !origin.startsWith("https://"))) return reject("unavailable", 503);
  } catch { return reject("unavailable", 503); }
  if (request.headers.get("origin") !== origin) return reject("origin", 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reject("invalid", 415);
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return reject("invalid", 413);
  let body;
  try { body = await readBody(request); } catch { return reject("invalid", 400); }
  if (!body || typeof body !== "object" ||
    typeof body.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId) ||
    !["en", "ar"].includes(body.locale)) return reject("invalid", 400);
  const validation = validateCase(body.data);
  if (!validation.valid) return reply({ ok: false, code: "invalid", errors: validation.errors, safeToEdit: true }, 422);
  const url = process.env.GOOGLE_CASE_SCRIPT_URL;
  const secret = process.env.GOOGLE_CASE_SHARED_SECRET;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url) || !secret || secret.length < 32) return reject("unavailable", 503);
  const phoneHash = createHmac("sha256", secret).update(validation.data.phone).digest("hex");
  if (!throttle(phoneHash)) return reject("rate", 429, false);
  const payload = JSON.stringify({ requestId: body.requestId.toLowerCase(), locale: body.locale, data: validation.data });
  const sentAt = Date.now();
  const signature = createHmac("sha256", secret).update(`${sentAt}.${payload}`).digest("hex");
  try {
    const upstream = await fetch(url, {
      method: "POST", redirect: "follow", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 1, sentAt, payload, signature }),
      signal: AbortSignal.timeout(35000),
    });
    if (!upstream.ok) return reject("integration", 502, false);
    const result = await upstream.json();
    // Apps Script ContentService returns application-level errors inside HTTP 200.
    if (result.version !== 1 || result.requestId !== body.requestId.toLowerCase()) return reject("integration", 502, false);
    const validReference = typeof result.reference === "string" && /^IBD-\d{8}-[a-f0-9]{32}$/.test(result.reference);
    if (result.ok === true && validReference && typeof result.responseId === "string" && result.responseId.length > 0) {
      return reply({ ok: true, reference: result.reference });
    }
    if (result.code === "pending" && validReference) return reply({ ok: false, code: "pending", reference: result.reference, safeToEdit: false }, 409);
    if (result.code === "rate") return reject("rate", 429, false);
    return reject("integration", 502, false);
  } catch {
    // Never log request bodies, upstream responses, or exception objects containing private data.
    return reject("integration", 502, false);
  }
}
