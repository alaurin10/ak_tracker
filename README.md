# ak_tracker

"Days since…" counters, served by one Cloudflare Worker:

| Address | Counter |
| --- | --- |
| **ak.andrewlaurin.com** | Days since Maddi last mentioned Alaska |
| **banff.andrewlaurin.com** | Days since Dom last mentioned Banff Sunshine Village |

Each address has its own separate count. The names, text and addresses are in `src/sites.js`.

- A big counter that goes up by one each calendar day, plus the longest streak so far
- **She mentioned it** / **Dom mentioned it** resets the count to 0 (PIN required)
- **Share image** saves or shares a square picture of the count
- **Copy text** copies a one-liner with the link
- Pasting the link into iMessage, Slack and similar apps shows the current count in the preview
- Light and dark mode follow your phone or computer setting
- Everyone sees the same count, which is stored on Cloudflare

---

## Setup (all in the browser, no commands)

This runs as a **Cloudflare Worker** connected to this GitHub repo. Merging to `main`
deploys automatically.

### Step 1: Create the Worker from GitHub

1. In the Cloudflare dashboard (dash.cloudflare.com), open **Workers & Pages** and click **Create**.
2. Choose **Import a repository** (Continue with GitHub), allow access to **ak_tracker**,
   and select it.
3. Keep the project name `ak-tracker` and the default build settings: deploy command
   `npx wrangler deploy`, root directory `/`. Click **Deploy**.

The storage for the count is created automatically on the first deploy. It's the
`AK_KV` binding in `wrangler.jsonc`, so there's nothing to set up for it.

### Step 2: Add each address

For each address (`ak.andrewlaurin.com` and `banff.andrewlaurin.com`):

1. In the **ak-tracker** Worker, open **Settings**, then **Domains & Routes**, and click **Add**.
2. Choose **Custom domain**, enter the address, and click **Add domain**.
   Because andrewlaurin.com is already on Cloudflare, it creates the DNS record and
   the security certificate for you.

### Adding another counter later

1. In `src/sites.js`, copy one of the entries and change `id`, `hosts` (the address),
   `kvKey` (any new unique value, like `state:yourname`), `person`, `place`,
   `resetLabel` and `emoji`. Merge to `main`.
2. Add the new address to the Worker, as in Step 2.

### Later

- **Updating the site:** any change merged into `main` on GitHub deploys automatically.
- **PIN and timezone:** both are set at the top of `src/state.js` (`RESET_PIN`, currently
  `1234`, and `TIMEZONE`, currently `America/Los_Angeles`). Edit them there and merge to `main`.

### Troubleshooting

- **Page says "Couldn't load the count":** the text after it says why. Check the latest
  build under the Worker's **Deployments** tab (or **Builds**) and make sure it succeeded.
- **Custom domain won't activate:** it can't if there's already a DNS record named `ak`.
  Delete that record under **andrewlaurin.com**, **DNS**, **Records**, and try again.

---

## How it works

| Path | What |
| --- | --- |
| `public/index.html` | The whole page (HTML/CSS/JS, no build step) |
| `src/worker.js` | `GET /api/state` returns the count, `POST` resets it to now. Serves `/` with the live count in the page title and link-preview tags |
| `src/sites.js` | The counters: address, names, button text, emoji, and where each count is stored |
| `src/state.js` | KV and day-counting helpers, PIN, timezone |
| `wrangler.jsonc` | Worker config: static assets from `public/`, the `AK_KV` storage binding |

## Local dev (optional)

```sh
npx wrangler dev
```

Open `http://localhost:8787/` for the first counter, or add `?site=banff` to see the Banff one.
The same `?site=` trick works on the Worker's `workers.dev` address.
