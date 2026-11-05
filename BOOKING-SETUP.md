# Saving every booking in Cloudflare D1 + your Gmail

This is the setup for the thing you asked for: **the booking form sends everything
it collected to your own Cloudflare database (D1), and a tidy copy of every
booking lands in `tapasul.digitalcard@gmail.com`.**

You only do this once. After that, every booking from any device is saved and
emailed automatically, and `admin.html` reads them all back from the database.

---

## What is already built for you

| File | What it does |
|---|---|
| `functions/api/bookings.js` | The Cloudflare Function at `/api/bookings`. Saves the booking in D1, emails it to you, and serves the dashboard. |
| `schema.sql` | The database table + two handy views. Run this once. |
| `wrangler.toml` | Shows the bindings the Function expects. Optional, for local testing. |
| `site.config.js` | Already set to `mode: "worker"`, `endpoint: "/api/bookings"`, `admin.remoteUrl: "/api/bookings"`. |
| `script.js` | Already sends every field (see the list at the bottom). |
| `admin.js` | Already reads D1 and writes status changes back. |

Nothing else in the site changed. It still works with no backend if you ever
want to switch back (`mode: "email"`).

---

## Step 1 — Make the database

### In the dashboard (easiest)

1. Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create**.
2. Name it **`tapasul-bookings`**, create it.
3. Open it → **Console** tab.
4. Open `schema.sql` from this folder, copy **all** of it, paste it in the
   Console, and click **Run**. You should see "Executed successfully".
   *(Run each statement separately if the Console complains about multiple
   statements — the file is split by `;`.)*

### Or with the command line

```bash
npm install -g wrangler
wrangler login
wrangler d1 create tapasul-bookings          # prints a database_id
wrangler d1 execute tapasul-bookings --remote --file=./schema.sql
```

Copy the `database_id` it prints into `wrangler.toml`.

---

## Step 2 — Connect the database to your Pages site

Cloudflare dashboard → **Workers & Pages → your TapAsul project →
Settings → Functions → Bindings** (older UIs: *Settings → Bindings*) →
**Add → D1 database**:

| Field | Value |
|---|---|
| Variable name | `DB` |
| D1 database | `tapasul-bookings` |

That's the one name the code looks for. Save and redeploy.

---

## Step 3 — Get the email into your Gmail

Pick **one** of these. Option A is free and needs no third-party account.

### Option A — Cloudflare Email Routing (recommended, free)

1. Your domain (`tapasul.com`) must be on Cloudflare. It already is, since the
   site is on Pages.
2. Dashboard → **Email → Email Routing → Enable**.
3. **Destination addresses → Add destination address** →
   `tapasul.digitalcard@gmail.com`. Cloudflare emails you a link — click it.
   *(This step is required: Cloudflare will only send to addresses you verified,
   which is exactly what makes it safe.)*
4. Go back to your Pages project → **Settings → Functions → Bindings →
   Add → Send email**:

| Field | Value |
|---|---|
| Variable name | `EMAIL` |
| Destination address | `tapasul.digitalcard@gmail.com` |

5. Add a plain variable so the "from" address is on your own domain:
   **Settings → Environment variables → Add**

| Name | Value |
|---|---|
| `MAIL_FROM` | `bookings@tapasul.com` |

   (Any address on your own domain works — it does not need a real mailbox.)

### Option B — Resend (if you'd rather not touch Email Routing)

1. Sign up at resend.com (free: 100 emails/day) → **API Keys → Create**.
2. In your Pages project: **Settings → Environment variables → Add secret**
   - `RESEND_API_KEY` = your key
   - `MAIL_FROM` = `TapAsul <bookings@tapasul.com>` — or, until your domain is
     verified in Resend, `TapAsul <onboarding@resend.dev>` (Resend then only
     delivers to the Gmail address on your account, which is fine for this).

The code tries the Cloudflare binding first and falls back to Resend, so you can
set up A now and add B later without changing anything.

---

## Step 4 — Lock the dashboard

The dashboard reads your whole database, so give it a real PIN:

```bash
wrangler pages secret put ADMIN_PIN     # type the PIN it asks for
```

or dashboard → **Settings → Environment variables → Add → Secret**,
name `ADMIN_PIN`.

Then set the same value in `site.config.js`:

```js
pin: "4729",       // whatever you chose — this is what unlocks admin.html
```

