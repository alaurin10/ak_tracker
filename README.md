# ak_tracker

Days since Maddi last mentioned Alaska. Live at **ak.andrewlaurin.com**.

- A big counter that goes up by one each calendar day
- **She mentioned it** resets the count to 0
- **Share image** saves or shares a square picture of the count
- **Copy text** copies a one-liner with the link
- Pasting the link into iMessage, Slack and similar apps shows the current count in the preview
- Light and dark mode follow your phone or computer setting
- Everyone sees the same count, which is stored on Cloudflare

---

## Setup (all in the browser, no commands)

About 10 minutes. You'll need to be signed in to GitHub and to Cloudflare
(dash.cloudflare.com), where andrewlaurin.com lives.

### Step 1: Merge the code into `main` on GitHub

1. Open the pull request on GitHub (the repo's **Pull requests** tab, then the Alaska counter PR).
2. Click **Ready for review**, then **Merge pull request** and **Confirm merge**.

### Step 2: Create the storage for the count

1. In the Cloudflare dashboard's left sidebar, open **Storage & databases** and then **KV**.
   In some dashboard versions it's under **Workers & Pages** and then **KV**.
2. Click **Create** (or **Create namespace**).
3. Name it `ak-tracker` and click **Add** (or **Create**).

### Step 3: Create the website from GitHub

1. In the left sidebar, open **Workers & Pages**.
2. Click **Create** (or **Create application**) and choose the **Pages** tab.
   If you only see Workers options, look for a link that says
   *"Looking to deploy Pages? Get started"*.
3. Choose **Import an existing Git repository** (or **Connect to Git**) and click **Get started**.
4. Click **Connect GitHub**. When GitHub asks, allow Cloudflare to access the
   **ak_tracker** repository.
5. Select **alaurin10/ak_tracker** and click **Begin setup**.
6. Fill in the build settings:
   | Field | Value |
   | --- | --- |
   | Project name | `ak-tracker` |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | *(leave empty)* |
   | Build output directory | `public` |
7. Click **Save and Deploy** and wait for it to finish, which takes about a minute.
   This first version will show an error until you finish Step 4.

### Step 4: Connect the storage to the site

1. On the **ak-tracker** project page, open the **Settings** tab and find **Bindings**.
2. Click **Add** and choose **KV namespace**.
3. Set **Variable name** to `AK_KV`. The spelling and capitals must match exactly.
4. For **KV namespace**, choose `ak-tracker`, the one from Step 2, and click **Save**.

### Step 5 (recommended): Set a PIN so only you can reset it

Without a PIN, anyone with the link can reset the counter.

1. Still in **Settings**, find **Variables and Secrets** and click **Add**.
2. Set **Type** to **Secret**, **Variable name** to `RESET_PIN`, and **Value** to any
   PIN you like, for example `4821`.
3. Click **Save**.

Each phone or computer asks for the PIN on its first reset and remembers it after that.

### Step 6: Redeploy so the settings take effect

1. Open the **Deployments** tab.
2. On the most recent deployment, click the **⋯** menu and choose **Retry deployment**.
3. When it finishes, open `https://ak-tracker.pages.dev` (the exact address is shown on
   the project page). You should see a big **0**.

### Step 7: Put it on ak.andrewlaurin.com

1. On the project, open the **Custom domains** tab.
2. Click **Set up a custom domain**, enter `ak.andrewlaurin.com`, and click **Continue**.
3. Click **Activate domain**. Because andrewlaurin.com is already on Cloudflare, it
   creates the DNS record and the security certificate for you.
4. Wait a few minutes for it to show **Active**, then visit https://ak.andrewlaurin.com. 🎉

### Later

- **Updating the site:** any change merged into `main` on GitHub deploys automatically.
- **Timezone:** a new day starts at midnight US Eastern. To change it, go to **Settings**,
  then **Variables and Secrets**, and add a **Text** variable named `TIMEZONE` set to, for
  example, `America/Chicago`, `America/Denver` or `America/Los_Angeles`. Then redeploy
  as in Step 6.
- **Changing the PIN:** edit `RESET_PIN` in the same place, then redeploy.

### Troubleshooting

- **Page says "Couldn't load the count":** the KV binding is missing, or its variable name isn't
  exactly `AK_KV`. Check Step 4, then redeploy.
- **Reset keeps asking for the PIN:** it's case-sensitive. To change the PIN, redo Step 5 and then Step 6.
- **Custom domain stuck on "Verifying":** give it up to 15 minutes. It won't activate if
  there's already a DNS record named `ak`. In that case, delete that record under
  **andrewlaurin.com**, **DNS**, **Records**, and try again.

---

## How it works

| Path | What |
| --- | --- |
| `public/index.html` | The whole page (HTML/CSS/JS, no build step) |
| `functions/api/state.js` | `GET` returns the count, `POST` resets it to now |
| `functions/index.js` | Adds the current count to the page title and link-preview tags |
| `lib/state.js` | Shared KV and day-counting helpers |

## Local dev (optional)

```sh
echo 'RESET_PIN=1234' > .dev.vars   # optional
npx wrangler pages dev public --kv AK_KV
```
