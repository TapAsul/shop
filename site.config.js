/* ============================================================================
   TapAsul — site.config.js
   ----------------------------------------------------------------------------
   ⚙️  THIS IS THE ONLY FILE YOU NEED TO EDIT.
   Every price, product, name, FAQ, colour, heading and contact detail on the
   page is pulled from this object. Change it here → it changes everywhere.

   QUICK START — three things to change before you publish:
     1. brand.url ............... your real domain  (line ~35)
     2. order.admin.pin .......... your dashboard PIN (search "pin:")
     3. order.mode ............... how pre-orders reach you (search "mode:")

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
    description: "Connect instantly with smart NFC digital cards and customized acrylic QR review stands for your business.",

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
        blurb: "Personal NFC PVC card configured with your custom profile, socials, and contact card download.",
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
        // 3D model proportions (width, height, depth) in scene units
        model3d: { w: 3.4, h: 2.1, d: 0.08 },
      },
      acrylic: {
        id: "acrylic",
        name: "Customized Acrylic Standee",
        shortName: "Acrylic Standee",
        price: 899,
        monthly: 0,
        monthlyLabel: "",
        priceNote: "one-time payment",
        blurb: "High-grade acrylic display stand equipped with NFC chip and engraved QR code for storefronts.",
        features: [
          "Premium Acrylic Display + Wood/Acrylic Base",
          "Instant Google Review & Social Redirects",
          "Waterproof & Scratch-Resistant Print",
        ],
        icon: "qr-code",
        faces: { front: "", back: "" },          // ← add your printed panel here
        // Colour of the standee's edge. "" = a darker shade of the brand colour.
        edge: "",
        badge: "No monthly subscription",   // shown in green; set "" to hide
        model3d: { w: 2.2, h: 3.0, d: 0.12 },
      },
    },

    // Order in which products appear on the page and in the form
    order: ["card", "acrylic"],

    // Is there a discount for buying more than one? Set to 0 to disable.
    bulk: {
      enabled: false,
      tiers: [ { minQty: 5, percent: 10 }, { minQty: 10, percent: 15 } ],
    },
  },

  /* -------------------------------------------------------------------------
     3. PRODUCT CUSTOMISER
     ------------------------------------------------------------------------- */
  customizer: {
    // Text that starts in the "Name on product" box. Leave "" for an empty
    // box, or set a name here.
    defaultName: "",
    nameMaxLength: 24,
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
    },
  ],

  /* -------------------------------------------------------------------------
     5. FAQ
     Use {card} {acrylic} {hosting} tokens in the text — they are replaced with
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
      q: "How do customers leave a review on the Acrylic Standee?",
      a: "Customers simply tap their smartphone against the top of the acrylic standee (or scan the high-clarity QR code). It instantly redirects them directly to your Google Business Review form or social media page.",
    },
    {
      q: "Do I need to install an app?",
      a: "No. NFC works natively on iPhone 7 and newer (iOS 11+) and on essentially all modern Android phones. Your customer taps, a link opens in their browser, and that's it.",
    },
    {
      q: "How long does delivery take?",
      a: "Production and delivery within Metro Manila typically takes 5–7 working days after artwork approval. Provincial orders take 7–12 working days. You will receive a tracking number by email.",
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
    pageTitle: "TapAsul | Smart NFC Digital Cards & Acrylic QR Stands",
    pageTitleSuffix: "Smart NFC Digital Cards & Acrylic QR Stands",
    metaDescription: "Discover TapAsul smart NFC digital cards and customized acrylic QR review stands for modern networking and business growth in the Philippines.",
    ogDescription: "Connect instantly with smart NFC digital cards and customized acrylic QR review stands.",
    ogImageAlt: "TapAsul smart NFC card and acrylic QR standee",

    // ── Menu ─────────────────────────────────────────────────────────────
    nav: {
      products: "Products & Pricing",
      customizer: "3D Customizer",
      faq: "FAQ",
      team: "Team",
      order: "Pre-Order",
    },

    // ── Hero ─────────────────────────────────────────────────────────────
    hero: {
      pill: "More Than Just A Tap",
      // Wrap a phrase in *stars* to make it italic blue.
      headline: "Connect instantly with *smart NFC* technology",
      lede: "Elevate your personal branding and business networking with TapAsul digital cards and customized acrylic review standees. Seamless, fast, and modern.",
      ctaPrimary: "Order your TapAsul",
      ctaSecondary: "Try the 3D studio",
      stageHint: "Drag to rotate · scroll to read on",
    },

    // ── Section headings ────────────────────────────────────────────────
    sections: {
      products:   { title: "Our hardware products",  sub: "Choose the perfect smart solution for your personal brand or retail storefront." },
      customizer: { eyebrow: "Live preview", title: "3D customizer studio", sub: "Personalise your TapAsul hardware in real time before placing your pre-order." },
      faq:        { title: "Frequently asked questions", sub: "Everything you need to know about TapAsul technology and ordering." },
      team:       { title: "Meet the leadership", sub: "The team driving contactless technology and modern digital solutions." },
      preorder:   { title: "Pre-order TapAsul hardware", sub: "Choose your product and quantity. We'll confirm by email." },
    },

    // ── Pre-order form ──────────────────────────────────────────────────
    form: {
      productLegend: "Select product",
      qtyLabel: "Quantity",
      nameLabel: "Full name",
      emailLabel: "Email address",
      totalLabel: "Total due",
      submit: "Confirm pre-order",
      privacyLink: "How we handle your data",
      namePlaceholder: "e.g. Juan Dela Cruz",
      emailPlaceholder: "juan@example.com",
    },

    // ── Privacy notice ──────────────────────────────────────────────────
    privacy: {
      title: "Privacy notice",
      // Use **bold**, {email} and {brand} — they are replaced automatically.
      paragraphs: [
        "**What we collect.** Your name and email address, plus the product and quantity you selected. Nothing else is captured by this page.",
        "**Why.** Only to process and confirm your pre-order and to contact you about it. We do not use your details for unrelated marketing and we never sell them.",
        "**How long.** Order records are kept for as long as needed to fulfil the order and meet accounting requirements, then deleted.",
        "**Your rights.** Under the Philippine Data Privacy Act of 2012 (RA 10173) you can ask to see, correct, or delete your data at any time by emailing {email}.",
        { text: "This is a plain-language summary, not legal advice. Have it reviewed before you start collecting real customer data at scale.", style: "small" }
      ],
    },

    // ── Footer ───────────────────────────────────────────────────────────
    footer: {
      exploreTitle: "Explore",
      contactTitle: "Contact",
      blurb: "Connect instantly with smart NFC digital cards and customized acrylic QR review stands for your business.",
      copyright: "All rights reserved.",
    },

    // ── Small labels used across the page ───────────────────────────────
    labels: {
      sideFront: "Front",
      sideBack: "Back",
      cardSide: "Card side",
      modelType: "Model type",
      nameOnProduct: "Name on product",
      nameHint: "Printed onto the live 3D model.",
      dragToRotate: "Drag to rotate",
      skipToContent: "Skip to content",
      noscript: "This page works best with JavaScript enabled. You can still email us to order.",
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
    extraPages: [],   // e.g. [{ path: "/privacy.html", priority: "0.5" }]
  },

  /* -------------------------------------------------------------------------
     8. PRE-ORDER FORM
     ------------------------------------------------------------------------- */
  order: {
    // How the form submits. Options:
    //   "email"        – opens the visitor's mail client with the order filled in (no backend)
    //   "formspree"    – POSTs to Formspree; set endpoint below
    //   "google-form"  – POSTs to a Google Form / Apps Script Web App; set endpoint
    //   "demo"         – validates and shows a notice, sends nothing
    //   "local"        - stores the order in the browser and (if endpoint is set) POSTs it to your sheet
    mode: "email",                     // ← CHANGE ME once you have a backend
    endpoint: "",                      // ← e.g. "https://formspree.io/f/xxxxxxx"

    // Where orders go. Used by mode "email".
    orderEmail: "tapasul.digitalcard@gmail.com",   // pre-orders land in this inbox

    // -- Admin dashboard (admin.html) -------------------------------------
    admin: {
      enabled: true,
      // The PIN that unlocks admin.html. This is a soft lock: the value lives
      // in this file, so anyone who can read the source can bypass it. Put the
      // page behind a shared-secret URL as well if the site is public.
      pin: "1234",                          // <-- CHANGE ME
      // Where orders are stored on the visitor's device.
      storageKey: "tapasul_orders_v1",
      // Optional: a Google Sheet published as CSV (or any JSON endpoint) that
      // admin.html reads so you see orders from every device, not just this
      // one. Publish the sheet: File -> Share -> Publish to web -> CSV.
      remoteUrl: "",                        // e.g. "https://docs.google.com/spreadsheets/d/XXXX/pub?gid=0&single=true&output=csv"
      // Order states you can cycle through in the dashboard.
      statuses: ["new", "contacted", "confirmed", "shipped", "cancelled"],
    },

    paymentNote: "No payment is taken online. We will contact you to confirm your order and arrange payment.",
    successMessage: "Thanks! Your pre-order has been received. We'll email you within one business day to confirm.",
    privacyNote: "We collect your name and email only to process this pre-order. We never sell your data. You can ask us to delete it anytime.",
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
