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

## Adding your own work photos

1. Drop your client photos into `assets/work/` inside the folder.
2. Open `site.config.js` and add one line per photo under `myWork -> items`:

```js
    { image: "assets/work/kusina.jpg", title: "Kusina ni Maria",
      note: "Restaurant · Quezon City", href: "https://portal.tapasul.com/r/yourname" },
```

Save the file, upload it again, and the tiles appear in **My work**.

## After you upload — the quick check

Open the live site and confirm these seven things:

1. Your frog logo shows in the top-left **and** in the popup before you continue.
2. The **Products** section shows **two** cards: Standard ₱999 and Premium ₱2,499.
3. A **Live profiles** strip scrolls sideways to the right with
   `portal.tapasul.com/r/…` links, with a blue **“Claim my free page”** button
   and the line *“Free with your digital card purchase”* under it.
4. The section **“What's inside your digital card?”** sits under it, with two
   columns and a **“Check the features ↓”** link on each.
5. Clicking **“Check the features ↓”** opens a **new page** —
   `https://tapasul.github.io/TapAsul/v2/features.html` — with the two tier
   cards, the light-blue **Featured features** band of 8 tiles and the
   “your page is free” button. (The band is **not** on the home page any more.)
6. The card in the hero **turns over** when you drag it (the back shows the QR
   code), and there is a **My work** section under “What's inside your card?”.
7. Clicking **“Check the features ↓”** opens `…/v2/features.html` and that page
   shows **only** the Featured features band — nothing else.
8. The booking form shows **Your 2 features** (8 chips, pick 2).
9. The **4-step funnel** works: click **Select Digital Card** → the “your page
   is free” box appears with the cursor in the name field → type a name → the
   address turns into `portal.tapasul.com/r/yourname` → click **Claim my free
   page** → “What's inside your digital card?” → click **Book the standard
   card** → the booking section opens with that name in **Full name** and a
   **“Your page”** line in the summary.

If any of those is missing, press Ctrl+Shift+R once more — GitHub Pages caches
files for a minute or two.

> 💡 If the profile strip is standing still instead of moving, your device has
> **Reduce Motion** turned on (System Settings → Accessibility). The line stays
> one straight line either way — you can swipe it by hand.
