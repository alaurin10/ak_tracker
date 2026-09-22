# ak_tracker

Days since Maddi last mentioned Alaska. Live at **ak.andrewlaurin.com**.

- A big counter that goes up by one each calendar day
- A **"She mentioned it"** button that resets to 0, and can backdate the mention
- **Share image** builds a 1080×1080 PNG. Phones open the share sheet and desktops download the file.
- **Copy text** copies a one-liner with the link
- Link previews in iMessage, Slack and similar apps show the current count
- The count is stored in Cloudflare KV, so everyone sees the same number

## How it works

| Path | What |
| --- | --- |
| `public/index.html` | The whole page (HTML/CSS/JS, no build step) |
| `functions/api/state.js` | `GET` returns the count, `POST` resets it |
| `functions/index.js` | Adds the current count to the page title and link-preview tags |
| `lib/state.js` | Shared KV and day-counting helpers |

It runs on **Cloudflare Pages** with Pages Functions and a single KV key.

## Deploy (one time)

You need Node 18+ and a Cloudflare login (`npx wrangler login`).

1. **Create the KV namespace** and paste the printed `id` into `wrangler.toml`:
   ```sh
   npx wrangler kv namespace create AK_KV
   ```
2. **Create the Pages project and deploy:**
   ```sh
   npx wrangler pages project create ak-tracker --production-branch main
   npx wrangler pages deploy
   ```
   It's now live at `https://ak-tracker.pages.dev`.
3. **(Optional, recommended) Set a reset PIN** so random visitors can't reset it:
   ```sh
   npx wrangler pages secret put RESET_PIN
   npx wrangler pages deploy
   ```
   The page asks for the PIN on the first reset and remembers it in that browser.
4. **Add the subdomain:** Cloudflare dashboard → *Workers & Pages* → **ak-tracker** →
   *Custom domains* → *Set up a custom domain* → `ak.andrewlaurin.com`.
   Because `andrewlaurin.com` is already on Cloudflare, it creates the `CNAME`
   record and the SSL certificate for you. It usually takes a minute or two.

Alternatively, connect this GitHub repo in the dashboard (*Workers & Pages → Create →
Pages → Connect to Git*) so every push to `main` deploys. Use no build command and set the
output directory to `public`. The KV binding comes from `wrangler.toml`.

## Settings

- `TIMEZONE` in `wrangler.toml` (default `America/New_York`) sets when a new day starts.
- The first visit starts the counter at today. To start from an earlier date, use the
  reset button and pick that date.

## Local dev

```sh
echo 'RESET_PIN=1234' > .dev.vars   # optional
npx wrangler pages dev
```
