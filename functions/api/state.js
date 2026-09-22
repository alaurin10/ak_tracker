import { daysBetween, readState, timezone, view, writeState } from "../../lib/state.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestGet({ env }) {
  return json(view(await readState(env), env));
}

// Reset the counter. Body: { pin?: string, at?: ISO date string }.
// If the RESET_PIN secret is set, the matching pin is required.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  if (env.RESET_PIN && body.pin !== env.RESET_PIN) {
    return json({ error: "Wrong PIN" }, 401);
  }

  const now = new Date();
  const at = body.at ? new Date(body.at) : now;
  if (Number.isNaN(at.getTime()) || at > now) {
    return json({ error: "Invalid date" }, 400);
  }

  const state = await readState(env);
  const tz = timezone(env);
  const streak = daysBetween(new Date(state.lastReset), at, tz);
  const next = {
    lastReset: at.toISOString(),
    resets: state.resets + 1,
    best: Math.max(state.best, streak),
  };
  await writeState(env, next);
  return json(view(next, env, now));
}
