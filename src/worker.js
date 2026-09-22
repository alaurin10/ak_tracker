import { siteFor } from "./sites.js";
import { RESET_PIN, TIMEZONE, daysBetween, readState, view, writeState } from "./state.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const site = siteFor(url);

    if (url.pathname === "/api/state") {
      if (request.method === "GET") return getState(env, site);
      if (request.method === "POST") return resetState(request, env, site);
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/" && request.method === "GET") {
      return homePage(request, env, site);
    }

    return env.ASSETS.fetch(request);
  },
};

async function getState(env, site) {
  try {
    return json(view(await readState(env, site)));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// Reset the counter to now. Body: { pin?: string }.
// Requires the matching RESET_PIN.
async function resetState(request, env, site) {
  const body = await request.json().catch(() => ({}));

  if (String(body.pin ?? "") !== RESET_PIN) {
    return json({ error: "Wrong PIN" }, 401);
  }

  try {
    const now = new Date();
    const state = await readState(env, site);
    const streak = daysBetween(new Date(state.lastReset), now, TIMEZONE);
    const next = { lastReset: now.toISOString(), best: Math.max(state.best, streak) };
    await writeState(env, site, next);
    return json(view(next, now));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// Serve index.html for this site: its names in the text, and the current
// count in the title and link-preview (Open Graph) tags so sharing the URL
// in a text/chat shows the number.
async function homePage(request, env, site) {
  // Fetch the asset by its plain path so ?site=... doesn't affect caching.
  const res = await env.ASSETS.fetch(new URL("/", request.url));
  let days = null;
  try {
    days = view(await readState(env, site)).days;
  } catch {
    // Still serve the page; it shows the error itself.
  }

  const subject = `since ${site.person} mentioned ${site.place}`;
  const title = days === null ? `Days ${subject}` : `${days} ${days === 1 ? "day" : "days"} ${subject}`;
  const description = `A running count of days since ${site.person} last mentioned ${site.place}.`;
  const icon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${site.emoji}</text></svg>`;
  const siteJson = JSON.stringify({
    id: site.id,
    person: site.person,
    place: site.place,
    resetLabel: site.resetLabel,
    emoji: site.emoji,
  }).replace(/</g, "\\u003c");

  const attr = (name, value) => ({
    element(el) {
      el.setAttribute(name, value);
    },
  });
  const text = (value) => ({
    element(el) {
      el.setInnerContent(value);
    },
  });

  const rewritten = new HTMLRewriter()
    .on("title", text(title))
    .on('meta[property="og:title"]', attr("content", title))
    .on('meta[name="twitter:title"]', attr("content", title))
    .on('meta[name="description"]', attr("content", description))
    .on('meta[property="og:description"]', attr("content", description))
    .on('link[rel="icon"]', attr("href", icon))
    .on("#label", text(`Days since ${site.person} last mentioned ${site.place}`))
    .on("#resetText", text(site.resetLabel))
    .on("#resetBlurb", text(`${site.person} mentioned ${site.place} again. Back to square one.`))
    .on("head", {
      element(el) {
        el.append(`<script>window.SITE = ${siteJson};</script>`, { html: true });
      },
    })
    .transform(res);

  const headers = new Headers(rewritten.headers);
  headers.set("cache-control", "no-store");
  return new Response(rewritten.body, { status: rewritten.status, headers });
}
