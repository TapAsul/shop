# 🚀 Publishing TapAsul to Cloudflare Pages

This folder is a **ready-to-publish static site**. No build system, no database,
no server to maintain. Cloudflare Pages hosts it for free with HTTPS included.

---

## Before you start — 4 edits

Open **`site.config.js`** in any text editor (Notepad works). Search for these
lines and change them:

```js
url: "https://tapasul.example",       // ← your real domain
pin: "1234",                          // ← your admin PIN (search "pin:")
mode: "email",                        // ← how orders reach you (search "mode:")
fee: 150,                            // ← your Metro Manila shipping fee
```

The shipping fee appears twice — one for Metro Manila, one for provincial
deliveries. Ask your courier for the real numbers, or set them to 0 and
charge shipping separately for now.

Save. That's it — everything else already works.

> **Want to know what to charge?** Read **`PRICING-GUIDE.md`** in this folder.
> It walks you through materials, labour, transport and overheads, and the
> `admin.html` → Pricing tab has the same maths as a live calculator.

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
| `admin.html` | The booking dashboard. Sends `X-Robots-Tag: noindex` so it never appears in Google. |
| `terms.html`, `refund-policy.html`, `privacy-policy.html` | The legal pages. Already linked in the footer and listed in `sitemap.xml` — the wording is in `site.config.js` → `legalPages`. |
| `.assetsignore` | Keeps the `tools/` folder out of the published site. |

---

## Bookings → your own database + your Gmail

The site now ships with a Cloudflare Function at `functions/api/bookings.js`.
Every booking is saved in a **Cloudflare D1** database and emailed to
`tapasul.digitalcard@gmail.com`, and `admin.html` reads them all back from D1.

A second Function, `functions/api/availability.js`, uses the same `DB` binding
to tell the booking form which days and times are already full (counts only —
it never returns a customer's details), so filled slots are greyed out for the
next visitor. Nothing extra to configure: deploy the folder and it works.

You have to connect it once, in the dashboard:

1. Create the database and run `schema.sql` — **Step 1** in `BOOKING-SETUP.md`.
2. Pages project → **Settings → Functions → Bindings**:
   - **D1 database** binding named `DB` → `tapasul-bookings`
   - **Send email** binding named `EMAIL` → `tapasul.digitalcard@gmail.com`
   - Secret `ADMIN_PIN` (the same PIN you put in `site.config.js`)
3. Redeploy.

**Important:** `functions/` only runs on Cloudflare Pages. If you also publish
the same folder to GitHub Pages, that copy can show the site but cannot save
bookings — GitHub Pages has no server. Use the Cloudflare copy as the real one.

Full walkthrough, queries and troubleshooting: **`BOOKING-SETUP.md`**.

---

## After it's live — a 10-minute checklist

- [ ] Open your site on a phone. Check the layout and the menu.
- [ ] Submit a **test booking** from the form.
- [ ] Check it arrived **in Gmail** and in **D1** (`BOOKING-SETUP.md`, Step 6).
- [ ] Go to `https://yourdomain.com/admin.html`, unlock with your PIN, and
      confirm the test order is in the dashboard.
- [ ] Change the test order's status to `confirmed` — it should stick.
- [ ] Add your domain to **Google Search Console** → **Sitemaps** →
      `sitemap.xml`.
- [ ] Open `/terms.html`, `/refund-policy.html` and `/privacy-policy.html` and
      read them. Have a lawyer check the wording before you take real money.
- [ ] Open `/admin.html` → Pricing and run your own numbers through the cost
      calculator, then set the price in `site.config.js`.
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
| `npx wrangler deploy` fails with **"Missing entry-point to Worker script or to assets directory"** | Your project is building as a **Worker**, but this is a **Pages** site. See "The deploy command is wrong" below. |
| `wrangler` warns **"you have run wrangler deploy on a Pages project"** | Same thing — the deploy command is the Workers one. Fix below. |

---

## The deploy command is wrong — "Missing entry-point to Worker script"

This is the one that catches everybody. It is **not** a problem with the site;
it is a setting on the Cloudflare project.

### What is happening

`npx wrangler deploy` deploys a **Worker** and looks for a JavaScript
entry-point (`main = "src/index.js"`). TapAsul is a **Pages** site: HTML,
CSS, images and a `functions/` folder. There is no entry-point, so the build
stops at the last step. The warning in the log gives it away:

```
▲ [WARNING] It seems that you have run `wrangler deploy` on a Pages project,
            `wrangler pages deploy` should be used instead.
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

### Fix it in the dashboard (2 minutes)

1. Cloudflare dashboard → **Workers & Pages** → open the project.
2. **Settings → Build** (newer UI: **Settings → Builds**).
3. Change **Deploy command**:
   - **`npx wrangler pages deploy .`** ← use this
   - delete `npx wrangler deploy` — never use it here.
   - If the next build says *"Could not determine project name"*, use
     `npx wrangler pages deploy . --project-name=YOUR-PROJECT-NAME` (the name is
     at the top of the project page).
   - If the field accepts an empty value, clearing it also works — Pages then
     does its own upload step.
4. Check the rest of the build settings:

   | Setting | Value |
   |---|---|
   | Build command | `node tools/build-seo.js` |
   | Deploy command | `npx wrangler pages deploy .` |
   | Build output directory | `.` |
   | Root directory | the folder that holds `index.html` (leave empty if the repo root is the site, e.g. `v2` if it sits in a `v2/` folder) |
   | Framework preset | `None` |

5. **Save**, then **Retry deployment** (or push an empty commit).

### If the project was created as a Worker

A Worker project cannot serve `functions/` or `_headers`, so it is the wrong
shape for this site. Create the Pages one instead — it takes a minute and the
old project can simply be deleted afterwards:

1. **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo and branch, set the four settings in the table above.
3. **Save and Deploy.**

### Does `wrangler.toml` cause this?

No — but a `wrangler.toml` with a **placeholder** `database_id` will break a
wrangler-driven deploy. The one shipped here has the D1 block commented out on
purpose, so a Git build can never trip over it. Set the D1 binding in
**Settings → Functions → Bindings** instead (`BOOKING-SETUP.md`, Step 2).

### Already on GitHub Pages too?

GitHub Pages can host the pages but cannot run `functions/`, so bookings there
fall back to opening the customer's mail app. Cloudflare Pages is the one that
saves to D1.
