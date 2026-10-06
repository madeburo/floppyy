import { timingSafeEqual } from "node:crypto";
import { guestbookStore } from "@/lib/guestbook/store";
import { clientIp, hashIp, rateLimit } from "@/lib/guestbook/ratelimit";
import { validateSubmission } from "@/lib/guestbook/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(provided: string | null | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const POST_LIMIT = 5;
const POST_WINDOW_SEC = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const beforeParam = Number(url.searchParams.get("before"));
  const checkedIds = [...new Set((url.searchParams.get("checkIds") ?? "").split(",").map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 100);

  try {
    const messages = await guestbookStore().list({
      limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
      before: Number.isFinite(beforeParam) && beforeParam > 0 ? beforeParam : undefined,
    });
    const existing = new Set(await guestbookStore().existingIds(checkedIds));
    return Response.json(
      { messages, deletedIds: checkedIds.filter((id) => !existing.has(id)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[guestbook] GET failed:", error);
    return Response.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = (payload ?? {}) as Record<string, unknown>;

  if (typeof data.website === "string" && data.website.trim() !== "") {
    return Response.json({ ok: true }, { status: 202 });
  }

  const validation = validateSubmission({
    nick: data.nick,
    body: data.body,
    status: data.status,
    avatar: data.avatar,
  });
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request));
  const limit = await rateLimit(ipHash, POST_LIMIT, POST_WINDOW_SEC);
  if (!limit.ok) {
    return Response.json(
      { error: `Slow down — try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    // Anti-flood: reject a message identical to the one right before it
    // (same nick + same body), so nobody can spam the same line twice in a row.
    const [previous] = await guestbookStore().list({ limit: 1 });
    if (
      previous &&
      previous.nick.trim().toLowerCase() === validation.nick.trim().toLowerCase() &&
      previous.body.trim().toLowerCase() === validation.body.trim().toLowerCase()
    ) {
      return Response.json(
        { error: "You already said that — try something new." },
        { status: 409 },
      );
    }

    const message = await guestbookStore().add({
      nick: validation.nick,
      body: validation.body,
      avatar: validation.avatar,
      status: validation.status,
      ipHash,
    });
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[guestbook] POST failed:", error);
    return Response.json({ error: "Failed to post message." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminToken = process.env.GUESTBOOK_ADMIN_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "Deletion is not enabled." }, { status: 501 });
  }

  const provided =
    request.headers.get("x-admin-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!tokenMatches(provided, adminToken)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "A positive integer `id` is required." }, { status: 400 });
  }

  try {
    const removed = await guestbookStore().remove(id);
    return Response.json(
      { ok: removed },
      { status: removed ? 200 : 404, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[guestbook] DELETE failed:", error);
    return Response.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
