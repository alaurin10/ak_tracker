# ak_tracker

Days since Maddi last mentioned Alaska. Live at **ak.andrewlaurin.com**.

- A big counter that goes up by one each calendar day, plus the longest streak so far
- **She mentioned it** resets the count to 0
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

### Step 2 (recommended): Set a PIN so only you can reset it

Without a PIN, anyone with the link can reset the counter.

1. Open the **ak-tracker** Worker, then **Settings**, then **Variables and Secrets**,
   and click **Add**.
2. Set **Type** to **Secret**, **Variable name** to `RESET_PIN`, and **Value** to any
   PIN you like. Click **Deploy** (or **Save**).

Each phone or computer asks for the PIN on its first reset and remembers it after that.

### Step 3: Put it on ak.andrewlaurin.com

1. In the Worker, open **Settings**, then **Domains & Routes**, and click **Add**.
2. Choose **Custom domain**, enter `ak.andrewlaurin.com`, and click **Add domain**.
   Because andrewlaurin.com is already on Cloudflare, it creates the DNS record and
   the security certificate for you.

### Later

- **Updating the site:** any change merged into `main` on GitHub deploys automatically.
- **Timezone:** a new day starts at midnight US Eastern. To change it, add a **Text**
  variable named `TIMEZONE` under **Settings**, then **Variables and Secrets**, set to
  something like `America/Los_Angeles`. Deploys keep it.
- **Changing the PIN:** edit `RESET_PIN` in the same place.

### Troubleshooting

- **Page says "Couldn't load the count":** the text after it says why. Check the latest
  build under the Worker's **Deployments** tab (or **Builds**) and make sure it succeeded.
- **Reset keeps asking for the PIN:** it's case-sensitive. To change the PIN, redo Step 2.
- **Custom domain won't activate:** it can't if there's already a DNS record named `ak`.
  Delete that record under **andrewlaurin.com**, **DNS**, **Records**, and try again.

---

## How it works

| Path | What |
| --- | --- |
| `public/index.html` | The whole page (HTML/CSS/JS, no build step) |
| `src/worker.js` | `GET /api/state` returns the count, `POST` resets it to now. Serves `/` with the live count in the page title and link-preview tags |
| `src/state.js` | KV and day-counting helpers |
| `wrangler.jsonc` | Worker config: static assets from `public/`, the `AK_KV` storage binding |

## Local dev (optional)

```sh
echo 'RESET_PIN=1234' > .dev.vars   # optional
npx wrangler dev
```
