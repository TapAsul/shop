# TapAsul — Pricing & Startup Guide

**For:** the business owner (new entrepreneur).
**Why it exists:** the auditor's review said *"the selling price is not computed"* and asked us to
guide the owner through computing the price and through the decisions only the owner can make.
This guide is that walkthrough. It is written so you can work through it with a pen and a
calculator, then paste the results into `site.config.js`.

You do not need to be technical. Everything you need to change on the website lives in
**one file**: `site.config.js`.

---

## 1. What you are actually selling

**Two tiers, one product.** The Standard TapAsul card uses our artwork; the Premium card
uses your own logo, colours and profile and is the top of the range. They are the same
physical product, so the Premium price is mostly margin — but the artwork time is real, so
count it in step 3.

| | Standard Digital Card | Premium Digital Card |
|---|---|---|
| What the customer gets | A physical NFC card + a hosted profile page | The same card, printed with their own logo and colours, premium finish, priority slot |
| What you pay for | card body, NFC tag, printing, packaging, courier | the same + artwork/setup time |
| You earn once | ₱999 | ₱2,499 (or more — you set the price) |
| You earn every month | hosting ₱149/card/month | hosting ₱299/card/month |

> There is also a **Customised Digital Card** booking option at the standard price
> (₱999 / ₱149 a month) for customers who want their logo without the premium tier.

> The acrylic standee is switched off for now. The product block is still in
> `site.config.js` (commented out) if you want to bring it back.

**The single most important thing to understand:** the *one-off* sale is what pays for the
materials. The *monthly hosting* is what makes it a business instead of a one-off job.
A customer who keeps their standard card for 12 months is worth **₱1,788** in hosting alone
— that is your safety net, and it is why the card price can sit close to cost. A Premium
customer is worth **₱3,588** over the same 12 months.

---

## 2. Step 1 — List every peso that leaves your pocket

Write down the cost of **one unit**, before you sell anything. Get real numbers by asking
suppliers for a price list — do not use the prices in this guide as if they were quotes.
They are placeholders to show you the shape of the numbers.

### Raw materials (per unit)

| Line item | What it is | Typical PH range* |
|---|---|---|
| Card body | PVC / plastic card stock, 54 × 86 mm, matte or glossy | ₱20 – ₱60 |
| NFC tag | NTAG213 / NTAG215 sticker or embedded inlay | ₱15 – ₱60 |
| Printing | 2-sided print or card printing on the body | ₱15 – ₱45 |
| Packaging | Sleeve, box, bubble wrap, sticker | ₱5 – ₱25 |

\* Indicative only. Get 3 supplier quotes for every line.

### Labour (per unit)

Do not forget your own time. If it takes 12 minutes to print, pack and check one card, and you
value your time at ₱150/hour, that is **₱30 per card** of real cost. If you do not count it,
you will think you are making money when you are not.

```
labour per unit = (your hourly rate × minutes per unit) ÷ 60
```

### One-off costs for a batch

Suppliers often have a minimum order (MOQ) of 100 or 500 pieces. If you order 500 to get the
price down, you have a batch cost — including design setup, test prints, and any dead stock.
Spread it across the units:

```
setup per unit = one-off setup cost ÷ number of units in the batch
```

### Transport

```
courier cost per unit = courier price per parcel ÷ units that fit in one parcel
```

Shipping charged to the customer is normally a **pass-through**: you charge ₱150, the courier
costs you ₱120–₱180, and the difference is either margin or a small loss you accept on purpose.
Decide deliberately, and never quote a shipping fee you have not checked.

### Monthly overheads (operating expenses)

These are the bills you pay even in a month when you sell nothing:

- domain + website hosting
- design tools / software subscriptions
- marketing (ads, samples, giveaways)
- admin and bookkeeping time

Spread them over the units you expect to sell each month:

```
overhead per unit = monthly overheads ÷ units you expect to sell per month
```

---

## 3. Step 2 — The formula (the only formula you need)