Minimum 6 characters, and **not** `1234`. The PIN in the config is a soft lock
(it's in the file); the PIN in Cloudflare is the real gate on the database.

---

## Step 5 — Publish

```bash
node tools/build-seo.js
node tools/audit.js
```

Then upload the folder to your Pages project (or push to GitHub if Pages is
connected to the repo). The `functions/` folder must sit next to `index.html`.

If you use the Cloudflare Pages build step from `CLOUDFLARE.md`, add the
Functions directory setting: **Settings → Build → Build output directory: `.`
and Framework preset: `None`** — Pages picks up `functions/` automatically.

---

## Step 6 — Test it like a customer

1. Open your site, fill the booking form, send it.
2. **Email** — within a few seconds a message titled
   `NEW BOOKING · 2026-11-15 10:00 · 1 × Digital Card · ₱1,149 — Your Name`
   arrives in Gmail. Press **Reply** and you're writing to the customer.
3. **Database** — dashboard → D1 → `tapasul-bookings` → **Console**:

```sql
SELECT id, created_at, name, phone, appt_date, appt_slot, total, status
FROM bookings ORDER BY created_at DESC LIMIT 10;
```

4. **Dashboard** — open `admin.html`, enter the PIN. The booking is there even
   if you never visited the site on that device. Change its status; refresh —
   it stuck, and it stuck in D1 too.

If the email never arrives but the row is in D1, the binding is wrong. The
error is saved in the row itself:

```sql
SELECT id, emailed, email_via, email_error FROM bookings ORDER BY created_at DESC LIMIT 5;
```

---

## What gets saved (every field)

**Who:** name, email, phone, delivery address, their notes
**When/where:** appointment date, time slot, meeting place
**What:** card type (standard/premium/digital), product + product id, quantity,
price each, monthly hosting, branding, finish, the 2 chosen features, every
add-on with its price, add-on total, their free page name + URL
**Money:** subtotal, discount, promo code, delivery fee + zone, cash-on-delivery
fee, payment method, total, deposit due today, balance on the day, currency
**How they got here:** page URL, referrer, UTM / fbclid campaign tags, language,
time zone, screen size, consent choice, user agent
**Plus:** a unique booking id (`TS-20261104-7F3A9C`), a client id that stops a
double-tap creating two rows, the IP (rate limit + abuse), timestamps, and the
untouched original request in `payload` so nothing is ever lost.

---

## Handy queries

```sql
-- today's appointments
SELECT appt_slot, name, phone, quantity, total FROM bookings
WHERE appt_date = date('now') ORDER BY appt_slot;

-- what you have booked, and what is still owed
SELECT * FROM bookings_totals;

-- everything, ready to copy (then use the D1 "Export" button for a file)
SELECT * FROM bookings_export;

-- who has not been contacted yet
SELECT id, name, phone, created_at FROM bookings WHERE status = 'new';

-- your best promos
SELECT promo_code, COUNT(*) AS uses, SUM(discount) AS off FROM bookings
WHERE promo_code <> '' GROUP BY promo_code ORDER BY uses DESC;

-- free page names, ready to create in the portal
SELECT profile_name, profile_url, name, email FROM bookings
WHERE profile_url <> '' ORDER BY created_at DESC;
```

Export a spreadsheet any time: D1 database → **Export** → download the SQLite
file, or run `wrangler d1 export tapasul-bookings --output=bookings.sql`.

---

## If something goes wrong

| What you see | What it means |
|---|---|
| Customer sees "Sorry, we could not send your booking" | The Function returned an error. Check Pages → **Functions → Real-time logs**. Most common: the `DB` binding name is wrong. |
| Row saved, no email | Missing `EMAIL` / `RESEND_API_KEY` binding, or the Gmail destination was never verified. Read `email_error` in the row. |
| Dashboard shows "0 bookings · this device only" | `remoteUrl` is empty in `site.config.js`, or the PIN you entered doesn't match `ADMIN_PIN` (a wrong PIN gets a 401 and the dashboard quietly shows nothing). |
| Status changes don't stick across devices | `admin.remoteAuth` must be `true` and the PIN in the dashboard must match `ADMIN_PIN`. |
| 404 on `/api/bookings` | The `functions/` folder was not uploaded, or the site was published to GitHub Pages — GitHub Pages cannot run Functions. The database needs Cloudflare Pages. |
| "The DB binding is missing" | Step 2 was skipped, or you forgot to redeploy after adding the binding. |

## Cost

D1 free tier: 5 GB storage, 5 million row reads/day, 100k row writes/day — a
booking is about 2 KB, so this is effectively free until you are very large.
Pages Functions free tier: 100,000 requests/day. Cloudflare Email Routing:
free. So the whole thing costs nothing at your volume.

## One privacy note

Because bookings now live in your database, keep the wording on
`privacy-policy.html` honest: say you store booking details in your own database
(Cloudflare, servers outside the Philippines) to run appointments, that you never
sell them, and that customers can email `tapasul.digitalcard@gmail.com` to have
their data deleted.
