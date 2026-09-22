// Shared helpers for the Pages Functions.

const KEY = "state";

export const DEFAULT_TIMEZONE = "America/New_York";

export function timezone(env) {
  return env.TIMEZONE || DEFAULT_TIMEZONE;
}

// Midnight (as a UTC epoch) of the calendar day `date` falls on in `tz`.
function dayStart(date, tz) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return Date.parse(`${ymd}T00:00:00Z`);
}

// Whole calendar days between `from` and `to` in `tz`.
export function daysBetween(from, to, tz) {
  return Math.max(0, Math.round((dayStart(to, tz) - dayStart(from, tz)) / 86400000));
}

export async function readState(env) {
  const stored = await env.AK_KV.get(KEY, "json");
  if (stored) return stored;
  const fresh = { lastReset: new Date().toISOString(), resets: 0, best: 0 };
  await env.AK_KV.put(KEY, JSON.stringify(fresh));
  return fresh;
}

export async function writeState(env, state) {
  await env.AK_KV.put(KEY, JSON.stringify(state));
}

// State plus derived fields, as returned to clients.
export function view(state, env, now = new Date()) {
  const tz = timezone(env);
  const days = daysBetween(new Date(state.lastReset), now, tz);
  return { ...state, days, best: Math.max(state.best, days), timezone: tz };
}