```
1. cost per unit      = materials + labour + (setup ÷ batch qty) + (courier ÷ units per parcel)
2. landed cost        = cost per unit + (monthly overheads ÷ monthly units)
3. break-even price   = landed cost
4. target price       = break-even ÷ (1 − discount %) ÷ (1 − margin %)
5. shelf price        = round the target price UP to a number people want to pay
```

**Why step 4 divides instead of adding:** a 40% margin on ₱400 means you keep ₱160 and the
customer pays ₱400 — that is ₱240, which is 60% of ₱400. If you *add* 40% instead, you would
only get 28.6%. Dividing by (1 − margin) is the correct way to hit the margin you asked for.

### Worked example (Standard Digital Card)

| Input | Value |
|---|---|
| Batch quantity | 50 |
| Expected sales per month | 20 |
| Materials per unit | ₱175 |
| Your rate / minutes per unit | ₱150 ÷ 12 min = ₱30 |
| One-off setup | ₱1,500 ÷ 50 = ₱30 |
| Courier | ₱160 ÷ 10 per parcel = ₱16 |
| Monthly overheads | ₱2,200 ÷ 20 = ₱110 |
| Discount you usually give | 10% |
| Target margin | 40% |

```
cost per unit  = 175 + 30 + 30 + 16          = ₱251
landed cost   = 251 + 110                    = ₱361
break-even    = ₱361
after 10% off = 361 ÷ 0.9                    = ₱401.11
for 40% margin= 401.11 ÷ 0.6                 = ₱668.52
shelf price   = ₱699
```

At ₱699 with a 10% discount you keep **₱268.10** per unit (42.6% margin), and the batch of
50 returns **₱13,405**. You also need **₱12,550 cash** up front to make it — plan for that.

> **The calculator in `admin.html` → Pricing tab does all of this for you.** Enter your real
> numbers and it shows the recommended price, your profit per unit, how much cash the batch
> needs and how many units you must sell each month to cover your overheads.

---

## 4. Step 3 — Check the price against reality

Before you publish a number, look at it from three angles:

1. **Cost floor.** Is the price above your break-even? If a discount pushes it below, you are
   paying to work. Read the calculator's warnings.
2. **What the market pays.** Compare with physical NFC cards and personalised gifts sold in
   the Philippines. If you are 3× the nearest alternative, you need a reason people can see
   (design quality, hosting included, faster delivery).
3. **Cash flow.** Can you afford to make the batch *before* the money comes in? If a supplier
   wants 500 pieces, that is a big cash outlay for a new business. Start with the smallest
   batch that still gets you a good unit price, and grow.

**A useful rule for a launch:** set the first price a little above cost to build a customer
base, then raise it once people are asking. Put the real numbers in the calculator first so
you know exactly where your break-even is.

---

## 5. Step 4 — Decide how to charge

| Decision | Your choice | Where it lives |
|---|---|---|
| Card price | ₱999 one-off + ₱149/month hosting | `pricing.products.card` |
| Payment methods | GCash, Maya, Bank transfer, Cash on delivery | `pricing.payment.methods` |
| Cash-on-delivery fee | ₱50 | `pricing.payment.codFee` |
| Shipping | Flat fee by zone: Metro Manila / Provincial | `pricing.shipping.zones` |
| Add-ons | Profile setup (free), redesigned profile ₱149, extra design ₱99, card replacement ₱599, sticker pack ₱49 | `pricing.addOns` |
| Bulk discounts | Disabled for now — turn on when you have stock and volume | `pricing.bulk` |

**Shipping numbers are placeholders.** Ask your courier for the real Metro Manila and
provincial rates, then update `pricing.shipping.zones`. The site shows the shipping fee and
the payment method on the order form, and adds them to the total **before** the customer
confirms — never surprise them at checkout.

---

## 6. Step 5 — Decisions only you can make

This is the checklist the auditor asked for. The ones marked ✅ are already decided and built
into the site.

