# 🚀 Publishing TapAsul to Cloudflare Pages

This folder is a **ready-to-publish static site**. No build system, no database,
no server to maintain. Cloudflare Pages hosts it for free with HTTPS included.

---

## Before you start — 3 edits

Open **`site.config.js`** in any text editor (Notepad works). Search for these
three lines and change them:

```js
url: "https://tapasul.example",       // ← your real domain
pin: "1234",                          // ← your admin PIN (search "pin:")
mode: "email",                        // ← how orders reach you (search "mode:")
```

Save. That's it — everything else already works.

> **Don't have your domain yet?** Skip it. The site detects the address it is
> being served from and uses that for its links, so you can deploy right now
> and add the domain later.

---

## Method A — GitHub (recommended) ✅

You get automatic rebuilds every time you change something.

### Step 1 — Put the folder in GitHub

1. Go to **github.com** → **New repository** → name it `tapasul-site` → **Create**.
2. On the repo page click **uploading an existing file**.
3. Open your unzipped `tapasul-site` folder in Finder/Explorer.
4. **Select everything inside it** (including the `tools` folder and the
   `_headers` file) and drag it into the GitHub upload box.
   - ⚠️ Make sure `index.html` is at the **top level** of the upload, not
     inside a nested `tapasul-site` folder.
5. Scroll down → **Commit changes**.

### Step 2 — Create the Cloudflare project

1. Log in at **dash.cloudflare.com** → **Workers & Pages** → **Create application**
   → **Pages** → **Connect to Git**.
2. Pick your `tapasul-site` repository → **Next**.
3. Fill in the build settings:

   | Field | Value |
   |-------|-------|
   | **Framework preset** | `None` |
   | **Build command** | `node tools/build-seo.js` |
   | **Build output directory** | `.` |

   > The build command is what copies your domain into `robots.txt`,
   > `sitemap.xml`, the social share tags and the Google structured data.
   > It also prints a checklist of anything still missing.

4. **Save and Deploy**. Wait ~30 seconds.
5. 🎉 Your site is live at `https://tapasul-site.pages.dev` (or similar).

### Step 3 — Add your own domain

1. In Cloudflare: **Workers & Pages → your project → Custom domains → Set up a
   custom domain**.
2. Type your domain (e.g. `tapasul.com`) → **Continue**.
3. Cloudflare adds the DNS record for you if the domain is already on
   Cloudflare. If it isn't, it gives you two nameservers to set with your
   registrar.
4. Wait for the certificate (a few minutes for a `.com`, up to 24h for
   `pages.dev` to fully activate).
5. Now set `brand.url` in `site.config.js` to `https://yourdomain.com` and
   push. Cloudflare rebuilds and the sitemap + canonical link follow.

---

## Method B — Direct Upload (fastest, no GitHub)

1. Run the build once on your own computer so the sitemap and social tags are
   correct:
   - Install **Node.js** (nodejs.org → LTS → next-next-next) — one time only.
   - Open a terminal in the `tapasul-site` folder and run:
     ```
     node tools/build-seo.js
     ```
   - You'll see a checklist. If it still says the domain is the placeholder,
     edit `brand.url` in `site.config.js` first and run it again.
2. In Cloudflare: **Workers & Pages → Create application → Pages → Direct Upload**.
3. **Drag the `tapasul-site` folder** (or the `.zip`) into the box.
4. Deploy. Done.

> With Direct Upload there is no build step, so re-run
> `node tools/build-seo.js` before each upload if you change the config.

---

## What's already configured for you

| Thing | Detail |
|-------|--------|
| `_headers` | Cloudflare reads this automatically. Sets HTTPS-only, clickjacking protection, a Content-Security-Policy, and smart caching (assets cached 1 year, HTML always fresh). |
| `404.html` | Branded "page not found" page, shown automatically for bad URLs. |
| `robots.txt` | Generated. Tells Google to index the site but **not** `/admin.html`. |
| `sitemap.xml` | Generated from `brand.url`. Submit it in Google Search Console. |
| `manifest.webmanifest` | Makes the site installable on a phone home screen. |
| `admin.html` | The pre-order dashboard. Sends `X-Robots-Tag: noindex` so it never appears in Google. |
| `.assetsignore` | Keeps the `tools/` folder out of the published site. |

---

## After it's live — a 10-minute checklist

- [ ] Open your site on a phone. Check the layout and the menu.
- [ ] Submit a **test pre-order** from the form.
- [ ] Go to `https://yourdomain.com/admin.html`, unlock with your PIN, and
      confirm the test order is in the dashboard.
- [ ] Change the test order's status to `confirmed` — it should stick.
- [ ] Add your domain to **Google Search Console** → **Sitemaps** →
      `sitemap.xml`.
- [ ] Add your domain to **Google Business Profile** and point it at the site.
- [ ] Share the link — the Open Graph image (the card preview) is already set.

---

## Common problems

| Problem | Fix |
|---------|-----|
| Site shows a blank page | The build output directory is wrong. It must be `.` (the folder that contains `index.html`). |
| "No build output directory" error | Same — set the output directory to `.` and the build command to `node tools/build-seo.js`. |
| Build fails | The build command must be run from the folder containing `site.config.js`. Check you uploaded the `tools` folder too. |
| Dashboard says "0 orders" | Orders are stored **per device** in the browser. To see them everywhere, connect a Google Sheet — see the Admin section of `README.md`. |
| Forgot the PIN | It is in `site.config.js` (search `pin:`). It is a soft lock — anyone can read it, so change it to something private. |
| Social preview shows the wrong image | `assets/social-preview.png` is the share image. Regenerate it with `tools/make-og-image.html`. |
| Fonts look different | The fonts are self-hosted in `assets/fonts/`. Don't delete that folder. |
