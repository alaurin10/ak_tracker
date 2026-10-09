// KV and day-counting helpers.

// Days roll over at midnight in this timezone.
export const TIMEZONE = "America/Los_Angeles";

// PIN required to reset the counter.
export const RESET_PIN = "1234";

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

export async function readState(env, site) {
  if (!env.AK_KV) {
    throw new Error(
      "Storage isn't connected. In Cloudflare, add a KV namespace binding named AK_KV " +
        "(Settings → Bindings), then redeploy."
    );
  }
  const stored = await env.AK_KV.get(site.kvKey, "json");
  if (stored) return stored;
  const fresh = { lastReset: new Date().toISOString() };
  await env.AK_KV.put(site.kvKey, JSON.stringify(fresh));
  return fresh;
}

export async function writeState(env, site, state) {
  await env.AK_KV.put(site.kvKey, JSON.stringify(state));
}

// State plus derived fields, as returned to clients.
export function view(state, now = new Date()) {
  const days = daysBetween(new Date(state.lastReset), now, TIMEZONE);
  return {
    lastReset: state.lastReset,
    days,
    timezone: TIMEZONE,
    pinRequired: true,
  };
}
