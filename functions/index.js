import { readState, view } from "../lib/state.js";

// Serve index.html with the current count baked into the link-preview
// (Open Graph) tags, so sharing the URL in a text/chat shows the number.
export async function onRequestGet({ env, next }) {
  const res = await next();
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
