import { daysBetween, readState, timezone, view, writeState } from "./state.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/state") {
      if (request.method === "GET") return getState(env);
      if (request.method === "POST") return resetState(request, env);
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/" && request.method === "GET") {
      return homePage(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function getState(env) {
  try {
    return json(view(await readState(env), env));
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// Reset the counter to now. Body: { pin?: string }.
// If the RESET_PIN secret is set, the matching pin is required.
async function resetState(request, env) {
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

// Serve index.html with the current count baked into the link-preview
// (Open Graph) tags, so sharing the URL in a text/chat shows the number.
async function homePage(request, env) {
  const res = await env.ASSETS.fetch(request);
  let days;
  try {
    days = view(await readState(env), env).days;
  } catch {
    return res;
  }

  const title = `${days} ${days === 1 ? "day" : "days"} since Maddi mentioned Alaska`;
  const setContent = (value) => ({
    element(el) {
      el.setAttribute("content", value);
    },
  });

  const rewritten = new HTMLRewriter()
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[name="twitter:title"]', setContent(title))
    .on("title", {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .transform(res);

  const headers = new Headers(rewritten.headers);
  headers.set("cache-control", "no-store");
  return new Response(rewritten.body, { status: rewritten.status, headers });
}
