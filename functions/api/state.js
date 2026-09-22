import { daysBetween, readState, timezone, view, writeState } from "../../lib/state.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestGet({ env }) {
  try {
    return json(view(await readState(env), env));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// Reset the counter to now. Body: { pin?: string }.
// If the RESET_PIN secret is set, the matching pin is required.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  if (env.RESET_PIN && body.pin !== env.RESET_PIN) {
    return json({ error: "Wrong PIN" }, 401);
  }

  try {
    const now = new Date();
    const state = await readState(env);
    const streak = daysBetween(new Date(state.lastReset), now, timezone(env));
    const next = { lastReset: now.toISOString(), best: Math.max(state.best, streak) };
    await writeState(env, next);
    return json(view(next, env, now));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
