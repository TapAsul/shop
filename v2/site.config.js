/* ============================================================================
   TapAsul — site.config.js
   ----------------------------------------------------------------------------
   ⚙️  THIS IS THE ONLY FILE YOU NEED TO EDIT.
   Every price, product, name, FAQ, colour, heading and contact detail on the
   page is pulled from this object. Change it here → it changes everywhere.

   QUICK START — three things to change before you publish:
     1. brand.url ............... your real domain  (line ~35)
     2. order.admin.pin .......... your dashboard PIN (search "pin:")
     3. order.mode ............... how bookings reach you (search "mode:")

   After you change your domain, run:
       node tools/build-seo.js
   …or set that as the build command on Cloudflare Pages and it runs for you.
   ============================================================================ */

window.TAPASUL_CONFIG = {

  /* -------------------------------------------------------------------------
     1. BRAND
     ------------------------------------------------------------------------- */
  brand: {
    name: "TapAsul",              // split at brand.splitAt -> "Tap" + "Asul"
    splitAt: 3,                   // 0 = single colour, 3 = "Tap|Asul"
    tagline: "More Than Just A Tap",
    description: "Connect instantly with smart NFC digital cards — the standard TapAsul, or the Premium card fully customised with your own logo, colours and profile.",

    // Brand palette. Any valid CSS colour. The 3D models use accent.
    colors: {
      brand:      "#0881ef",
      brandHover: "#0668bf",
      brandLight: "#e8f2fe",
      brandDark:  "#07559c",
      brandBlack: "#0a0f1d",
    },

    // ── Action required: put the real deployed URL here ──────────────────
    // This is the ONLY place your domain is set. The build copies it into
    // the canonical link, the Open Graph tags, the JSON-LD, robots.txt
    // and sitemap.xml.
    url: "https://tapasul.example",       // ← CHANGE ME

    // ── Contact details shown in the footer, the order form and the FAQ ──
    email: "tapasul.digitalcard@gmail.com",
    phone: "09623017609",
    address: "Quezon City, Metro Manila, Philippines",
    socials: {
      facebook:  "",                      // ← paste full URLs, or leave "" to hide
      instagram: "https://www.instagram.com/tapasul_digitalcard",
      tiktok:    "",
    },

    // Logo artwork. The frog is a real vector; the wordmark next to it is
    // live text in Outfit, so it stays selectable and scales cleanly.
    logo: {
      mark:      "assets/logo-frog.svg",        // brand-blue frog (light backgrounds)
      markWhite: "assets/logo-frog-white.svg",  // white frog (dark backgrounds)
      showWordmark: true,                       // false = mark only
      icon:      "assets/apple-touch-icon.png", // square icon for search engines
    },

    // Social share image (1200x630). Regenerate it with
    // tools/make-og-image.html, then save the file here.
    ogImage: "assets/social-preview.png",
  },

  /* -------------------------------------------------------------------------
     1b. APPOINTMENT BOOKING
     -------------------------------------------------------------------------
     Instead of taking a pre-order, the customer books an appointment to
     create their digital card. Change the times, the location and the
     prices below — everything on the page reads from here.
     ------------------------------------------------------------------------- */
  booking: {
    enabled: true,

    // The two things a customer can book. `branding` decides which artwork
    // the 3D preview shows: "standard" = our artwork, "custom" = theirs.
    // `product` says which product in pricing.products this option uses.
    // `branding` says which artwork the 3D preview shows: "standard" = our
    // artwork, "custom" = the customer's own logo.
    types: [
      {
        id: "standard",
        product: "card",
        branding: "standard",
        name: "Standard Digital Card",
        note: "TapAsul artwork, printed and NFC-programmed by us.",
        price: 999,          // one-off
        monthly: 149,        // hosting per month
        badge: "Ready same day",
      },
      {
        id: "custom",
        product: "card",
        branding: "custom",
        name: "Customised Digital Card",
        note: "Your own logo, colours and details on the same card.",
        price: 999,          // ← CHANGE ME: charge more for a customised card if you want to
        monthly: 149,
        badge: "Most popular",
      },
      {
        id: "premium",
        product: "premium",
        branding: "custom",
        name: "Premium Digital Card",
        note: "Your own logo and colours included, premium card finish, priority slot and unlimited artwork revisions.",
        price: 2499,         // ← CHANGE ME: your premium price
        monthly: 299,        // ← CHANGE ME: your premium monthly hosting
        badge: "Logo included",
      },
    ],

    // Appointment slots. Times are 24-hour "HH:MM".
    slots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    // Which days you are open. 0 = Sunday.
    days: [1, 2, 3, 4, 5, 6],           // Mon – Sat
    // Earliest bookable date, in days from today.
    leadDays: 2,
    // How many bookings you can take in one slot.
    maxPerSlot: 4,
    // How long one appointment takes, in minutes (shown to the customer).
    durationMinutes: 30,
    // Put a deposit on the booking. 0 = the customer pays the full amount.
    depositPercent: 0,                 // ← CHANGE ME e.g. 30 to take a 30% deposit

    // ── "Choose your 2 features" picker ──────────────────────────────
    // Only shown for the booking types listed in `appliesTo` (the
    // Standard card). The options come from inside.featured above.
    // Set `enabled: false` to hide the picker completely.
    featurePick: {
      enabled: true,
      max: 2,                         // how many the customer may pick
      label: "Your 2 features",
      note: "Your Standard card includes any 2 features. Pick yours below.",
      premiumNote: "Premium includes every feature — nothing to pick.",
      appliesTo: ["standard", "custom"],
    },

    // Where the customer comes.
    location: {
      label: "Quezon City, Metro Manila",
      note: "We bring the printer and the NFC tags. You choose your colours, we print, program and hand you the finished card.",
    },
    // What to bring.
    bringNote: "Bring your logo on a phone or a USB stick — we print it while you wait.",

    // The little notes under the form.
    confirmationNote: "We email you within 24 hours to confirm your slot and the exact amount.",
    rescheduleNote: "Need another day? Email us at least 24 hours before and we will move your booking free of charge.",
    cancelledNote: "Cancel free of charge up to 24 hours before your appointment.",
  },

  /* -------------------------------------------------------------------------
     1c. INSIDE THE CARD
     What a tap actually opens. Two columns — one per card tier — and the
     list of extras that only the Premium profile page unlocks.
     {card} {premium} {hosting} {premiumHosting} are replaced with live
     prices, so this never goes out of date.
     ------------------------------------------------------------------------- */
  inside: {
    columns: [
      {
        id: "standard",
        product: "card",
        name: "Standard Digital Card",
        priceLabel: "{card} once + {hosting}/month",
        note: "Everything you need to get the contact — plus two features you pick yourself.",
        cta: "Book the standard card",
        items: [
          { title: "Profile picture",      text: "One photo at the top of your profile" },
          { title: "Tagline",              text: "One line that sits under your name" },
          { title: "Bio",                  text: "A short paragraph about you or your business" },
          { title: "3 social media links", text: "Pick the three that matter" },
          { title: "Contact info",         text: "Your email and your contact number" },
          { title: "2 features of your choice", text: "Choose any two from the Featured list below", highlight: true },
        ],
      },
      {
        id: "premium",
        product: "premium",
        name: "Premium Digital Card",
        priceLabel: "{premium} once + {premiumHosting}/month",
        note: "Everything in the standard card, plus every feature below — nothing held back.",
        cta: "Book the premium card",
        featured: true,
        items: [
          { title: "Profile picture",         text: "Your photo, in full colour" },
          { title: "All of your social media", text: "Every link you want, not just three" },
          { title: "Tagline",                 text: "Your headline, right under your name" },
          { title: "All contacts",            text: "Email, mobile, WhatsApp and address" },
          { title: "All of the features",     text: "Every feature in the Featured list below", highlight: true },
        ],
      },
    ],

    // The catalogue of optional features. The "choose 2" picker in the
    // booking form reads this same list, so there is only ever ONE list
    // to edit. Remove a line here and it disappears from both places.
    featuredTitle: "The Featured features",
    featuredSub: "Standard card — choose any 2 of these. Premium card — every single one is included.",
    featured: [
      { icon: "star",      title: "Client Reviews",                text: "Let people rate you and read what they said." },
      { icon: "briefcase", title: "Portfolio",                     text: "Show the work you are proud of." },
      { icon: "images",    title: "Portfolio gallery",             text: "A visual grid of your best work." },
      { icon: "lock",      title: "OTP Before Entering",           text: "Visitors enter a one-time code before the page opens." },
      { icon: "calendar",  title: "Book Appointment",              text: "Let people book a slot straight from your card." },
      { icon: "images",    title: "1 slide of 5-picture carousel", text: "One slide of five photos that swipes." },
      { icon: "globe",     title: "URL — website, store and etc.",  text: "Any link you want them to open." },
      { icon: "wallet",    title: "Payment method",                text: "A GCash, Maya or bank-transfer button on the page." },
    ],
  },

  // Promo codes for the booking summary. Percent or a fixed peso amount.
  promo: {
    enabled: true,
    codes: [
      { code: "TAPASUL10", type: "percent", value: 10, label: "Launch discount — 10% off" },
      // { code: "FRIENDS", type: "fixed", value: 100, label: "₱100 off" },
    ],
  },

  /* -------------------------------------------------------------------------
     2. PRICING
     Change a number here and the cards, the order form, the calculator and
     the FAQ all update. Nothing else to touch.
     ------------------------------------------------------------------------- */
  pricing: {
    currency: "₱",
    currencyCode: "PHP",

    products: {
      card: {
        id: "card",
        name: "Standard Digital Card",
        shortName: "Digital Card",
        price: 999,                 // one-time hardware fee
        monthly: 149,               // recurring hosting fee (0 = none)
        monthlyLabel: "/ month hosting requirement",
        priceNote: "one-time hardware fee",
        blurb: "The TapAsul NFC card in our artwork — configured with your profile, socials and contact card download.",
        features: [
          "Durable Matte-Finish NFC PVC Card",
          "Dynamic Contact Save (vCard)",
          "Real-time Profile Edits",
        ],
        icon: "credit-card",
        // Your printed artwork. It is mapped onto the front (+z) and back (-z)
        // faces of the 3D model; the Front/Back toggle swaps which one you see.
        // Leave a side as "" to use the generated design on that side.
        faces: { front: "assets/card-front.jpg", back: "assets/card-back.jpg" },
        // Small picture shown on the pricing card. Set "" for none.
        thumb: "assets/card-front.jpg",
        // Colour of the card's cut edge. "" = a darker shade of the brand colour.
        edge: "#ffffff",
        // 3D model proportions (width, height, depth) in scene units.
        // The depth is the card's thickness — keep it thin so it looks like a
        // real bank card (was 0.08, which read as a thick slab).
        model3d: { w: 3.4, h: 2.1, d: 0.04 },
      },
      premium: {
        id: "premium",
        name: "Premium Digital Card",
        shortName: "Premium Card",
        price: 2499,                // one-time hardware fee
        monthly: 299,               // recurring hosting fee
        monthlyLabel: "/ month hosting requirement",
        priceNote: "one-time hardware fee",
        blurb: "Your own logo, colours and design — customisation is included, plus priority booking and unlimited artwork revisions.",
        features: [
          "Your Own Logo & Colours Included",
          "Premium NFC PVC Card",
          "Dynamic Contact Save (vCard)",
          "Real-time Profile Edits",
          "Priority appointment slot",
        ],
        icon: "credit-card",
        badge: "Logo customisation included",
        accent: true,          // gives the card a blue edge on the pricing grid
        // ← CHANGE ME: the premium card can have its own artwork. Until you
        // make one, it uses the same printed faces as the standard card.
        faces: { front: "assets/card-front.jpg", back: "assets/card-back.jpg" },
        thumb: "assets/card-front.jpg",
        edge: "#ffffff",
        model3d: { w: 3.4, h: 2.1, d: 0.04 },
      },

      // The acrylic standee is switched off while the business focuses on
      // digital cards. To sell it again: uncomment this whole block and add
      // "acrylic" to the order list below.
      // acrylic: {
      //   id: "acrylic",
      //   name: "Customized Acrylic Standee",
      //   shortName: "Acrylic Standee",
      //   price: 899,
      //   monthly: 0,
      //   monthlyLabel: "",
      //   priceNote: "one-time payment",
      //   blurb: "High-grade acrylic display stand with an NFC chip and a printed, scannable QR code — made for shop counters and storefronts.",
      //   features: [
      //     "Premium Acrylic Panel + Stable Base",
      //     "NFC Tap & Scannable QR Code",
      //     "Waterproof & Scratch-Resistant Print",
      //   ],
      //   icon: "qr-code",
      //   faces: { front: "assets/acrylic-front.jpg", back: "" },
      //   thumb: "assets/acrylic-front.jpg",
      //   edge: "",
      //   badge: "No monthly subscription",
      //   model3d: { w: 2.2, h: 3.0, d: 0.10 },
      // },
    },

    // Order in which products appear on the page and in the form.
    order: ["card", "premium"],

    // Is there a discount for buying more than one? Set to 0 to disable.
    bulk: {
      enabled: false,
      tiers: [ { minQty: 5, percent: 10 }, { minQty: 10, percent: 15 } ],
    },

    // -- Delivery ---------------------------------------------------------
    // The shipping fee is added to the order BEFORE checkout, so the customer
    // sees the real total. Change the two numbers to your own rates.
    shipping: {
      enabled: true,
      note: "Delivery fees are charged together with your order and are not refundable once the parcel has left our warehouse.",
      zones: [
        { id: "metro",   label: "Metro Manila",                          fee: 150 },  // ← CHANGE ME
        { id: "province",label: "Provincial Luzon / Visayas / Mindanao", fee: 250 },  // ← CHANGE ME
        { id: "pickup",  label: "Collect at my appointment",          fee: 0 },
      ],
    },

    // -- Payment methods --------------------------------------------------
    // Shown as a choice in the booking form. We never take card details on
    // this site — you arrange payment personally after the order is placed.
    payment: {
      methods: [
        { id: "gcash", label: "GCash",            note: "We send our GCash number and confirm your order by email." },
        { id: "maya",  label: "Maya",             note: "We send our Maya number and confirm your order by email." },
        { id: "bank",  label: "Bank transfer",    note: "We email our bank details and the amount to transfer." },
        { id: "cod",   label: "Cash on delivery", note: "Pay the courier when the parcel arrives. A ₱50 COD fee applies." },
      ],
      default: "gcash",
      codFee: 50,          // small fee for cash on delivery
    },

    // -- Add-ons ----------------------------------------------------------
    // Optional extras the customer can tick. Price 0 = free / included.
    addOns: [
      { id: "setup",     label: "Profile setup & vCard",              price: 0,   note: "Included with every booking" },
      { id: "profile2",  label: "Additional digital profile",         price: 149, note: "A second tap profile on the same card" },
      { id: "redesign",  label: "Design revision / reprint",          price: 99,  note: "One round of artwork changes" },
      { id: "replace",   label: "Replacement card",                   price: 599, note: "If your card is lost or damaged", hideInBooking: true },
      { id: "sticker",   label: "NFC sticker (spare / replacement)",   price: 49,  note: "Sticker-sized NFC tag for a phone case" },
    ],
  },

  /* -------------------------------------------------------------------------
     3. PRODUCT CUSTOMISER
     ------------------------------------------------------------------------- */
  customizer: {
    // Text that starts in the "Name on product" box. Leave "" for an empty
    // box, or set a name here.
    defaultName: "",
    nameMaxLength: 24,

    // -- Card branding ----------------------------------------------------
    // "standard" = the card ships with our printed TapAsul artwork.
    // "custom"   = the customer uploads their own logo and picks their own
    //              colours, gradient and finish.
    // Set branding.options to ["standard"] to only ever sell the TapAsul card.
    branding: {
      default: "standard",
      options: [
        { id: "standard", label: "TapAsul artwork", note: "We print the card for you." },
        { id: "custom",   label: "Your own branding", note: "Upload your logo and pick your colours." },
      ],
    },

    // Surface finish. Controls how the card catches the light.
    finishes: [
      { id: "matte",    label: "Matte",    roughness: 0.68, metalness: 0.04 },
      { id: "gloss",    label: "Gloss",    roughness: 0.16, metalness: 0.06 },
      { id: "metallic", label: "Metallic", roughness: 0.34, metalness: 0.55 },
    ],
    defaultFinish: "matte",

    // Background gradients for a custom-branded card.
    gradients: [
      { id: "brand",    label: "TapAsul blue", from: "#0881ef", to: "#0668bf" },
      { id: "sunset",   label: "Sunset",       from: "#f97316", to: "#db2777" },
      { id: "forest",   label: "Forest",       from: "#10b981", to: "#0f766e" },
      { id: "graphite", label: "Graphite",     from: "#475569", to: "#0f172a" },
    ],
    defaultGradient: "brand",

    // Flat background colours for a custom-branded card.
    baseColours: [
      { name: "White",    hex: "#ffffff" },
      { name: "Cloud",    hex: "#f1f5f9" },
      { name: "Midnight", hex: "#0f172a" },
    ],
    // The printed card artwork is the final design, so the live name is NOT
    // stamped onto it. Set true to print the name over the blank area of the
    // front face (useful if you swap in a blank template).
    drawNameOverArtwork: false,
    // Text drawn onto the 3D model
    modelText: {
      line1: "TapAsul",        // printed on the card
      line2: "More than just a tap",
    },
  },

  /* -------------------------------------------------------------------------
     4. LEADERSHIP TEAM
     Add as many as you like — the grid adapts. Set a photo path to use an
     image, or leave "" to show initials.
     ------------------------------------------------------------------------- */
  team: [
    {
      name: "Justin Diaz",
      role: "Founder & Lead Software Developer",
      bio: "Spearheading system architecture, custom NFC web integrations, and product development.",
      initials: "JD",
      photo: "assets/team/justin.jpg", // drop the file in assets/team/ to swap it
    },
    {
      name: "Mark Helary Diaz",
      role: "Co-Founder & Operations Lead",
      bio: "Managing client onboarding, hardware customization, and business growth strategies.",
      initials: "MHD",
      photo: "assets/team/mark.jpg",   // drop the file in assets/team/ to swap it
      // "full" = name, role, photo and bio.
      // "low"  = name and role only, no photo and no bio (keeps them off the radar).
      // "hide" = not shown at all.
      visibility: "low",
    },
  ],

  /* -------------------------------------------------------------------------
     5. FAQ
     Use {card} {hosting} tokens in the text — they are replaced with
     live prices automatically, so the FAQ can never fall out of sync.
     ------------------------------------------------------------------------- */
  faq: [
    {
      q: "How does the TapAsul Digital Card work?",
      a: "TapAsul uses embedded NFC (Near Field Communication) chips. When tapped against any modern iOS or Android smartphone, it instantly opens your custom dynamic landing page — allowing clients to save your contact info or view links without installing any app.",
    },
    {
      q: "What is the {hosting} monthly hosting fee for?",
      a: "The {hosting} monthly subscription maintains your dynamic web page server, analytics tracking, contact vCard download links, and allows you to request real-time updates to your contact details anytime.",
    },
    {
      q: "Can my card open my Google Business review page or my socials?",
      a: "Yes — that is what the card is for. Tell us which links you want when you book (a Google Business review page, your socials, your menu, your portfolio). You can change them later at any time, without reprinting the card, as long as the hosting is active.",
    },
    {
      q: "What is the difference between the standard and the premium card?",
      a: "The standard card is our own artwork — printed, programmed and handed to you at your appointment. The premium card is {premium} and includes your own logo and colours, a premium card finish, priority appointment slots and unlimited artwork revisions. Its hosting is {premiumHosting} a month.",
    },
    {
      q: "Do I need to install an app?",
      a: "No. NFC works natively on iPhone 7 and newer (iOS 11+) and on essentially all modern Android phones. Your customer taps, a link opens in their browser, and that's it.",
    },
    {
      q: "How long does it take to get my card?",
      a: "Most cards are printed, programmed and handed to you during your appointment. If you would rather have it delivered, production and delivery within Metro Manila typically takes 5–7 working days after artwork approval, and 7–12 working days provincial. You will receive a tracking number by email.",
    },
    {
      q: "Do I get analytics on my card?",
      a: "Yes. We record the date, the city and roughly how each tap happened, and we share that with you — ask us any time and we will send you the report. Tap counts show you which card is actually being used. We do not read or store anything about the person who tapped.",
    },
    {
      q: "Can I update my details after the card is printed?",
      a: "Yes, and that is the point of a digital card. Your contact details, links, socials and photo can be changed at any time, without reprinting the card — just email us and we will update it, usually the same day. The hosting fee covers this for as long as you keep it active.",
    },
    {
      q: "How much is shipping and how do I get my card?",
      a: "Delivery is charged before you confirm, so the total you see is the total you pay. We ship with a tracked courier and you get the tracking number by email. Or choose \"Collect at my appointment\" and there is no delivery fee at all.",
    },
    {
      q: "What does the monthly hosting fee include?",
      a: "Your live tap profile (contact card, links, socials and photo), tap analytics, unlimited edits to those details, the hosting itself, and support. It does not include a new physical card — that is billed separately as a replacement.",
    },
    {
      q: "What material is the card made of, and how thick is it?",
      a: "It is a matte PVC card with an embedded NFC chip — roughly the thickness of a normal bank card, so it fits in a standard wallet. The cut edge is white, and the card is sealed so it survives a bag or a pocket.",
    },
    {
      q: "Can I get more than one profile on the same card, or replace a card later?",
      a: "Yes. Extra profiles and replacement cards are available as add-ons in the booking form, so you can see the price before you commit. A replacement is printed with the same artwork you already approved.",
    },
    {
      q: "Do I have to come to your office to get my card?",
      a: "No — but most people prefer to. You book a date and time, we print and program your card while you wait, and you walk out with it in about 30 minutes. If you cannot come in, choose delivery and we will ship the finished card to you.",
    },
    {
      q: "What is your refund policy?",
      a: "Because every card is printed to your own design, we cannot resell it. Bookings cancelled more than 24 hours before your appointment are refunded in full, less any delivery fee already paid. Once production starts, a custom-printed card cannot be refunded. Read the full Refund Policy before you book.",
    },
  ],

  /* -------------------------------------------------------------------------
     6. PAGE COPY
     -------------------------------------------------------------------------
     Every heading, button label and paragraph on the page lives here.
     Change the text, save, refresh — done. No HTML editing needed.

     In the HTML these strings are marked like this:
       data-text="content.hero.lede"      -> plain text
       data-html="content.hero.headline"  -> text where *stars* become <em>
     ------------------------------------------------------------------------- */
  content: {
    // ── Browser tab + search results ────────────────────────────────────
    pageTitle: "TapAsul | Smart NFC Digital Cards",
    pageTitleSuffix: "Smart NFC Digital Cards",
    metaDescription: "Discover TapAsul smart NFC digital cards — standard or fully customised with your own logo, colours and live profile. Tap to share your contact card, anywhere in the Philippines.",
    ogDescription: "Connect instantly with a smart NFC digital card — standard, or customised with your own logo and colours.",
    ogImageAlt: "TapAsul smart NFC digital card",

    // ── Menu ─────────────────────────────────────────────────────────────
    nav: {
      products: "Products & Pricing",
      customizer: "3D Customizer",
      faq: "FAQ",
      team: "Team",
      inside: "Inside the card",
      order: "Book Now",
    },

    // ── Hero ─────────────────────────────────────────────────────────────
    hero: {
      pill: "More Than Just A Tap",
      // Wrap a phrase in *stars* to make it italic blue.
      headline: "Connect instantly with *smart NFC* technology",
      lede: "Elevate your personal branding and business networking with TapAsul digital cards — standard, or Premium with your own logo and colours. Seamless, fast, and modern.",
      ctaPrimary: "Book your TapAsul",
      ctaSecondary: "Try the 3D studio",
      stageHint: "Drag to rotate · scroll to read on",
    },

    // ── Section headings ────────────────────────────────────────────────
    sections: {
      products:   { title: "Our digital card",  sub: "Two tiers, the same tap — the standard TapAsul card, or the Premium card with your own logo, colours and priority booking." },
      inside:     { eyebrow: "Inside the card", title: "What's inside your digital card?",
                    sub: "The Standard card gives you the essentials plus two features you choose. The Premium card gives you all of it — every social link, every contact and every feature below." },
      customizer: { eyebrow: "Live preview", title: "3D customizer studio", sub: "Personalise your card in real time, then book your appointment." },
      faq:        { title: "Frequently asked questions", sub: "Everything you need to know about TapAsul technology and booking." },
      team:       { title: "Meet the leadership", sub: "The team driving contactless technology and modern digital solutions." },
      preorder:   { title: "Book your card appointment", sub: "Pick a date and time, tell us about your card, and we'll confirm by email." },
      delivery:   { title: "Delivery & shipping", sub: "How your finished card gets to you, and what it costs." },
      support:    { title: "Support & contact", sub: "Talk to a human before or after your appointment." },
    },

    // -- Delivery & shipping ----------------------------------------------
    delivery: {
      steps: [
        { title: "You book", text: "Pick your date, time and card type, then send the booking. You get an email confirmation straight away." },
        { title: "We confirm", text: "We check your artwork and details, then email you the final amount to pay and the exact address to come to." },
        { title: "We make it", text: "At your appointment we print, NFC-program and quality-check your card while you wait — or we print it and post it to you." },
        { title: "We deliver", text: "You walk out with a finished card, or a tracked courier brings it to you and the tracking number lands in your inbox." },
      ],
      timelineMetro: "5–7 working days",
      timelineProvince: "7–12 working days",
      pickupNote: "Prefer to pick up? Your appointment slot is already a pickup — just leave the delivery box empty and we will hand it over.",
    },

    // -- Support -----------------------------------------------------------
    support: {
      channels: [
        { id: "email",  label: "Email",    value: "tapasul.digitalcard@gmail.com", note: "We reply within one business day." },
        { id: "phone",  label: "Phone",    value: "09623017609", note: "Mon–Sat, 9am–6pm." },
        { id: "social", label: "Instagram", value: "@tapasul_digitalcard", note: "Fastest for artwork questions." },
      ],
      ticketNote: "Every booking gets a support ticket. Quote the booking number in your email and we will pull up the whole history.",
    },

    // ── Booking form ────────────────────────────────────────────────────
    form: {
      productLegend: "Select product",
      qtyLabel: "Quantity",
      nameLabel: "Full name",
      emailLabel: "Email address",
      phoneLabel: "Mobile number",
      phonePlaceholder: "09XX XXX XXXX",
      totalLabel: "Total due",
      submit: "Confirm booking",
      privacyLink: "How we handle your data",
      namePlaceholder: "e.g. Juan Dela Cruz",
      emailPlaceholder: "juan@example.com",
      addressLabel: "Delivery address",
      addressPlaceholder: "House no., street, barangay, city, province, ZIP",
      zoneLabel: "Delivery area",
      paymentLabel: "Payment method",
      addOnsLabel: "Add-ons",
      noPaymentNote: "No payment is taken on this page. We confirm your booking and the amount by email first.",

      // appointment
      dateLabel: "Preferred date",
      slotLabel: "Preferred time",
      slotEmpty: "Pick a date to see the free slots.",
      notesLabel: "What should be on your card?",
      notesPlaceholder: "Your name, job title, links, the colours you want… anything you want printed.",
      notesHint: "Optional — but it saves a message later.",
      locationLabel: "Where we meet",
      bringLabel: "Bring",
      typeLegend: "What you're booking",
      summaryTitle: "Booking summary",
      promoLabel: "Promo code",
      promoApply: "Apply",
      promoNone: "No promo code",
      promoInvalid: "That code is not valid.",
      promoApplied: "Promo applied",
      slotTaken: "Booked",
      slotTakenHint: "That slot is taken on this device. Pick another time.",
      daysAhead: "Book at least {n} days ahead.",
      depositLabel: "Due today",
      balanceLabel: "Balance on the day",
    },

    // ── Privacy notice ──────────────────────────────────────────────────
    privacy: {
      title: "Privacy notice",
      // Use **bold**, {email} and {brand} — they are replaced automatically.
      paragraphs: [
        "**What we collect.** Your name, email address, delivery address, the products, quantity, add-ons and payment method you chose. If you accept analytics, we also record how often your own profile is tapped — never the contact details of the people who tap it.",
        "**Why.** Only to confirm and run your appointment, to take payment, to deliver the card and to support the profile you bought. We do not use your details for unrelated marketing and we never sell them.",
        "**How long.** Booking records are kept for 24 months from the last transaction — the period needed to meet accounting and tax requirements — and then deleted. Your choice about analytics is stored on your own device only.",
        "**Your rights.** Under the Philippine Data Privacy Act of 2012 (RA 10173) you can ask to see, correct or delete your data at any time by emailing {dpoEmail}. Our Data Protection Officer can be reached the same way.",
        { text: "This is a plain-language summary, not legal advice. The full version is on our ", html: true, link: { href: "privacy-policy.html", label: "Privacy Policy" }, style: "small" }
      ],
    },

    // ── Footer ───────────────────────────────────────────────────────────
    footer: {
      exploreTitle: "Explore",
      contactTitle: "Contact",
      legalTitle: "Legal",
      terms: "Terms of Use",
      refund: "Refund Policy",
      privacy: "Privacy Policy",
      delivery: "Delivery & shipping",
      blurb: "Connect instantly with smart NFC digital cards — standard, or customised with your own logo and colours.",
      copyright: "All rights reserved.",
    },

    // ── Booking form step labels ───────────────────────────────────────
    steps: {
      product: { n: 1, title: "What you're booking", sub: "The card you want, and how many." },
      details: { n: 2, title: "Appointment details", sub: "When you can come, and how we reach you." },
      delivery:{ n: 3, title: "Delivery & payment", sub: "Where it goes and how you'll pay." },
      review:  { n: 4, title: "Review & confirm", sub: "Check everything before you send it." },
    },

    // ── Small labels used across the page ───────────────────────────────
    labels: {
      sideFront: "Front",
      sideBack: "Back",
      cardSide: "Card side",
      modelType: "Model type",
      branding: "Card branding",
      yourLogo: "Your logo",
      chooseFile: "Choose an image",
      logoHint: "PNG or JPG with a transparent background works best.",
      background: "Background colour",
      gradient: "Gradient",
      finish: "Finish",
      nameOnProduct: "Name on product",
      nameHint: "Printed onto the live 3D model.",
      dragToRotate: "Drag to rotate",
      skipToContent: "Skip to content",
      noscript: "This page works best with JavaScript enabled. You can still email us to book.",
    },
  },

  /* -------------------------------------------------------------------------
     7. SEO
     -------------------------------------------------------------------------
     brand.url is the single place your domain is set. After changing it run
     `node tools/build-seo.js` (or let Cloudflare run it) and the canonical
     link, Open Graph tags, JSON-LD, robots.txt and sitemap.xml all update.
     ------------------------------------------------------------------------- */
  seo: {
    // Extra pages listed in sitemap.xml.
    extraPages: [
      { path: "/terms.html",          priority: "0.3", changefreq: "yearly" },
      { path: "/refund-policy.html",  priority: "0.3", changefreq: "yearly" },
      { path: "/privacy-policy.html", priority: "0.3", changefreq: "yearly" },
    ],
  },

  /* -------------------------------------------------------------------------
     8. BOOKING FORM
     ------------------------------------------------------------------------- */
  order: {
    // How the form submits. Options:
    //   "email"        – opens the visitor's mail client with the booking filled in (no backend)
    //   "formspree"    – POSTs to Formspree; set endpoint below
    //   "google-form"  – POSTs to a Google Form / Apps Script Web App; set endpoint
    //   "demo"         – validates and shows a notice, sends nothing
    //   "local"        - stores the booking in the browser and (if endpoint is set) POSTs it to your sheet
    mode: "email",                     // ← CHANGE ME once you have a backend
    endpoint: "",                      // ← e.g. "https://formspree.io/f/xxxxxxx"

    // Where bookings go. Used by mode "email".
    orderEmail: "tapasul.digitalcard@gmail.com",   // bookings land in this inbox

    // -- Admin dashboard (admin.html) -------------------------------------
    admin: {
      enabled: true,
      // The PIN that unlocks admin.html. This is a soft lock: the value lives
      // in this file, so anyone who can read the source can bypass it. Put the
      // page behind a shared-secret URL as well if the site is public.
      pin: "1234",                          // <-- CHANGE ME
      // Where orders are stored on the visitor's device.
      storageKey: "tapasul_bookings_v1",
      // Optional: a Google Sheet published as CSV (or any JSON endpoint) that
      // admin.html reads so you see orders from every device, not just this
      // one. Publish the sheet: File -> Share -> Publish to web -> CSV.
      remoteUrl: "",                        // e.g. "https://docs.google.com/spreadsheets/d/XXXX/pub?gid=0&single=true&output=csv"
      // Order states you can cycle through in the dashboard.
      statuses: ["new", "contacted", "confirmed", "shipped", "cancelled"],
    },

    paymentNote: "No payment is taken online. We will contact you to confirm your booking and arrange payment.",
    successMessage: "Thanks! Your booking has been received. We'll email you within one business day to confirm the slot.",
    privacyNote: "We collect your name, email and phone only to confirm and run your appointment. We never sell your data. You can ask us to delete it anytime.",
  },

  /* -------------------------------------------------------------------------
     8b. COMPANY & LEGAL
     -------------------------------------------------------------------------
     These details fill the Terms, Refund Policy and Privacy pages. Keep them
     accurate — wrong company details are the fastest way to lose a dispute.
     ------------------------------------------------------------------------- */
  legal: {
    companyName: "TapAsul",                          // ← CHANGE ME: registered name
    businessStyle: "TapAsul Digital Card",           // ← CHANGE ME: how you trade
    address: "Quezon City, Metro Manila, Philippines",
    email: "tapasul.digitalcard@gmail.com",
    // Data Protection Officer / privacy contact. A company-domain address
    // (not gmail) looks far more accountable — use one once you own the domain.
    dpoEmail: "dataprivacy@tapasul.com",            // ← CHANGE ME
    dpoName: "Data Protection Officer",
    phone: "09623017609",
    vatNumber: "",                                   // ← CHANGE ME if registered
    governingLaw: "Republic of the Philippines",
    // How long a finished order record is kept before it is deleted.
    orderRetentionMonths: 24,
  },

  /* -------------------------------------------------------------------------
     8b-2. LEGAL PAGES
     -------------------------------------------------------------------------
     The wording for Terms of Use, Refund Policy and Privacy Policy.
     Edit it here — the pages are generated from this text.

     ⚠️  These are a solid starting point, not legal advice. Have a Philippine
     lawyer review them before you take real money.
     ------------------------------------------------------------------------- */
  legalPages: {
    updated: "4 November 2026",
    notice: "This summary is provided for your convenience and is not legal advice. Please have a qualified lawyer review it before you start taking payments.",

    terms: {
      title: "Terms of Use",
      lede: "The rules for using this website and buying from us.",
      sections: [
        { heading: "1. Who we are",
          body: ["This website and the products sold through it are operated by " + "{company}" + " (\"we\", \"us\"), a business registered in the " + "{law}" + ". We sell NFC digital cards that link to a digital profile we host.",
                 "You can reach us at " + "{email}" + " or " + "{phone}" + "."] },
        { heading: "2. Placing a booking",
          body: ["Everything on this site is an appointment booking. Placing a booking means you are asking us to print and program a digital card for you, and reserving a slot at our studio.",
                 "A booking becomes binding when we send you a confirmation email with the final amount and the confirmed date and time. If we cannot fulfil a booking we will tell you and refund any amount you have paid in full.",
                 "We keep a limited number of slots open each day and may close a date when it is fully booked. Slots are first come, first served."] },
        { heading: "3. Prices and payment",
          body: ["Prices are shown in Philippine pesos and include the hardware and any add-ons you select. Monthly hosting fees are billed separately and start when your profile goes live.",
                 "No payment is taken on this website. We will contact you after you book to arrange payment by GCash, Maya, bank transfer or cash on delivery. If a quoted price is obviously wrong we will contact you before charging you.",
                 "If we ask for a deposit to hold your slot, the balance is payable at the appointment. The deposit is shown in the booking summary before you confirm."] },
        { heading: "4. Delivery and pickup",
          body: ["Delivery charges are shown before you confirm your booking so the total you see is the total you pay. We use tracked couriers and send you the tracking number by email.",
                 "You can also choose to collect the finished card at your appointment. Choose \"Collect at my appointment\" and no delivery fee is added.",
                 "Delivery times are estimates, not guarantees. Risk of loss passes to you when the courier records the parcel as delivered. Please check your parcel on arrival and tell us about any damage within 48 hours."] },
        { heading: "5. Your TapAsul profile",
          body: ["A digital card is a physical NFC tag that opens a profile page we host. The monthly hosting fee covers that page, the ability to edit your details, tap analytics and support.",
                 "You are responsible for the content you put in your profile. Do not upload anything unlawful, infringing, or misleading. We may remove content that breaks these terms."] },
        { heading: "6. Acceptable use",
          body: ["Do not use the site to order illegal goods, to impersonate someone else, or to harass anyone. Do not attempt to disrupt the site, probe it without permission, or resell our hosted profiles as your own service."] },
        { heading: "7. Intellectual property",
          body: ["We keep ownership of the TapAsul name, the frog logo, the templates and the software on this site. You keep ownership of the artwork, logo and text you give us.",
                 "You give us a non-exclusive licence to print, host and display your artwork on the products you order and in our sample photos. We will not sell your artwork or use it for a different product."] },
        { heading: "8. Personal information",
          body: ["We collect only what we need to confirm and run your appointment. See the Privacy Policy for the full list, how long we keep it and how to ask us to delete it."] },
        { heading: "9. Liability",
          body: ["To the extent the law allows, we are not liable for indirect or consequential loss, including loss of profit, data or goodwill. Our total liability for any booking is limited to the amount you paid us for that booking.",
                 "Nothing in these terms excludes liability that cannot lawfully be excluded, including for death or personal injury caused by negligence, or for fraud."] },
        { heading: "10. Ending the agreement",
          body: ["You can stop your monthly hosting at any time by telling us. We can cancel or suspend a booking if you break these terms, if we cannot produce the item, or if a payment is not made.",
                 "If we end the hosting early because of a breach by you, no refund is due for the remaining months."] },
        { heading: "11. Disputes and governing law",
          body: ["These terms are governed by the laws of the " + "{law}" + ".",
                 "Before going to court, please talk to us — most problems are a misunderstanding and we would rather fix it. If a dispute cannot be settled, it will be handled by the courts of the " + "{law}" + " unless you are a consumer, in which case you keep the benefit of any mandatory consumer protections available to you."] },
        { heading: "12. Changes",
          body: ["We may update these terms. The version on this page is the one that applies to bookings placed on or after the date shown at the top. Material changes will be announced on the site or by email."] }
      ]
    },

    refund: {
      title: "Refund Policy",
      lede: "When you can get your money back, and when you cannot.",
      sections: [
        { heading: "1. The short version",
          body: ["Bookings cancelled more than 24 hours before the appointment are refunded in full and the slot is released. A custom-printed card cannot be refunded once printing has started, because it cannot be sold to anyone else. Faulty or damaged items are replaced, not refunded."] },
        { heading: "2. Before production starts",
          body: ["If you cancel your booking before we confirm it or begin printing, we refund the full amount you paid, including any delivery fee and deposit.",
                 "We consider production to have started when we send you the artwork proof for approval, or 24 hours after your booking is confirmed — whichever comes first.",
                 "Cancellations inside 24 hours of the appointment may be treated as a no-show and the deposit may be kept."] },
        { heading: "3. After production starts",
          body: ["Every card is printed to your own artwork, so once printing starts the item is unique and cannot be resold. These items are therefore not refundable.",
                 "This does not affect your legal rights if the item is faulty, damaged, or not as described."] },
        { heading: "4. Faulty, damaged or incorrect items",
          body: ["If your item arrives damaged, or we printed something different from the artwork you approved, tell us within 48 hours of delivery with photos.",
                 "We will replace the faulty item at no cost, or refund you in full if we cannot replace it. Delivery charges for the replacement are on us."] },
        { heading: "5. Replacement cards",
          body: ["A replacement card is a new custom-printed item, so it is not refundable once printed. It does carry the same fault and damage cover as your first order."] },
        { heading: "6. Late or failed delivery",
          body: ["If a courier loses the parcel, we will replace it once the courier's claim is closed. If we cannot replace it we refund the product value and the original delivery fee."] },
        { heading: "7. Monthly hosting",
          body: ["Hosting can be cancelled at any time. If you cancel within 30 days of a renewal we refund that renewal in full; after that we stop the service at the end of the paid month and do not refund the remaining part."] },
        { heading: "8. How to ask for a refund",
          body: ["Email " + "{email}" + " with your order number, the amount you paid, the date and the reason. We answer every refund request within seven working days.",
                 "Approved refunds are returned by the same method you paid, usually within 10 working days of approval. Bank transfer timelines may be longer."] },
        { heading: "9. Chargebacks",
          body: ["Please talk to us first. If you raise a chargeback with your bank before we have replied, it usually takes longer for everyone and we may suspend your profile while it is investigated."] },
        { heading: "10. Items we cannot refund",
          body: ["Delivery fees once the parcel has shipped, and any add-on you have already used, such as a profile that has been set up and shared."] }
      ]
    },

    privacy: {
      title: "Privacy Policy",
      lede: "What we collect, why we collect it, and how to get it deleted.",
      sections: [
        { heading: "1. Who is responsible for your data",
          body: ["The data controller is " + "{company}" + ", " + "{address}" + ". Our Data Protection Officer can be reached at " + "{dpo}" + " (" + "{dpoEmail}" + ") or by post at the address above.",
                 "You also reach us about your order at " + "{email}" + "."] },
        { heading: "2. What we collect",
          body: ["Order details: your name, email address, delivery address, the products and quantities you chose, your payment method choice, and the notes you send us.",
                 "Service details: when your profile is viewed or tapped, we record the date and time, a rough location derived from the IP address, and the device type. We do not collect the contact details of the person who taps your card.",
                 "Technical details: your IP address is anonymised for analytics. Your browser's local storage holds your booking so we can help you if something goes wrong."] },
        { heading: "3. Why we collect it",
          body: ["To take, make and deliver your order, to take payment, and to keep records that the law requires us to keep.",
                 "To operate and support the hosted profile you bought. With your consent, anonymised tap analytics so we can see whether a card is being used.",
                 "We do not sell your personal information and we do not run advertising trackers."] },
        { heading: "4. How long we keep it",
          body: ["Order records are kept for " + "{retention}" + " months from the last transaction, which is the period needed to meet accounting and tax requirements, and then deleted.",
                 "Analytics are kept in aggregate and anonymised. If you ask us to delete your data earlier we will do it, unless we are legally required to keep it."] },
        { heading: "5. Who we share it with",
          body: ["The courier that delivers your parcel, so they can deliver it. Your payment method provider or bank, to take payment. Government authorities, if the law requires us to.",
                 "We do not share your details with anyone else for marketing."] },
        { heading: "6. Your rights under the Data Privacy Act of 2012",
          body: ["You have the right to be informed about the processing of your personal information, to access it, to correct it, to object to processing, to have it erased or blocked, to be compensated for damage caused by false or unlawfully obtained data, and to obtain a copy of it.",
                 "To exercise any of these, email " + "{dpoEmail}" + ". We reply within fifteen days. If you are not satisfied you may complain to the National Privacy Commission."] },
        { heading: "7. Cookies and local storage",
          body: ["This site uses no advertising cookies. It uses local storage to remember your privacy choice and, if you accept, to keep a copy of your booking on your own device.",
                 "If you decline analytics, no analytics script is loaded at all and nothing is stored on your device."] },
        { heading: "8. Children's privacy",
          body: ["Our products are business tools and are not directed at children. We do not knowingly collect information from anyone under 18."] },
        { heading: "9. Security",
          body: ["Traffic is encrypted with HTTPS. Access to order records is limited to the people who need it to do their job. No system is perfectly secure, so if a breach affects your data we will tell you and the National Privacy Commission as required by law."] },
        { heading: "10. Changes to this policy",
          body: ["If we change what we collect or how we use it, we will update this page and, for a material change, tell you by email before it takes effect."] }
      ]
    }
  },

  /* -------------------------------------------------------------------------
     8c. PRIVACY CONSENT GATE
     -------------------------------------------------------------------------
     Shown before the visitor can use the site. If they decline we stop
     storing anything locally and never load analytics.
     ------------------------------------------------------------------------- */
  privacyConsent: {
    enabled: true,
    title: "Before you continue",
    body: "We use your browser's local storage to remember your booking so we can help you if something goes wrong. We do not sell your data and we never run advertising trackers. Analytics are optional and only load if you accept them.",
    acceptLabel: "Accept and continue",
    declineLabel: "Continue without tracking",
    declinedNote: "Tracking declined — we will not store anything on this device, so please keep a copy of your order confirmation.",
  },

  /* -------------------------------------------------------------------------
     9. ANALYTICS / PRIVACY
     Leave blank to include nothing. IP-anonymised by default.
     ------------------------------------------------------------------------- */
  analytics: {
    googleAnalyticsId: "",             // e.g. "G-XXXXXXXXXX"
    metaPixelId: "",                   // e.g. "1234567890"
  },

  /* -------------------------------------------------------------------------
     10. SITE BEHAVIOUR
     ------------------------------------------------------------------------- */
  features: {
    mobileNav: true,
    scrollOffsetPx: 88,                // keeps sections clear of the sticky header
    showTeam: true,
    showFaq: true,
    showCustomizer: true,
    reducedMotionCap: 30,              // fps cap when the visitor prefers reduced motion
    pause3dOffscreen: true,            // stop the render loop when off-screen
  },
};