| # | Decision | Status |
|---|---|---|
| 1 | Acrylic standee — sell it or drop it? | ✅ **Dropped.** The product is commented out in `site.config.js` so you can switch it back on any time |
| 2 | Which payment methods do you accept? | ✅ GCash, Maya, Bank transfer, COD |
| 3 | Shipping zones and rates | ⚠️ Structure built; **you** fill in the real numbers |
| 4 | How is the co-founder presented? | ✅ Co-founder kept low-profile — name only, no photo, no bio |
| 5 | Do clients get their own dashboard? | ✅ No — FAQ answers the hosting questions instead |
| 6 | Legal contact address | ✅ `tapasul.digitalcard@gmail.com` for now; swappable in `legal.email` |
| 7 | Your real domain name | ⚠️ **You** — put it in `brand.url`, then run `node tools/build-seo.js` |
| 8 | A non-default admin PIN | ⚠️ **You** — `order.admin.pin` is `1234`; change it before publishing |
| 9 | Refund window and warranty | ✅ Written into the Refund Policy page — edit the wording in `legalPages.refund` |
| 10 | Who is your Data Protection Officer? | ✅ `dataprivacy@tapasul.com` placeholder; **you** confirm the name and address |
| 11 | VAT registration / BIR | ⚠️ **You** — talk to an accountant once you are selling regularly |
| 12 | Do you give a discount to win volume? | ✅ 10% assumed in the example; adjust in the calculator |
| 13 | Do you offer a "keep the card forever" plan? | Your call — the calculator shows what 12 months of hosting is worth |
| 14 | Warranty on the hardware | ✅ One free replacement for a faulty card; edit in `legalPages.refund` |

### Legal pages you must read before you take money

`terms.html`, `refund-policy.html` and `privacy-policy.html` are **already written and linked**
in the footer, and the privacy notice pops up on the customer's first visit (accept or
decline). They cover the things that get small businesses into trouble:

- you are an **appointment-booking** business — say so, and confirm bookings by email
- custom-printed goods become **non-refundable once printing starts**, but faulty goods are replaced
- delivery is a courier's job, with a 48-hour damage-reporting window
- customer data is kept for **24 months**, with a named DPO and the Data Privacy Act rights listed
- analytics only run **if the customer accepts them**

> These are a solid starting point, **not legal advice.** Before you publish, have a Philippine
> lawyer read them. All the wording lives in `site.config.js` → `legalPages`, so you can edit
> it without touching code.

---

## 7. Where to put your numbers

Everything the website shows comes from `site.config.js`. Open it in any text editor, change
the numbers, save, and refresh the page. The file is commented so you can find each setting:

| What you want to change | Key in `site.config.js` |
|---|---|
| Card price, monthly hosting | `pricing.products.*` |
| Shipping zones and rates | `pricing.shipping.zones` |
| Payment methods, COD fee | `pricing.payment` |
| Add-on prices | `pricing.addOns` |
| Your domain | `brand.url` |
| Your email, phone, socials | `brand.email`, `brand.phone`, `brand.socials` |
| Admin PIN | `order.admin.pin` |
| Legal / DPO details | `legal` |
| The wording of Terms, Refund and Privacy | `legalPages` |
| Every visible sentence on the site | `content` |

After changing the domain, run `node tools/build-seo.js` so the sitemap, robots file and
structured data use the real address.

---

## 8. A 30-day plan

**Week 1 — costs.** Get quotes for the card body, NFC tags, printing and packaging.
Fill the calculator in `admin.html` and find your real break-even price.

**Week 2 — supply.** Order your first small batch. Print your own cards. Photograph
the real product — the site's product images should be your product, not a mock-up.

**Week 3 — the site.** Set the domain, the admin PIN, the shipping rates and the price the
calculator gave you. Run `node tools/build-seo.js`. Have a lawyer read the three legal pages.

**Week 4 — launch.** Publish on Cloudflare. Make your first ten cards by hand, and give five
of them away to people who will actually use them. Watch which questions they ask — that is what
your FAQ and your sales page should be built around.

**After launch.** Every month: check the dashboard, count how many cards are active, and ask
your ten newest customers where they heard about you. That answer is worth more than any ad.
