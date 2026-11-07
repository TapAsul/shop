# Uploading TapAsul to GitHub Pages

Your live site: **https://tapasul.github.io/TapAsul/v2/**

## The one method that always works

1. Unzip `tapasul-v2-upload.zip` anywhere on your computer.
2. Open the folder it made (the one with `index.html` in it).
3. On GitHub, open your repo and go into the **`v2`** folder.
4. Drag **everything** from your computer folder into the `v2` folder on the
   GitHub page (select all with Ctrl+A / Cmd+A first).
5. Wait for the upload, then type a commit message like *"update TapAsul site"*
   and press **Commit changes**.
6. Wait ~1 minute, then open <https://tapasul.github.io/TapAsul/v2/> and press
   **Ctrl+Shift+R** (or Cmd+Shift+R) to force-refresh the cache.

> ⚠️ Upload **everything** — including the new **`features.html`** file and
> `logo.js`. If even one file is missing the page will say so at the top in an
> amber bar instead of showing empty boxes.

> 🗑️ The old **3D studio** is gone. If your GitHub folder still has a
> `three.min.js` file, delete it there — it is no longer used, and removing it
> makes the site load faster.

## What should NOT be in the folder

The zip is exactly 35 items at the top level. If you see any of these, they are
left over from an older version and can be **deleted** — nothing on the site
uses them:

| Delete | Why |
|---|---|
| `three.min.js` | The old 3D studio is gone. 590 KB of dead weight. |
| `interactive.html`, `projects.html`, `tap-portfolio.html` | Old prototypes, replaced by the current `index.html`. |
| `v2/` (a folder inside the site) | The previous GitHub Pages copy. Publishing two copies of the site confuses Google — keep one. |
| `.vscode/` | Your editor's settings. Harmless, but not part of the site (`.gitignore` now skips it). |

Everything else in the list belongs: `assets/`, `functions/`, `tools/`,
`_headers`, `.assetsignore`, the HTML pages, `script.js`, `site.config.js`,
`schema.sql`, `wrangler.toml` and the docs.

**Check `functions/` before you push** — open it. It must contain
`api/bookings.js`. That one file is what saves bookings to D1 and emails them.
If it is missing, the booking form still works but only by opening the
customer's mail app.

## Adding your own work photos

1. Drop your client photos into `assets/work/` inside the folder.
2. Open `site.config.js` and add one line per photo under `myWork -> items`:

```js
    { image: "assets/work/kusina.jpg", title: "Kusina ni Maria",
      note: "Restaurant · Quezon City", href: "https://portal.tapasul.com/r/yourname" },
```

Save the file, upload it again, and the tiles appear in **My work**.

## After you upload — the quick check

Open the live site and confirm these twelve things:

1. Your frog logo shows in the top-left **and** in the popup before you continue.
2. The header is **Home · Product & Pricing · About Us · Booking** plus an
   **Order Now** button — and it is the same on every page.
3. **FAQ**, **Contact & Support**, **Privacy Policy** and **Terms of Use** are
   **only in the footer** — they are not in the header and not on the home page.
4. **Home** shows the hero, the **My work** cards, the **Live profiles** demo
   (with the blue **“Claim my free page”** button) and the two price cards —
   in that order.
5. **Product & Pricing** shows the two cards — Standard ₱999 and Premium
   ₱2,499 — and under them the **“Standard or Premium”** table with ticks,
   dashes, text rows and a **Choose Standard** / **Choose Premium** button.
6. On a phone the table's row labels stay put while the two columns swipe
   sideways (there is a **“Swipe to compare →”** hint).
7. **“Inside the card”** in the footer opens `features.html` with the
   light-blue **Featured features** band of 8 tiles.
8. **Booking** has the whole order form: name, email, phone, page name, date,
   time, the 3 delivery zones, the 4 payment options, promo code and the
   running summary. The Standard card shows **Your feature** (8 chips — pick
   **one**); a second pick is refused with a short message.
9. The **demo funnel** works: on Home click **Select Digital Card** → you land
   on **Booking** with that card chosen → type a page name → the summary shows
   `portal.tapasul.com/r/yourname`.
10. On Home, **Claim my free page** → you land on the **comparison table** on
    Product & Pricing, and **Choose Premium** there → **Booking** opens with
    the Premium card picked.
11. The card in the hero **turns over** when you drag it (the back shows the QR
    code). The **My work** tiles sit under the hero — tap one and the picture
    opens big; tap the picture again to zoom in.
12. **About Us** lists the team, and the FAQ page opens all 14 questions.

If any of those is missing, press Ctrl+Shift+R once more — GitHub Pages caches
files for a minute or two.

> 💡 If the profile strip is standing still instead of moving, your device has
> **Reduce Motion** turned on (System Settings → Accessibility). The line stays
> one straight line either way — you can swipe it by hand.
