/* ============================================================================
   TapAsul — script.js
   Everything is driven by site.config.js. This file should not need editing
   to change prices, products, team, FAQ or contact details.
   ========================================================================= */
(function () {
  'use strict';

  const CFG = window.TAPASUL_CONFIG || {};
  const SEO = window.TAPASUL_SEO || {};
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const money = (n) => CFG.pricing.currency + Number(n).toLocaleString('en-PH');

  // small on-screen message
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('is-visible'), 2800);
  }

  // ---- privacy consent -------------------------------------------------
  // 'granted' | 'declined' | 'pending'. Until the visitor chooses we do not
  // store anything locally and we never load analytics.
  const CONSENT_KEY = 'tapasul_consent_v1';
  function consentState() {
    return document.documentElement.getAttribute('data-consent') || 'pending';
  }
  function consentGranted() { return consentState() === 'granted'; }

  function initConsent() {
    const cfg = CFG.privacyConsent || {};
    const gate = $('#consentGate');
    document.documentElement.setAttribute('data-consent', 'pending');

    let stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch (_) { /* private mode */ }
    if (stored === 'granted' || stored === 'declined') {
      document.documentElement.setAttribute('data-consent', stored);
      return;
    }
    if (!gate || cfg.enabled === false) {
      document.documentElement.setAttribute('data-consent', 'granted');
      return;
    }

    const titleEl = $('#consentTitle'), bodyEl = $('#consentBody');
    if (titleEl) titleEl.textContent = cfg.title || 'Before you continue';
    if (bodyEl) bodyEl.textContent = cfg.body || '';
    const accept = $('#consentAccept'), decline = $('#consentDecline');
    if (accept) accept.textContent = cfg.acceptLabel || 'Accept and continue';
    if (decline) decline.textContent = cfg.declineLabel || 'Continue without tracking';

    gate.hidden = false;
    document.body.style.overflow = 'hidden';

    function choose(value) {
      try { localStorage.setItem(CONSENT_KEY, value); } catch (_) { /* ignore */ }
      document.documentElement.setAttribute('data-consent', value);
      gate.hidden = true;
      document.body.style.overflow = '';
      if (value === 'granted') {
        initAnalytics();
        toast('Thanks — you can book below.');
      } else {
        toast(cfg.declinedNote || 'Tracking declined.');
      }
    }
    if (accept) accept.addEventListener('click', () => choose('granted'));
    if (decline) decline.addEventListener('click', () => choose('declined'));
  }

  /* ------------------------------------------------------------------ *
   * 1. BRAND TOKENS → CSS variables + static text
   * ------------------------------------------------------------------ */
  function applyBrand() {
    const b = CFG.brand, c = b.colors, root = document.documentElement.style;
    root.setProperty('--brand', c.brand);
    root.setProperty('--brand-hover', c.brandHover);
    root.setProperty('--brand-light', c.brandLight);
    root.setProperty('--brand-dark', c.brandDark);
    root.setProperty('--ink', c.brandBlack);
    root.setProperty('--header-h', '72px');

    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = c.brand;

    // split brand wordmark
    const head = b.name.slice(0, b.splitAt);
    const tail = b.name.slice(b.splitAt);
    $$('[data-brand-text]').forEach((el) => {
      el.innerHTML = b.splitAt > 0 ? head + '<span>' + tail + '</span>' : b.name;
    });
    $$('[data-brand-name]').forEach((el) => (el.textContent = b.name));

    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // meta / SEO
    // If brand.url is still the placeholder we use the domain the page is
    // actually served from, so the site is correct on any host straight away.
    const content = CFG.content || {};
    const origin = window.location.origin;
    document.title = content.pageTitle || (b.name + ' | ' + (content.pageTitleSuffix || 'Smart NFC Digital Cards'));
    const pageUrl = (SEO.base ? SEO.base(CFG, origin) : b.url) + '/';
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:image', SEO.abs ? SEO.abs(CFG, b.ogImage, origin) : b.ogImage);
    setMeta('property', 'og:site_name', b.name);
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:description', content.ogDescription || content.metaDescription || b.description);
    setMeta('name', 'description', content.metaDescription || b.description);
    setMeta('name', 'twitter:image', SEO.abs ? SEO.abs(CFG, b.ogImage, origin) : b.ogImage);
    setMeta('name', 'twitter:title', document.title);
    setMeta('name', 'twitter:description', content.ogDescription || content.metaDescription || b.description);
    const canon = $('link[rel="canonical"]');
    if (canon) canon.href = pageUrl;
  }

  function setMeta(attr, key, value) {
    if (!value) return;
    let el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  /* ------------------------------------------------------------------ *
   * 2. COPY — every visible string comes from site.config.js
   * ------------------------------------------------------------------
   * index.html marks editable copy with one of two attributes:
   *   data-text="content.hero.lede"     -> plain text
   *   data-html="content.hero.headline" -> text where *stars* become <em>
   * The HTML keeps its own copy as a fallback, so the page still reads
   * correctly if JavaScript is off.
   * ------------------------------------------------------------------ */
  function getPath(obj, path) {
    return String(path).split('.').reduce(function (o, k) {
      return (o == null) ? undefined : o[k];
    }, obj);
  }

  function applyContent() {
    $$('[data-text]').forEach((el) => {
      const val = getPath(CFG, el.dataset.text);
      if (val !== undefined && val !== null && val !== '') el.textContent = val;
    });
    $$('[data-html]').forEach((el) => {
      const val = getPath(CFG, el.dataset.html);
      if (val === undefined || val === null || val === '') return;
      el.innerHTML = SEO.richText ? SEO.richText(val) : String(val);
    });
    $$('[data-placeholder]').forEach((el) => {
      const val = getPath(CFG, el.dataset.placeholder);
      if (val !== undefined && val !== null && val !== '') el.setAttribute('placeholder', val);
    });

    // privacy notice paragraphs ( *bold* / **strong** / {email} / {brand} )
    const priv = $('[data-privacy]');
    const pv = CFG.content && CFG.content.privacy;
    if (priv && pv && pv.paragraphs && pv.paragraphs.length) {
      const email = CFG.brand.email || '';
      const dpo = (CFG.legal && CFG.legal.dpoEmail) || email;
      const mailto = (addr) => addr
        ? '<a href="mailto:' + addr + '" style="color:var(--brand-dark);text-decoration:underline;">' + addr + '</a>'
        : '';
      priv.innerHTML = pv.paragraphs.map((p) => {
        const obj = (p && typeof p === 'object') ? p : null;
        const text = obj ? obj.text : p;
        const style = (obj && obj.style === 'small')
          ? ' style="font-size:.8125rem;color:var(--text-faint);"' : '';
        let html = SEO.richText ? SEO.richText(text) : String(text);
        html = html.split('{email}').join(mailto(email));
        html = html.split('{dpoEmail}').join(mailto(dpo));
        html = html.split('{brand}').join(CFG.brand.name || '');
        if (obj && obj.link && obj.link.href) {
          html += ' <a href="' + obj.link.href + '" style="color:var(--brand-dark);text-decoration:underline;">'
            + (obj.link.label || 'read more') + '</a>.';
        }
        return '<p' + style + '>' + html + '</p>';
      }).join('');
    }
  }

  /* ------------------------------------------------------------------ *
   * 3. RENDER — products, choices, faq, team, footer
   * ------------------------------------------------------------------ */
  const P = CFG.pricing.products;

  function productCard(p) {
    const recurring = p.monthly
      ? '<span class="product__recurring">' + icon('refresh-cw', 15) + money(p.monthly) + ' ' + esc(p.monthlyLabel) + '</span>'
      : '';
    const badge = p.badge
      ? '<span class="product__badge">' + icon('shield-check', 15) + esc(p.badge) + '</span>'
      : '';

    const art = p.thumb || (p.faces && (p.faces.front || p.faces.back)) || '';
    const visual = art
      ? '<div class="product__media" aria-hidden="true"><img src="' + esc(art) + '" alt="" loading="lazy" width="320" height="202"></div>'
      : '<div class="product__media product__media--icon"><span class="product__icon">' + icon(p.icon, 24) + '</span></div>';

    return ''
      + '<article class="product' + (p.accent ? ' product--accent' : '') + '" data-product-card="' + p.id + '">'
      +   '<div>'
      +     visual
      +     '<h3>' + esc(p.name) + '</h3>'
      +     '<p class="product__blurb">' + esc(p.blurb) + '</p>'
      +   '</div>'
      +   '<div class="product__price-block">'
      +     '<div class="product__price">'
      +       '<span class="product__amount">' + money(p.price) + '</span>'
      +     '</div>'
      +     '<span class="product__note">' + esc(p.priceNote) + '</span>'
      +     recurring
      +     badge
      +   '</div>'
      +   '<ul class="product__features">'
      +     p.features.map((f) => '<li>' + icon('check', 16) + '<span>' + esc(f) + '</span></li>').join('')
      +   '</ul>'
      +   '<button type="button" class="btn ' + (p.monthly ? 'btn--primary' : 'btn--dark') + ' btn--block" '
      +     'data-select-product="' + p.id + '">Select ' + esc(p.shortName) + '</button>'
      + '</article>';
  }

  function choiceRow(p, isFirst) {
    const meta = money(p.price) + (p.monthly ? ' + ' + money(p.monthly) + '/mo hosting' : ' one-time');
    return ''
      + '<label class="choice">'
      +   '<span class="choice__main">'
      +     '<input class="choice__radio" type="radio" name="productChoice" value="' + p.id + '" '
      +       (isFirst ? 'checked ' : '')
      +       'data-price="' + p.price + '" data-monthly="' + (p.monthly || 0) + '">'
      +     '<span>'
      +       '<span class="choice__title">' + esc(p.name) + '</span><br>'
      +       '<span class="choice__meta">' + esc(meta) + '</span>'
      +     '</span>'
      +   '</span>'
      +   '<span class="choice__price">' + money(p.price) + '</span>'
      + '</label>';
  }

  function faqItem(item) {
    return ''
      + '<details>'
      +   '<summary>' + esc(tokens(item.q)) + icon('chevron-down', 18) + '</summary>'
      +   '<div class="faq__answer">' + esc(tokens(item.a)) + '</div>'
      + '</details>';
  }

  function memberCard(m) {
    // "low" keeps a person off the radar: no photo, no bio.
    const low = m.visibility === 'low';
    const avatar = (m.photo && !low)
      ? '<img src="' + esc(m.photo) + '" alt="" loading="lazy" width="76" height="76">'
      : esc(m.initials || '');
    return ''
      + '<article class="member">'
      +   '<div class="member__avatar' + (low ? ' member__avatar--plain' : '') + '" aria-hidden="true">' + avatar + '</div>'
      +   '<h3>' + esc(m.name) + '</h3>'
      +   '<p class="member__role">' + esc(m.role) + '</p>'
      +   (low ? '' : '<p class="member__bio">' + esc(m.bio) + '</p>')
      + '</article>';
  }

  /* ------------------------------------------------------------------ *
   * BOOKING UI — types, date, time slots
   * ------------------------------------------------------------------ */
  function bookingDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // are we open on that date? days = [1,2,3,4,5,6] means Mon–Sat
  function isOpenDay(iso) {
    const days = (CFG.booking && CFG.booking.days) || [];
    if (!days.length) return true;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return false;
    return days.indexOf(d.getDay()) !== -1;
  }

  function prettyDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function renderBookingTypes() {
    const box = $('#bookingTypes');
    if (!box) return;
    const types = (CFG.booking && CFG.booking.types) || [];
    const art = (currentProduct() || {}).thumb || '';
    box.innerHTML = types.map((t) => {
      const active = t.id === booking.type;
      const thumb = t.branding === 'custom'
        ? '<div class="btype__thumb btype__thumb--brand"><span>YOUR LOGO</span></div>'
        : '<div class="btype__thumb">' + (art ? '<img src="' + esc(art) + '" alt="" loading="lazy">' : '') + '</div>';
      return '<label class="btype' + (active ? ' is-active' : '') + '" data-type="' + esc(t.id) + '">' +
        '<input type="radio" name="bookingType" value="' + esc(t.id) + '"' + (active ? ' checked' : '') + '>' +
        thumb +
        '<div>' +
          '<div class="btype__name">' + esc(t.name) +
            (t.badge ? '<span class="btype__tag">' + esc(t.badge) + '</span>' : '') +
          '</div>' +
          '<div class="btype__note">' + esc(t.note || '') + '</div>' +
          '<div class="btype__price">' + money(t.price) +
            (t.monthly ? ' <small>+ ' + money(t.monthly) + '/mo hosting</small>' : ' <small>one-time</small>') +
          '</div>' +
          (t.branding === 'custom'
            ? '<a class="btype__link" href="#customizer">Design it in the studio →</a>'
            : '') +
        '</div>' +
      '</label>';
    }).join('');

    $$('.btype', box).forEach((card) => {
      card.addEventListener('click', () => {
        booking.type = card.dataset.type;
        $$('.btype', box).forEach((c) => c.classList.toggle('is-active', c === card));
        applyBranding(currentOffer().branding);
        setStudioModel(currentOffer().productId);
        renderFeaturePick();
        calculateTotal();
      });
    });
  }

  // ── "choose your 2 features" ───────────────────────────────────────
  // The options come from inside.featured in site.config.js, so the
  // section and the booking form always show the same list.
  function featurePickConfig() {
    const b = CFG.booking || {};
    const fp = b.featurePick || {};
    if (!fp.enabled) return null;
    const options = (CFG.inside && CFG.inside.featured) || [];
    if (!options.length) return null;
    return {
      max: typeof fp.max === 'number' ? fp.max : 2,
      label: fp.label || 'Your features',
      note: fp.note || '',
      premiumNote: fp.premiumNote || '',
      appliesTo: fp.appliesTo || [],
      options,
    };
  }

  function featurePickApplies() {
    const fp = featurePickConfig();
    if (!fp) return false;
    return fp.appliesTo.indexOf(booking.type) !== -1;
  }

  function selectedFeatures() {
    return booking.features.slice();
  }

  function renderFeaturePick() {
    const block = $('#featurePickBlock');
    const list = $('#featurePickList');
    if (!block || !list) return;
    const fp = featurePickConfig();
    if (!fp) { block.hidden = true; return; }

    block.hidden = false;
    const label = $('#featurePickLabel');
    const hint = $('#featurePickHint');
    const err = $('#featurePickError');
    if (label) label.textContent = fp.label;
    if (err) err.textContent = '';

    if (!featurePickApplies()) {
      // Premium (or any tier that includes everything) — nothing to pick.
      booking.features = [];
      if (hint) hint.textContent = fp.premiumNote;
      list.hidden = true;
      list.innerHTML = '';
      return;
    }

    list.hidden = false;
    if (hint) {
      hint.textContent = fp.note + (booking.features.length
        ? ' — ' + booking.features.length + ' of ' + fp.max + ' chosen.'
        : ' — 0 of ' + fp.max + ' chosen.');
    }
    list.innerHTML = fp.options.map((o) => {
      const on = booking.features.indexOf(o.title) !== -1;
      return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-feature="' + esc(o.title) + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="chip__icon">' + icon(o.icon || 'star', 14) + '</span>' +
        '<span class="chip__label">' + esc(o.title) + '</span>' +
        '</button>';
    }).join('');

    $$('.chip', list).forEach((chip) => {
      chip.addEventListener('click', () => {
        const title = chip.dataset.feature;
        const i = booking.features.indexOf(title);
        if (i !== -1) {
          booking.features.splice(i, 1);
        } else {
          if (booking.features.length >= fp.max) {
            const e = $('#featurePickError');
            if (e) e.textContent = 'Your Standard card includes ' + fp.max + ' features — remove one first.';
            return;
          }
          booking.features.push(title);
        }
        renderFeaturePick();
        calculateTotal();
      });
    });
  }

  // keep the 3D studio in step with the chosen booking type
  function applyBranding(brandingId) {
    design.branding = brandingId;
    const radio = $('input[name="cardBranding"][value="' + brandingId + '"]');
    if (radio && !radio.checked) radio.checked = true;
    const btn = $('[data-branding="' + brandingId + '"]');
    if (btn) btn.click();
  }

  // show a product in the 3D studio (and keep the picker in step)
  function setStudioModel(productId) {
    if (!productId) return;
    currentModel = productId;
    if (studioSetModel) studioSetModel(productId);
  }

  function renderBookingDate() {
    const input = $('#bookingDate');
    if (!input) return;
    const bk = CFG.booking || {};
    const min = new Date();
    min.setDate(min.getDate() + (bk.leadDays || 0));
    const iso = bookingDateISO(min);
    input.min = iso;
    if (!booking.date || booking.date < iso) booking.date = iso;
    input.value = booking.date;
    input.addEventListener('change', () => {
      booking.date = input.value;
      booking.slot = '';
      renderBookingSlots();
      calculateTotal();
    });
  }

  function renderBookingSlots() {
    const grid = $('#slotGrid');
    if (!grid) return;
    const bk = CFG.booking || {};
    const slots = bk.slots || [];
    const hint = $('#slotHint');
    const date = booking.date;

    if (!date) {
      grid.innerHTML = '';
      if (hint) hint.textContent = (CFG.content.form && CFG.content.form.slotEmpty) || '';
      return;
    }

    // slots already taken on this device are blocked
    const taken = {};
    readLocalOrders().forEach((b) => {
      if (b.date === date && b.slot) taken[b.slot] = (taken[b.slot] || 0) + 1;
    });
    const max = bk.maxPerSlot || 4;

    grid.innerHTML = slots.map((time) => {
      const full = (taken[time] || 0) >= max;
      return '<button type="button" class="slot' + (booking.slot === time ? ' is-active' : '') + '"' +
        ' data-slot="' + esc(time) + '"' + (full ? ' disabled' : '') + '>' +
        esc(time) + '</button>';
    }).join('');

    $$('.slot', grid).forEach((btn) => {
      btn.addEventListener('click', () => {
        booking.slot = btn.dataset.slot;
        $$('.slot', grid).forEach((b) => b.classList.toggle('is-active', b === btn));
        if (hint) hint.textContent = 'Booked for ' + prettyDate(date) + ' at ' + booking.slot + '.';
        updateSteps();
        calculateTotal();
      });
    });

    if (hint) {
      hint.textContent = booking.slot
        ? 'Booked for ' + prettyDate(date) + ' at ' + booking.slot + '.'
        : 'Pick a time for ' + prettyDate(date) + '.';
    }
  }

  // the little progress dots under the booking
  function updateSteps() {
    const details = $('#bookingStepDetails');
    const confirm = $('#bookingStepConfirm');
    const name = $('#customerName'), email = $('#customerEmail'), phone = $('#customerPhone');
    const filled = name && email && phone &&
      name.value.trim() && email.value.trim() && phone.value.trim();
    if (details) details.classList.toggle('is-done', !!filled);
    if (confirm) confirm.classList.toggle('is-active', !!(filled && booking.slot));
  }

  // ---- inside the card: what a tap opens, per tier ----
  function renderInside() {
    const cfg = CFG.inside;
    if (!cfg) return;

    const box = $('#insideCompare');
    if (box) {
      box.innerHTML = (cfg.columns || []).map((c) => {
        const p = P[c.product];
        return '<article class="inside-card' + (c.featured ? ' inside-card--featured' : '') + '"' +
            (p ? ' data-inside-product="' + esc(p.id) + '"' : '') + '>'
          + '<header class="inside-card__head">'
          +   '<h3>' + esc(c.name) + '</h3>'
          +   '<span class="inside-card__price">' + esc(tokens(c.priceLabel || '')) + '</span>'
          +   '<p class="inside-card__note">' + esc(c.note || '') + '</p>'
          + '</header>'
          + '<ul class="inside-card__list">'
          +   (c.items || []).map((i) =>
                '<li' + (i.highlight ? ' class="is-highlight"' : '') + '>' +
                '<span class="inside-card__tick">' + icon(i.highlight ? 'star' : 'check', 15) + '</span>' +
                '<span class="inside-card__text"><strong>' + esc(i.title) + '</strong>' +
                (i.text ? '<span>' + esc(i.text) + '</span>' : '') + '</span></li>').join('')
          + '</ul>'
          + (c.cta ? '<button type="button" class="btn btn--primary btn--block inside-card__cta" data-inside-pick="' +
              esc(c.product || '') + '">' + esc(c.cta) + '</button>' : '')
          + '</article>';
      }).join('');
    }

    const fb = $('#insideFeatured');
    if (fb) {
      const list = cfg.featured || [];
      const pick = (CFG.booking && CFG.booking.featurePick) || {};
      const max = typeof pick.max === 'number' ? pick.max : 2;
      fb.innerHTML =
        '<div class="inside__featured-head">'
        +   '<h3>' + esc(cfg.featuredTitle || '') + '</h3>'
        +   '<p>' + esc(cfg.featuredSub || '') + '</p>'
        + '</div>'
        + '<div class="inside__featured-rules">'
        +   '<div class="inside__rule"><span class="inside__rule-dot inside__rule-dot--std"></span>' +
              '<span><b>Standard card</b>Choose any ' + max + ' features from this list</span></div>'
        +   '<div class="inside__rule"><span class="inside__rule-dot inside__rule-dot--prm"></span>' +
              '<span><b>Premium card</b>Every feature here is included</span></div>'
        + '</div>'
        + '<div class="inside__featured-grid">'
        +   list.map((f) =>
              '<div class="inside__tile">'
              +   '<span class="inside__tile-icon">' + icon(f.icon || 'star', 20) + '</span>'
              +   '<div class="inside__tile-body">'
              +     '<strong>' + esc(f.title) + '</strong>'
              +     '<span>' + esc(f.text || '') + '</span>'
              +     '<span class="inside__pills">'
              +       '<span class="inside__pill inside__pill--std">Standard · pick ' + max + '</span>'
              +       '<span class="inside__pill inside__pill--prm">Premium · included</span>'
              +     '</span>'
              +   '</div>'
              + '</div>').join('')
        + '</div>';
    }
  }

  function renderAll() {
    const order = CFG.pricing.order;

    const grid = $('#productGrid');
    if (grid) {
      grid.innerHTML = order.map((id) => productCard(P[id])).join('');
      // a single product reads better centred than stretched across half the row
      grid.classList.toggle('is-single', order.length < 2);
    }

    const choices = $('#choiceList');
    if (choices) choices.innerHTML = order.map((id, i) => choiceRow(P[id], i === 0)).join('');

    renderInside();

    const faq = $('#faqList');
    if (faq) faq.innerHTML = CFG.faq.map(faqItem).join('');

    const team = $('#teamGrid');
    if (team) {
      team.innerHTML = CFG.team
        .filter((m) => m.visibility !== 'hide')
        .map(memberCard)
        .join('');
    }

    // ---- order form: branding, delivery, payment, add-ons ----
    const bOptions = (CFG.customizer.branding && CFG.customizer.branding.options) || [];
    const bList = $('#brandingList');
    if (bList) {
      bList.innerHTML = bOptions.map((o, i) =>
        '<label class="choice choice--small">' +
          '<span class="choice__main">' +
            '<input class="choice__radio" type="radio" name="cardBranding" value="' + esc(o.id) + '"' +
              (design.branding === o.id ? ' checked' : '') + '>' +
            '<span><span class="choice__title">' + esc(o.label) + '</span><br>' +
            '<span class="choice__meta">' + esc(o.note || '') + '</span></span>' +
          '</span>' +
        '</label>'
      ).join('');
      const bChoice = $('#brandingChoice');
      if (bChoice) bChoice.hidden = bOptions.length < 2;
    }

    const zoneSel = $('#shippingZone');
    const zones = (CFG.pricing.shipping && CFG.pricing.shipping.zones) || [];
    if (zoneSel) {
      zoneSel.innerHTML = zones.map((z, i) =>
        '<option value="' + esc(z.id) + '"' + (i === 0 ? ' selected' : '') + '>' +
        esc(z.label) + ' — ' + money(z.fee) + '</option>'
      ).join('');
    }
    const shipNote = $('#shippingNote');
    if (shipNote) shipNote.textContent = (CFG.pricing.shipping && CFG.pricing.shipping.note) || '';

    const paySel = $('#paymentMethod');
    const methods = (CFG.pricing.payment && CFG.pricing.payment.methods) || [];
    if (paySel) {
      paySel.innerHTML = methods.map((m) =>
        '<option value="' + esc(m.id) + '"' + (m.id === (CFG.pricing.payment.default || methods[0].id) ? ' selected' : '') + '>' +
        esc(m.label) + '</option>'
      ).join('');
    }

    const addOnList = $('#addOnsList');
    const addOns = bookingAddOns();
    if (addOnList) {
      addOnList.innerHTML = addOns.map((a) =>
        '<label class="choice choice--small">' +
          '<span class="choice__main">' +
            '<input class="choice__check" type="checkbox" value="' + esc(a.id) + '"' +
              ' data-price="' + Number(a.price || 0) + '"' +
              ' data-label="' + esc(a.label) + '"' +
              (a.price === 0 ? ' checked disabled' : '') + '>' +
            '<span><span class="choice__title">' + esc(a.label) + '</span><br>' +
            '<span class="choice__meta">' + esc(a.note || '') + '</span></span>' +
          '</span>' +
          '<span class="choice__price">' + (a.price ? money(a.price) : 'Free') + '</span>' +
        '</label>'
      ).join('');
    }

    // ---- booking: types, slots, location notes ----
    renderBookingTypes();
    renderFeaturePick();
    renderBookingDate();
    renderBookingSlots();
    const bk = CFG.booking || {};
    const loc = $('#bookingLocation');
    if (loc) loc.textContent = (bk.location && bk.location.label) || '';
    const locNote = $('#bookingLocationNote');
    if (locNote) locNote.textContent = (bk.location && bk.location.note) || '';
    const bring = $('#bookingBring');
    if (bring) bring.textContent = (bk.bringNote ? 'Bring: ' + bk.bringNote : '');
    const confirmNote = $('#bookingConfirmNote');
    if (confirmNote) confirmNote.textContent = bk.confirmationNote || '';
    const reschedNote = $('#bookingRescheduleNote');
    if (reschedNote) reschedNote.textContent = bk.rescheduleNote || '';
    const cancelNote = $('#bookingCancelNote');
    if (cancelNote) cancelNote.textContent = bk.cancelledNote || '';
    const durNote = $('#bookingDuration');
    if (durNote) {
      durNote.textContent = bk.durationMinutes
        ? 'Each appointment is about ' + bk.durationMinutes + ' minutes.'
        : '';
    }
    const payNote = $('#paymentNote');
    if (payNote) payNote.textContent = (CFG.content && CFG.content.form && CFG.content.form.noPaymentNote) || '';

    // ---- delivery + support sections ----
    const steps = $('#deliverySteps');
    if (steps) {
      const dl = CFG.content.delivery || {};
      steps.innerHTML = (dl.steps || []).map((s2) =>
        '<li><div><h4>' + esc(s2.title) + '</h4><p>' + esc(s2.text) + '</p></div></li>'
      ).join('');
    }
    const dInfo = $('#deliveryInfo');
    if (dInfo) {
      const dl = CFG.content.delivery || {};
      dInfo.innerHTML =
        '<div class="delivery-card"><h4>Metro Manila</h4><strong>' + esc(dl.timelineMetro || '') + '</strong>' +
          '<p>' + esc((zones.find((z) => z.id === 'metro') || {}).label || '') + ' delivery</p></div>' +
        '<div class="delivery-card"><h4>Provincial</h4><strong>' + esc(dl.timelineProvince || '') + '</strong>' +
          '<p>' + esc((zones.find((z) => z.id !== 'metro') || {}).label || '') + ' delivery</p></div>' +
        '<div class="delivery-card"><h4>Pick-up</h4><strong>By appointment</strong><p>' + esc(dl.pickupNote || '') + '</p></div>';
    }

    const sGrid = $('#supportGrid');
    if (sGrid) {
      const sp = CFG.content.support || {};
      sGrid.innerHTML = (sp.channels || []).map((c) => {
        const href = c.id === 'email' ? 'mailto:' + c.value
          : c.id === 'phone' ? 'tel:' + String(c.value).replace(/[^\d+]/g, '')
          : c.value.indexOf('@') === 0 ? '' : 'https://' + String(c.value).replace('@', '').replace(/^https:\/\//, '');
        const text = c.id === 'phone' ? c.value : c.value;
        return '<div class="support-card"><h4>' + esc(c.label) + '</h4>' +
          (href ? '<a href="' + esc(href) + '">' + esc(text) + '</a>' : '<span>' + esc(text) + '</span>') +
          '<p>' + esc(c.note || '') + '</p></div>';
      }).join('');
    }
    const sNote = $('#supportNote');
    if (sNote) sNote.textContent = (CFG.content.support && CFG.content.support.ticketNote) || '';

    const mt = $('#modelToggle');
    if (mt) {
      mt.innerHTML = order.map((id, i) =>
        '<button type="button" data-model="' + id + '" aria-pressed="' + (i === 0) + '">' +
        esc(P[id].shortName) + '</button>'
      ).join('');
      // with a single product there is nothing to choose — hide the picker
      const single = order.length < 2;
      mt.hidden = single;
      const mLabel = $('#modelLabel');
      if (mLabel) mLabel.hidden = single;
      const mWrap = mLabel && mLabel.parentElement;
      if (mWrap) mWrap.hidden = single;
    }

    // footer + notes
    const blurb = $('#footerBlurb');
    if (blurb) blurb.textContent = (CFG.content && CFG.content.footer && CFG.content.footer.blurb) || CFG.brand.description;

    const note = $('#paymentNote');
    if (note) note.textContent = CFG.order.paymentNote;

    const pn = $('#privacyNote');
    if (pn) pn.textContent = CFG.order.privacyNote;

    const pe = $('#privacyEmail');
    if (pe) { pe.textContent = CFG.brand.email; pe.href = 'mailto:' + CFG.brand.email; }

    const contact = $('#footerContact');
    if (contact) {
      const rows = [];
      if (CFG.brand.email) rows.push('<li><a href="mailto:' + esc(CFG.brand.email) + '">' + esc(CFG.brand.email) + '</a></li>');
      if (CFG.brand.phone) rows.push('<li><a href="tel:' + esc(telHref(CFG.brand.phone)) + '">' + esc(CFG.brand.phone) + '</a></li>');
      if (CFG.brand.address) rows.push('<li>' + esc(CFG.brand.address) + '</li>');
      Object.keys(CFG.brand.socials || {}).forEach((k) => {
        const url = CFG.brand.socials[k];
        if (!url) return;
        rows.push('<li><a href="' + esc(url) + '" rel="noopener noreferrer" target="_blank">' +
          esc(socialLabel(k, url)) + '</a></li>');
      });
      contact.innerHTML = rows.join('');
    }

    // optional sections
    if (CFG.features.showTeam === false) $('#team') && $('#team').remove();
    if (CFG.features.showFaq === false) $('#faq') && $('#faq').remove();
    if (CFG.features.showCustomizer === false) $('#customizer') && $('#customizer').remove();
  }

  // "09623017609" -> "+639623017609" (for tel: links and schema.org)
  function telHref(phone) {
    return SEO.telHref ? SEO.telHref(phone) : phone;
  }

  // show the handle instead of just the platform name
  function socialLabel(key, url) {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    try {
      const path = new URL(url, 'https://x.test').pathname.replace(/\/+$/, '');
      const handle = path.split('/').filter(Boolean).pop();
      if (handle && !/^(sharer|share|home|explore|reel)$/i.test(handle)) {
        return name === 'Instagram' || name === 'Tiktok' ? '@' + handle : name + ' — ' + handle;
      }
    } catch (e) { /* fall through to the plain name */ }
    return name;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // {card} {hosting} → live prices, so copy can never drift
  function tokens(str) {
    return SEO.tokens ? SEO.tokens(CFG, str) : String(str);
  }

  /* ------------------------------------------------------------------ *
   * 4. PRICING + BOOKING
   * ------------------------------------------------------------------ */
  let qty = 1;

  // the state of the booking the visitor is putting together
  const booking = {
    type: (CFG.booking && CFG.booking.types && CFG.booking.types[0] && CFG.booking.types[0].id) || 'standard',
    date: '',
    slot: '',
    promo: null,      // { code, label, type, value }
    features: [],     // the features the customer picked (Standard card: 2)
  };

  function currentProduct() {
    return P[CFG.pricing.order[0]] || P[Object.keys(P)[0]];
  }

  // the offer the visitor picked: a booking type, priced on its own terms
  function currentOffer() {
    const types = (CFG.booking && CFG.booking.types) || [];
    const t = types.find((x) => x.id === booking.type) || types[0] || {};
    const p = P[t.product] || currentProduct();
    return {
      id: t.id || p.id,
      product: p,
      productId: p.id,
      branding: t.branding || 'standard',
      name: t.name || p.name,
      note: t.note || p.blurb,
      price: typeof t.price === 'number' ? t.price : p.price,
      monthly: typeof t.monthly === 'number' ? t.monthly : (p.monthly || 0),
    };
  }

  // the booking type that belongs to a product (used when the visitor picks a
  // card on the pricing grid or flips the card in the studio)
  function typeForProduct(productId) {
    const types = (CFG.booking && CFG.booking.types) || [];
    return types.find((t) => t.product === productId) || null;
  }

  // ---- promo codes ----
  function findPromo(code) {
    const list = (CFG.promo && CFG.promo.codes) || [];
    const wanted = String(code || '').trim().toUpperCase();
    if (!wanted) return null;
    return list.find((c) => String(c.code).toUpperCase() === wanted) || null;
  }

  function promoAmount(subtotal) {
    const c = booking.promo;
    if (!c) return 0;
    if (c.type === 'fixed') return Math.min(c.value || 0, subtotal);
    return Math.round(subtotal * (c.value || 0) / 100);
  }

  function bulkDiscount(subtotal) {
    const b = CFG.pricing.bulk;
    if (!b || !b.enabled) return 0;
    let pct = 0;
    b.tiers.forEach((t) => { if (qty >= t.minQty) pct = Math.max(pct, t.percent); });
    return Math.round(subtotal * pct / 100);
  }

  function shippingFee() {
    const s = CFG.pricing.shipping;
    if (!s || s.enabled === false) return 0;
    const sel = $('#shippingZone');
    const wanted = (sel && sel.value) || ((s.zones || [])[0] || {}).id;
    const z = (s.zones || []).find((x) => x.id === wanted);
    return z ? (z.fee || 0) : 0;
  }

  function paymentMethodId() {
    const sel = $('#paymentMethod');
    return (sel && sel.value) || (CFG.pricing.payment && CFG.pricing.payment.default) || '';
  }

  function selectedAddOns() {
    return $$('#addOnsList input[type=checkbox]:checked')
      .map((el) => (CFG.pricing.addOns || []).find((a) => a.id === el.value))
      .filter(Boolean)
      .map((a) => ({ id: a.id, label: a.label, price: a.price }));
  }

  // the add-on list for the booking form (some add-ons are online-only)
  function bookingAddOns() {
    return (CFG.pricing.addOns || []).filter((a) => !a.hideInBooking);
  }

  function renderSummaryRows(t) {
    const box = $('#summaryRows');
    if (!box) return;
    const rows = [];
    const add = (label, value, cls) => rows.push(
      '<div class="summary__row ' + (cls || '') + '"><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>');

    add('Subtotal (' + t.qty + ' × ' + money(t.offer.price) + ')', money(t.subtotal));
    if (t.discount) add('Bulk discount', '-' + money(t.discount));
    if (t.promo) add(t.promo.label || ('Promo ' + t.promo.code), '-' + money(t.promoAmount));
    t.addOns.forEach((a) => add(a.label, a.price ? money(a.price) : 'Included'));
    if (t.features && t.features.length) add('Features', esc(t.features.join(', ')));
    if (t.shipping) add('Delivery — ' + (shippingLabel() || 'shipping'), money(t.shipping));
    if (t.cod) add('Cash-on-delivery fee', money(t.cod));
    if (t.balance) add('Due today (deposit)', money(t.deposit));
    if (t.balance) add('Balance on the day', money(t.balance));

    const hosting = t.offer.monthly ? t.offer.monthly * t.qty : 0;
    if (hosting) {
      rows.push('<div class="summary__row summary__row--muted"><dt>Recurring</dt><dd>' + money(hosting) + ' / month hosting</dd></div>');
    }
    box.innerHTML = rows.join('');
  }

  // the item line at the top of the summary panel
  function renderSummaryItems(t) {
    const box = $('#summaryItems');
    if (!box) return;
    const art = (t.offer.product && t.offer.product.thumb) || '';
    box.innerHTML =
      '<div class="summary__item">' +
        '<div class="summary__thumb">' + (art ? '<img src="' + esc(art) + '" alt="" loading="lazy">' : '') + '</div>' +
        '<div><div class="summary__name">' + esc(t.offer.name) + '</div>' +
          '<div class="summary__meta">' + esc(t.offer.note || '') + '</div>' +
          '<div class="summary__meta">Quantity ' + t.qty + ' × ' + money(t.offer.price) + '</div></div>' +
        '<div class="summary__price">' + money(t.offer.price * t.qty) + '</div>' +
      '</div>';
  }

  function shippingLabel() {
    const s = CFG.pricing.shipping;
    const sel = $('#shippingZone');
    const wanted = (sel && sel.value) || ((s && s.zones && s.zones[0]) || {}).id;
    const z = ((s && s.zones) || []).find((x) => x.id === wanted);
    return z ? z.label : '';
  }

  function calculateTotal() {
    const offer = currentOffer();
    const p = offer.product;
    const subtotal = offer.price * qty;
    const discount = bulkDiscount(subtotal);
    const promo = booking.promo;
    const promoOff = promoAmount(subtotal - discount);
    const addOns = selectedAddOns();
    const addOnTotal = addOns.reduce((sum, a) => sum + (a.price || 0), 0);
    const shipping = shippingFee();
    const cod = paymentMethodId() === 'cod' ? ((CFG.pricing.payment && CFG.pricing.payment.codFee) || 0) : 0;
    const total = subtotal - discount - promoOff + addOnTotal + shipping + cod;

    // a deposit means only part is due today
    const depositPct = (CFG.booking && CFG.booking.depositPercent) || 0;
    const deposit = depositPct ? Math.round(total * depositPct / 100) : total;
    const balance = total - deposit;

    const totalEl = $('#displayTotal');
    if (totalEl) totalEl.textContent = money(deposit);

    const hostEl = $('#displayHosting');
    if (hostEl) {
      if (offer.monthly) {
        hostEl.hidden = false;
        hostEl.textContent = '+ ' + money(offer.monthly * qty) + ' / month hosting';
      } else {
        hostEl.hidden = true;
      }
    }

    const cta = $('#bookingCtaTotal');
    if (cta) cta.textContent = money(deposit);

    // mirror selection onto the product cards — single source of truth
    $$('[data-product-card]').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.productCard === p.id);
    });

    const t = {
      p, offer, qty, subtotal, discount, promo, promoAmount: promoOff,
      addOns, addOnTotal, shipping, cod, total, deposit, balance,
      features: selectedFeatures(),
    };
    renderSummaryRows(t);
    renderSummaryItems(t);
    renderBookingStatus(t);

    return t;
  }

  // the little line under "Complete your booking"
  function renderBookingStatus(t) {
    const el = $('#bookingStatus');
    if (!el) return;
    const bits = [];
    bits.push(t.qty + ' card' + (t.qty > 1 ? 's' : ''));
    bits.push(t.offer.name);
    if (booking.date) {
      bits.push(booking.date + (booking.slot ? ' at ' + booking.slot : ''));
    }
    el.textContent = 'Booking status · ' + bits.join(' · ');
  }

  function selectProduct(id) {
    setStudioModel(id);
    // move the booking to the option that matches the card they just picked
    const t = typeForProduct(id);
    if (t) {
      booking.type = t.id;
      $$('.btype').forEach((c) => c.classList.toggle('is-active', c.dataset.type === t.id));
      applyBranding(t.branding || 'standard');
    }
    renderFeaturePick();
    calculateTotal();
    const form = $('#preorder');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setQty(n) {
    qty = Math.min(999, Math.max(1, n | 0));
    const input = $('#orderQty');
    if (input) input.value = qty;
    calculateTotal();
  }

  /* ------------------------------------------------------------------ *
   * 5. MOBILE NAV
   * ------------------------------------------------------------------ */
  function initNav() {
    const toggle = $('#navToggle');
    const drawer = $('#mobileDrawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.classList.toggle('is-open', open);
      drawer.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 900) setOpen(false); });
  }

  /* ------------------------------------------------------------------ *
   * 6. 3D ENGINE
   *    - artwork drawn onto the model with a CanvasTexture
   *    - custom drag rotate (no OrbitControls → no page-scroll hijack)
   *    - pauses off-screen, respects prefers-reduced-motion
   *    - SVG fallback when WebGL is unavailable
   * ------------------------------------------------------------------ */
  const viewers = [];
  // set by init3D so the booking panel can swap the card in the studio
  let studioSetModel = null;
  let currentColor = CFG.brand.colors.brand;
  let currentModel = CFG.pricing.order[0];

  // --- customisation state (studio controls ↔ 3D texture ↔ order form) ---
  const design = {
    branding: (CFG.customizer.branding && CFG.customizer.branding.default) || 'standard',
    finish: CFG.customizer.defaultFinish || 'matte',
    gradient: CFG.customizer.defaultGradient || 'brand',
    colour: '',
    logo: null,
    logoName: '',
  };

  // --- texture sources ---------------------------------------------------
  // Products with a `faces` entry use the real printed artwork; everything
  // else falls back to a generated gradient design.
  const textureCache = {};

  function loadImage(src) {
    if (!textureCache[src]) {
      textureCache[src] = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not load ' + src));
        img.src = src;
      });
    }
    return textureCache[src];
  }

  function hasFaces(model) {
    return !!(model && model.faces && (model.faces.front || model.faces.back));
  }

  // Draws the printed artwork onto a card-aspect canvas, optionally overlaying
  // the customer's name in a blank region of the face.
  function faceCanvas(img, name, model, allowName) {
    const ar = (model.model3d.w / model.model3d.h) || 1.586;
    const W = 1040, H = Math.round(W / ar);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = '#f7f8f9';
    g.fillRect(0, 0, W, H);

    // cover-fit the artwork so it fills the face without distortion
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

    if (allowName && name && CFG.customizer.drawNameOverArtwork !== false) {
      const label = name.toUpperCase();
      let size = H * 0.15;
      const maxW = W * 0.5;
      g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
      while (g.measureText(label).width > maxW && size > H * 0.05) {
        size *= 0.93;
        g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
      }
      g.fillStyle = CFG.brand.colors.brand;
      g.textBaseline = 'middle';
      g.fillText(label, W * 0.07, H * 0.44);
    }
    return c;
  }

  // A card face drawn from the customer's own choices: background colour or
  // gradient, their uploaded logo and their name.
  function isLightColour(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ''));
    if (!m) return true;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 165;
  }

  function customFaceCanvas(model, opts, name, isBack) {
    const ar = (model.model3d.w / model.model3d.h) || 1.586;
    const W = 1040, H = Math.round(W / ar);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    const grads = CFG.customizer.gradients || [];
    const gr = grads.find((x) => x.id === opts.gradient) || grads[0] || { from: '#0881ef', to: '#0668bf' };

    let fill;
    if (opts.colour) {
      fill = opts.colour;
    } else {
      const lg = g.createLinearGradient(0, 0, W, H);
      lg.addColorStop(0, gr.from);
      lg.addColorStop(1, gr.to);
      fill = lg;
    }
    g.fillStyle = fill;
    g.fillRect(0, 0, W, H);

    // soft sheen
    const rad = g.createRadialGradient(W * .22, H * .08, 0, W * .22, H * .08, W * .95);
    rad.addColorStop(0, 'rgba(255,255,255,.28)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, W, H);

    const light = isLightColour(opts.colour || gr.from);
    const ink = light ? '#0a0f1d' : '#ffffff';
    const inkSoft = light ? 'rgba(10,15,29,.55)' : 'rgba(255,255,255,.62)';

    // NFC signal mark, top-right
    g.strokeStyle = inkSoft;
    g.lineWidth = W * 0.013;
    g.lineCap = 'round';
    const ax = W * .84, ay = H * .16;
    [0.045, 0.075, 0.105].forEach((r) => {
      g.beginPath();
      g.arc(ax, ay, W * r, Math.PI * 0.62, Math.PI * 1.16);
      g.stroke();
    });

    // their logo
    if (opts.logo && opts.logo.complete && opts.logo.naturalWidth) {
      const maxW = W * 0.40, maxH = H * 0.40;
      const sc = Math.min(maxW / opts.logo.naturalWidth, maxH / opts.logo.naturalHeight);
      const lw = opts.logo.naturalWidth * sc, lh = opts.logo.naturalHeight * sc;
      g.drawImage(opts.logo, (W - lw) / 2, isBack ? H * 0.16 : H * 0.20, lw, lh);
    }

    // their name
    const label = (name || '').toUpperCase();
    if (label) {
      let size = H * 0.15;
      g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
      while (g.measureText(label).width > W * 0.76 && size > H * 0.05) {
        size *= 0.93;
        g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
      }
      g.fillStyle = ink;
      g.textBaseline = 'middle';
      g.fillText(label, W * 0.12, isBack ? H * 0.74 : H * 0.68);
    }
    return c;
  }

  function artworkTexture(name, hex, model) {
    const portrait = model.model3d.h > model.model3d.w;
    const W = 1024, H = portrait ? Math.round(W / (model.model3d.w / model.model3d.h)) : Math.round(W / (model.model3d.w / model.model3d.h));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');

    // base gradient
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, hex);
    grad.addColorStop(1, shade(hex, -22));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // soft light
    const rad = g.createRadialGradient(W * .25, H * .15, 0, W * .25, H * .15, W * .9);
    rad.addColorStop(0, 'rgba(255,255,255,.35)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, W, H);

    // NFC arcs, top-right
    g.strokeStyle = 'rgba(255,255,255,.85)';
    g.lineWidth = W * 0.012;
    g.lineCap = 'round';
    const ax = W * .84, ay = H * .2;
    [0.05, 0.085, 0.12].forEach((r) => {
      g.globalAlpha = 0.9;
      g.beginPath();
      g.arc(ax, ay, W * r, Math.PI * 0.55, Math.PI * 1.05);
      g.stroke();
    });
    g.globalAlpha = 1;

    // chip
    const cw = portrait ? W * .26 : W * .13, ch = cw * 0.72;
    const cx = W * .08, cy = H - ch - H * .12;
    g.fillStyle = 'rgba(255,255,255,.28)';
    roundRect(g, cx, cy, cw, ch, W * 0.012);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.lineWidth = W * 0.004;
    g.beginPath();
    g.moveTo(cx, cy + ch / 2); g.lineTo(cx + cw, cy + ch / 2);
    g.moveTo(cx + cw / 2, cy); g.lineTo(cx + cw / 2, cy + ch);
    g.stroke();

    // brand line
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.font = '600 ' + Math.round(W * 0.035) + 'px Outfit, Inter, system-ui, sans-serif';
    g.textBaseline = 'top';
    g.fillText(CFG.customizer.modelText.line1, W * .08, H * .1);

    // the custom name — auto-shrinks to fit
    const label = (name || '').toUpperCase();
    let size = portrait ? W * 0.11 : W * 0.105;
    const maxW = W * 0.84;
    g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
    while (g.measureText(label).width > maxW && size > W * 0.03) {
      size *= 0.94;
      g.font = '800 ' + Math.round(size) + 'px Outfit, Inter, system-ui, sans-serif';
    }
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    g.fillText(label, W * .08, H * 0.58);

    // tagline
    g.fillStyle = 'rgba(255,255,255,.6)';
    g.font = '500 ' + Math.round(W * 0.028) + 'px Inter, system-ui, sans-serif';
    g.fillText(CFG.customizer.modelText.line2, W * .08, H * 0.58 + size * 0.95);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function shade(hex, percent) {
    const n = parseInt(hex.replace('#', ''), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    const f = 1 + percent / 100;
    r = Math.min(255, Math.round(r * f));
    gg = Math.min(255, Math.round(gg * f));
    b = Math.min(255, Math.round(b * f));
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  function buildViewer(container, opts) {
    if (!container) return null;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, opts.cameraZ || 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;   // textures are sRGB too
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    // keep the total light below 1.0 so printed artwork doesn't blow out
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 0.78);
    key.position.set(4, 6, 6); scene.add(key);
    const fill = new THREE.DirectionalLight(0xcfe3ff, 0.22);
    fill.position.set(-6, -2, 2); scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    // soft contact shadow so the card reads as a physical object
    function shadowTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(128, 128, 4, 128, 128, 126);
      grd.addColorStop(0, 'rgba(15,23,42,0.42)');
      grd.addColorStop(0.45, 'rgba(15,23,42,0.20)');
      grd.addColorStop(1, 'rgba(15,23,42,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c);
      t.needsUpdate = true;
      return t;
    }
    let shadow = null;

    let mesh = null;
    let texture = null;
    let textures = [];

    function disposeMesh() {
      if (!mesh) return;
      group.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material.dispose();
      textures.forEach((t) => t.dispose());
      textures = [];
      if (texture) { texture.dispose(); texture = null; }
    }

    let buildToken = 0;

    function build(modelId, name, hex, side, opts) {
      const model = P[modelId] || P[CFG.pricing.order[0]];
      const custom = opts || design;
      const token = ++buildToken;
      disposeMesh();

      const d = model.model3d;
      const geo = new THREE.BoxGeometry(d.w, d.h, d.d, 1, 1, 1);

      // the cut edge of the product — a white PVC card edge by default,
      // configurable per product with `edge`
      const sideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(model.edge || shade(hex, -28)),
        roughness: 0.45, metalness: model.edge ? 0.05 : 0.25,
      });
      // the surface finish the customer picked (matte / gloss / metallic)
      const finishes = CFG.customizer.finishes || [];
      const fin = finishes.find((f) => f.id === custom.finish) || finishes[0] || { roughness: 0.62, metalness: 0.05 };
      const faceMat = new THREE.MeshStandardMaterial({ roughness: fin.roughness, metalness: fin.metalness });
      const backMat = new THREE.MeshStandardMaterial({ roughness: fin.roughness, metalness: fin.metalness });

      // placeholder while any artwork loads
      faceMat.color = new THREE.Color(hex);
      backMat.color = new THREE.Color(shade(hex, -18));

      // BoxGeometry face order: +x, -x, +y, -y, +z, -z
      const mats = [sideMat, sideMat, sideMat, sideMat, faceMat, backMat];

      mesh = new THREE.Mesh(geo, mats);
      group.add(mesh);

      if (!shadow) {
        shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.renderOrder = -1;
        scene.add(shadow);
      }
      shadow.scale.set(d.w * 2.1, d.d * 9 + 1.2, 1);
      shadow.position.set(0, -d.h / 2 - 0.28, 0.12);

      // ---- a card built from the customer's own branding ----
      if (custom.branding === 'custom' && model.branding !== false) {
        const mkTex = (isBack) => {
          const cv = customFaceCanvas(model, custom, name, isBack);
          const tex = new THREE.CanvasTexture(cv);
          tex.anisotropy = 4;
          tex.encoding = THREE.sRGBEncoding;
          tex.needsUpdate = true;
          textures.push(tex);
          return tex;
        };
        faceMat.map = mkTex(false);
        faceMat.color = new THREE.Color(0xffffff);
        faceMat.needsUpdate = true;
        backMat.map = mkTex(true);
        backMat.color = new THREE.Color(0xffffff);
        backMat.needsUpdate = true;
        requestRender();

      // ---- swap in the real printed artwork when it is ready ----
      } else if (hasFaces(model)) {
        const frontSrc = model.faces.front;
        const backSrc = model.faces.back;
        const one = (src, kind) => (src ? loadImage(src).then((img) => ({ img, kind })).catch(() => null) : Promise.resolve(null));
        Promise.all([one(frontSrc, 'front'), one(backSrc, 'back')]).then((res) => {
          if (token !== buildToken || !mesh) return;   // a newer build superseded this
          const byKind = {};
          res.forEach((r) => { if (r) byKind[r.kind] = r.img; });

          // the face pointing at the camera is +z
          const showFront = side !== 'back';
          const visible = (showFront ? byKind.front : byKind.back) || (showFront ? byKind.back : byKind.front);
          const hidden = showFront ? byKind.back : byKind.front;

          if (visible) {
            const cv = faceCanvas(visible, name, model, showFront);
            const tex = new THREE.CanvasTexture(cv);
            tex.anisotropy = 4;
            tex.encoding = THREE.sRGBEncoding;
            tex.needsUpdate = true;
            faceMat.map = tex;
            faceMat.color = new THREE.Color(0xffffff);
            faceMat.roughness = fin.roughness;
            faceMat.metalness = 0.0;
            faceMat.needsUpdate = true;
            textures.push(tex);
          }
          if (hidden) {
            const cv = faceCanvas(hidden, '', model, false);
            const tex = new THREE.CanvasTexture(cv);
            tex.anisotropy = 4;
            tex.encoding = THREE.sRGBEncoding;
            tex.needsUpdate = true;
            backMat.map = tex;
            backMat.color = new THREE.Color(0xffffff);
            backMat.roughness = fin.roughness;
            backMat.metalness = 0.0;
            backMat.needsUpdate = true;
            textures.push(tex);
          }
          requestRender();
        });
      } else {
        texture = artworkTexture(name, hex, model);
        if (texture) texture.encoding = THREE.sRGBEncoding;
        faceMat.map = texture;
        faceMat.color = new THREE.Color(0xffffff);
        faceMat.needsUpdate = true;
        backMat.color = new THREE.Color(shade(hex, -18));
        backMat.needsUpdate = true;
      }

      // fit the model to the viewport with a little breathing room
      const aspect = (container.clientWidth || 1) / (container.clientHeight || 1);
      // frame the card with a little breathing room
      const fitH = d.h * 1.28;
      const fitW = (d.w * 1.28) / Math.max(aspect, 0.55);
      camera.position.z = opts.cameraZ || Math.max(fitH, fitW, 4.2);
      resize();
      requestRender();
    }

    // ---- drag to rotate (replaces OrbitControls) ----
    let rotX = -0.06, rotY = -0.28;
    let swayPhase = 0, idleOffset = 0;
    let dragging = false, lastX = 0, lastY = 0, moved = false;
    let idleTimer = 0;

    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-y';

    el.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      lastX = e.clientX; lastY = e.clientY;
      rotY += dx * 0.008;
      rotX = Math.max(-0.8, Math.min(0.8, rotX + dy * 0.006));
      requestRender();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointerleave', endDrag);

    // keyboard rotation for accessibility
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'application');
    el.setAttribute('aria-label', opts.ariaLabel || '3D product preview — use arrow keys to rotate');
    el.addEventListener('keydown', (e) => {
      const step = 0.14;
      if (e.key === 'ArrowLeft')  { rotY -= step; requestRender(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { rotY += step; requestRender(); e.preventDefault(); }
      if (e.key === 'ArrowUp')    { rotX = Math.max(-0.8, rotX - step); requestRender(); e.preventDefault(); }
      if (e.key === 'ArrowDown')  { rotX = Math.min(0.8, rotX + step); requestRender(); e.preventDefault(); }
    });

    // ---- render-loop state (declared before resize() can call requestRender) ----
    let visible = true;
    let rafId = 0;
    let needsFrame = true;
    let lastTime = 0;

    // ---- sizing ----
    function resize() {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      requestRender();
    }
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    // ---- render loop, only when it matters ----
    function requestRender() { needsFrame = true; if (!rafId && visible) rafId = requestAnimationFrame(loop); }

    function loop(t) {
      rafId = 0;
      if (!visible) return;

      const reduced = reduceMotion.matches;
      const fpsCap = reduced ? (CFG.features.reducedMotionCap || 30) : 0;
      if (fpsCap && lastTime && (t - lastTime) < 1000 / fpsCap) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      lastTime = t;

      // gentle idle sway, only when allowed and untouched.
      // (a full spin would turn the printed artwork edge-on and unreadable)
      if (opts.idleSpin && !dragging && !reduced) {
        swayPhase += 0.014;
        idleOffset = Math.sin(swayPhase) * 0.26;
        needsFrame = true;
      } else {
        idleOffset *= 0.94;
      }

      group.rotation.x += (rotX - group.rotation.x) * 0.15;
      group.rotation.y += ((rotY + idleOffset) - group.rotation.y) * 0.15;

      renderer.render(scene, camera);

      if (needsFrame || (opts.idleSpin && !reduced) || dragging) {
        needsFrame = false;
        rafId = requestAnimationFrame(loop);
      }
    }

    if (window.IntersectionObserver && CFG.features.pause3dOffscreen !== false) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible) requestRender();
          else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        });
      }, { rootMargin: '120px' }).observe(container);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
      else requestRender();
    });

    reduceMotion.addEventListener && reduceMotion.addEventListener('change', requestRender);

    return {
      build, resize, requestRender,
      dispose() { if (ro) ro.disconnect(); if (rafId) cancelAnimationFrame(rafId); disposeMesh(); renderer.dispose(); },
      container,
    };
  }

  /* ---- SVG fallback for devices without WebGL ---- */
  // Static fallback for browsers without WebGL. It shows the real printed
  // artwork only — no drawn-over text or decorative placeholder.
  function svgMockup(name, hex, modelId, side) {
    const model = P[modelId] || P[CFG.pricing.order[0]];
    const portrait = model.model3d.h > model.model3d.w;
    const w = portrait ? 200 : 320, h = portrait ? 260 : 200;
    const faces = model.faces || {};
    const art = (side === 'back' ? (faces.back || faces.front) : (faces.front || faces.back)) || model.thumb;
    if (art) {
      const iw = w - 20, ih = h - 20;
      return ''
        + '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" '
        + 'aria-label="' + esc(model.name) + '">'
        +   '<defs><clipPath id="ck"><rect x="10" y="10" width="' + iw + '" height="' + ih + '" rx="14"/></clipPath></defs>'
        +   '<rect x="10" y="10" width="' + iw + '" height="' + ih + '" rx="14" fill="#f7f8f9"/>'
        +   '<image href="' + esc(art) + '" x="10" y="10" width="' + iw + '" height="' + ih + '" '
        +     'preserveAspectRatio="xMidYMid slice" clip-path="url(#ck)"/>'
        +   '<rect x="10" y="10" width="' + iw + '" height="' + ih + '" rx="14" fill="none" stroke="rgba(15,23,42,.12)"/>'
        + '</svg>';
    }

    // no artwork for this product yet -> show the brand mark on a plain card
    return ''
      + '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" '
      + 'aria-label="' + esc(model.name) + '">'
      +   '<rect x="10" y="10" width="' + (w - 20) + '" height="' + (h - 20) + '" rx="14" fill="#ffffff" '
      +     'stroke="rgba(15,23,42,.12)"/>'
      +   '<image href="assets/logo-frog.svg" x="' + (w / 2 - 34) + '" y="' + (h / 2 - 31) + '" width="68" height="61" '
      +     'preserveAspectRatio="xMidYMid meet"/>'
      + '</svg>';
  }

  function renderFallbacks(name, hex, modelId, side) {
    $$('[data-fallback]').forEach((el) => { el.innerHTML = svgMockup(name, hex, modelId, side); });
  }

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // The controls in the 3D studio: branding, colours, gradient, finish and
  // the customer's own logo. Every change re-renders the 3D preview.
  function initStudioControls(onChange) {
    const bOptions = (CFG.customizer.branding && CFG.customizer.branding.options) || [];
    const bt = $('#brandingToggle');
    const customBlock = $('#customBlock');

    function syncCustom() {
      if (customBlock) customBlock.hidden = design.branding !== 'custom';
      const hint = $('#brandingHint');
      const opt = bOptions.find((o) => o.id === design.branding);
      if (hint) hint.textContent = opt ? (opt.note || '') : '';
    }

    if (bt && bOptions.length) {
      bt.innerHTML = bOptions.map((o) =>
        '<button type="button" data-branding="' + esc(o.id) + '" aria-pressed="' +
        (design.branding === o.id) + '">' + esc(o.label) + '</button>'
      ).join('');
      bt.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-branding]');
        if (!btn) return;
        design.branding = btn.dataset.branding;
        $$('[data-branding]', bt).forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
        const radio = $('input[name="cardBranding"][value="' + design.branding + '"]');
        if (radio) radio.checked = true;
        syncCustom();
        onChange();
      });
    }

    const cs = $('#colourSwatches');
    const colours = CFG.customizer.baseColours || [];
    if (cs && colours.length) {
      cs.innerHTML = colours.map((c) =>
        '<button type="button" class="swatch" style="background:' + esc(c.hex) + '" data-colour="' +
        esc(c.hex) + '" aria-pressed="' + (design.colour === c.hex) + '" aria-label="' + esc(c.name) +
        '" title="' + esc(c.name) + '"></button>'
      ).join('');
      cs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-colour]');
        if (!btn) return;
        design.colour = btn.dataset.colour;
        $$('[data-colour]', cs).forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
        const gs = $('#gradientSwatches');
        if (gs) $$('[data-gradient]', gs).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        onChange();
      });
    }

    const gs = $('#gradientSwatches');
    const grads = CFG.customizer.gradients || [];
    if (gs && grads.length) {
      gs.innerHTML = grads.map((gr) =>
        '<button type="button" class="swatch swatch--grad" style="background:linear-gradient(135deg,' +
        esc(gr.from) + ',' + esc(gr.to) + ')" data-gradient="' + esc(gr.id) + '" aria-pressed="' +
        (design.gradient === gr.id) + '" aria-label="' + esc(gr.label) + '" title="' + esc(gr.label) + '"></button>'
      ).join('');
      gs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-gradient]');
        if (!btn) return;
        design.gradient = btn.dataset.gradient;
        design.colour = '';                     // a gradient wins over a flat colour
        $$('[data-gradient]', gs).forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
        const cs2 = $('#colourSwatches');
        if (cs2) $$('[data-colour]', cs2).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        onChange();
      });
    }

    const ft = $('#finishToggle');
    const finishes = CFG.customizer.finishes || [];
    if (ft && finishes.length) {
      ft.innerHTML = finishes.map((f) =>
        '<button type="button" data-finish="' + esc(f.id) + '" aria-pressed="' +
        (design.finish === f.id) + '">' + esc(f.label) + '</button>'
      ).join('');
      ft.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-finish]');
        if (!btn) return;
        design.finish = btn.dataset.finish;
        $$('[data-finish]', ft).forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
        onChange();
      });
    }

    const lu = $('#logoUpload');
    if (lu) {
      lu.addEventListener('change', () => {
        const file = lu.files && lu.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { toast('That image is over 4 MB — please use a smaller file.'); lu.value = ''; return; }
        const img = new Image();
        img.onload = () => {
          design.logo = img;
          design.logoName = file.name;
          const lbl = $('#logoFileName');
          if (lbl) lbl.textContent = file.name;
          if (design.branding !== 'custom') {
            const btns = $$('[data-branding]', bt || document.createElement('div'));
            const customBtn = btns.find((x) => x.dataset.branding === 'custom');
            if (customBtn) customBtn.click();
          }
          onChange();
        };
        img.onerror = () => toast('That file could not be read as an image.');
        img.src = URL.createObjectURL(file);
      });
    }

    syncCustom();
  }

  function init3D() {
    const nameEl = $('#customName');
    if (nameEl && !nameEl.value) nameEl.value = CFG.customizer.defaultName;

    const state = {
      name: (nameEl && nameEl.value) || CFG.customizer.defaultName,
      color: CFG.brand.colors.brand,
      model: currentModel,
      side: 'front',
    };

    const canRender = !!window.THREE && hasWebGL();

    if (!canRender) {
      // Static preview instead of an empty box: the real printed artwork,
      // no 3D. The controls still work (model switch + name).
      function paintFallbacks() {
        ['#hero3d', '#studio3d'].forEach((sel) => {
          const el = $(sel);
          if (!el) return;
          el.setAttribute('data-fallback', '');
          el.innerHTML = '<div class="stage__fallback">' + svgMockup(state.name, state.color, state.model, state.side) + '</div>';
        });
      }
      paintFallbacks();

      const hint = $('.stage__hint span');
      if (hint) hint.textContent = 'Static preview — your browser has 3D graphics disabled';

      if (nameEl) {
        nameEl.addEventListener('input', () => {
          state.name = nameEl.value.trim() || CFG.customizer.defaultName;
          paintFallbacks();
        });
      }
      const fbMt = $('#modelToggle');
      if (fbMt) {
        fbMt.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-model]');
          if (!btn) return;
          state.model = btn.dataset.model;
          currentModel = state.model;
          $$('[data-model]', fbMt).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          const radio = $('input[name="productChoice"][value="' + state.model + '"]');
          if (radio) { radio.checked = true; calculateTotal(); }
          paintFallbacks();
        });
      }
      initStudioControls(paintFallbacks);
      const fbSide = $('#sideToggle');
      if (fbSide) {
        fbSide.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-side]');
          if (!btn || !btn.dataset.side) return;
          state.side = btn.dataset.side;
          $$('[data-side]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === state.side)));
          paintFallbacks();
        });
      }
      return;
    }

    initStudioControls(rebuild);

    const heroV = buildViewer($('#hero3d'), { idleSpin: true, ariaLabel: '3D preview of a TapAsul NFC card. Use arrow keys to rotate.' });
    const studioV = buildViewer($('#studio3d'), { idleSpin: false, ariaLabel: '3D preview of your customised TapAsul product. Use arrow keys to rotate.' });

    viewers.push(heroV, studioV);

    function clearSkeleton(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('is-loading');
    }

    // let the booking panel swap the card that is on screen
    studioSetModel = function (modelId) {
      if (!modelId || !P[modelId]) return;
      state.model = modelId;
      currentModel = modelId;
      $$('[data-model]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.model === modelId)));
      rebuild();
    };

    function rebuild() {
      viewers.forEach((v) => v && v.build(state.model, state.name, state.color, state.side, design));
      const label = state.name || 'TapAsul product';
      ['#hero3d', '#studio3d'].forEach((sel) => {
        const el = $(sel);
        if (el) el.setAttribute('aria-label', '3D product preview for ' + label + '. Use arrow keys to rotate.');
      });
    }

    rebuild();
    // the shimmer only stays until the first frame has actually been drawn
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { clearSkeleton('hero3d'); clearSkeleton('studio3d'); });
    });

    if (nameEl) {
      nameEl.addEventListener('input', () => {
        state.name = nameEl.value.trim() || CFG.customizer.defaultName;
        rebuild();
      });
    }

    // ---- logo artwork (configurable) ----
    const logo = CFG.brand.logo || {};
    if (logo.mark) $$('.logo__mark img[data-logo="mark"]').forEach((i) => { i.src = logo.mark; });
    if (logo.markWhite) $$('.logo__mark img[data-logo="mark-white"]').forEach((i) => { i.src = logo.markWhite; });
    if (logo.showWordmark === false) $$('.logo__text').forEach((el) => { el.hidden = true; });

    // ---- front / back face toggle ----
    function syncSideButtons() {
      $$('[data-side]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === state.side)));
    }
    function wireSide(sel) {
      const box = $(sel);
      if (!box) return;
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-side]');
        if (!btn || !btn.dataset.side) return;
        state.side = btn.dataset.side;
        syncSideButtons();
        rebuild();
      });
    }
    wireSide('#sideToggle');
    wireSide('#sideToggleStudio');
    syncSideButtons();

    const mt = $('#modelToggle');
    if (mt) {
      mt.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-model]');
        if (!btn) return;
        state.model = btn.dataset.model;
        currentModel = state.model;
        $$('[data-model]', mt).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

        // keep the booking in sync with what they're looking at
        const t = typeForProduct(state.model);
        if (t) {
          booking.type = t.id;
          $$('.btype').forEach((c) => c.classList.toggle('is-active', c.dataset.type === t.id));
        }
        renderFeaturePick();
        calculateTotal();

        rebuild();
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. FORM
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * 8. ORDER STORE
   * Orders are kept in the visitor's browser so the admin dashboard has
   * something to show. If `order.endpoint` is set, they are also POSTed to
   * your sheet / Formspree so you can read them from any device.
   * ------------------------------------------------------------------ */
  function orderStoreKey() {
    return (CFG.order.admin && CFG.order.admin.storageKey) || 'tapasul_orders_v1';
  }

  function readLocalOrders() {
    try {
      const list = JSON.parse(localStorage.getItem(orderStoreKey()) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function saveLocalOrder(payload) {
    if (consentState() === 'declined') return null;   // visitor declined storage
    try {
      const order = Object.assign({
        id: 'ts_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        status: 'new',
        note: '',
        source: 'site',
      }, payload);
      const list = readLocalOrders();
      list.unshift(order);
      localStorage.setItem(orderStoreKey(), JSON.stringify(list.slice(0, 500)));
      return order;
    } catch (e) { return null; }
  }

  function initForm() {
    const form = $('#preOrderForm');
    if (!form) return;

    // honeypot — bots fill this, humans never see it
    const trap = document.createElement('input');
    trap.type = 'text'; trap.name = '_gotcha'; trap.tabIndex = -1;
    trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(trap);

    const nameEl = $('#customerName');
    const emailEl = $('#customerEmail');
    const phoneEl = $('#customerPhone');
    const addrEl = $('#customerAddress');
    const dateEl = $('#bookingDate');
    const notesEl = $('#bookingNotes');
    const status = $('#formStatus');
    const submitBtn = $('#submitBtn');

    const ERROR_ID = {
      customerName: 'nameError', customerEmail: 'emailError',
      customerPhone: 'phoneError', customerAddress: 'addressError',
      bookingDate: 'dateError',
    };

    function setError(el, msg) {
      if (!el) return;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const err = document.getElementById(ERROR_ID[el.id]);
      if (err) err.textContent = msg || '';
    }

    // is the delivery address needed? only when the card is shipped
    function isPickup() {
      const sel = $('#shippingZone');
      return !!(sel && sel.value === 'pickup');
    }

    function validate() {
      let ok = true;
      const n = nameEl ? nameEl.value.trim() : '';
      const e = emailEl ? emailEl.value.trim() : '';
      const ph = phoneEl ? phoneEl.value.trim() : '';
      const a = addrEl ? addrEl.value.trim() : '';
      const bk = CFG.booking || {};

      if (n.length < 2) { setError(nameEl, 'Please enter your full name.'); ok = false; }
      else setError(nameEl, '');

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { setError(emailEl, 'Please enter a valid email address.'); ok = false; }
      else setError(emailEl, '');

      const digits = ph.replace(/\D/g, '');
      if (digits.length < 10) { setError(phoneEl, 'We need a mobile number to reach you on the day.'); ok = false; }
      else setError(phoneEl, '');

      if (!booking.date) { setError(dateEl, 'Please choose a date for your appointment.'); ok = false; }
      else if (!isOpenDay(booking.date)) {
        setError(dateEl, 'We are closed that day — please pick another date.');
        ok = false;
      } else setError(dateEl, '');

      if (!booking.slot) {
        ok = false;
        const hint = $('#slotHint');
        if (hint) hint.textContent = (CFG.content.form && CFG.content.form.slotEmpty) || 'Please choose a time.';
      }

      if (!isPickup() && a.length < 8) {
        setError(addrEl, 'We need a delivery address to ship the card.');
        ok = false;
      } else setError(addrEl, '');

      const lead = bk.leadDays || 0;
      if (lead) {
        const min = new Date(); min.setDate(min.getDate() + lead);
        if (booking.date && booking.date < bookingDateISO(min)) {
          setError(dateEl, 'Please book at least ' + lead + ' days ahead.');
          ok = false;
        }
      }
      return ok;
    }

    [nameEl, emailEl, phoneEl, addrEl].forEach((el) => {
      if (el) el.addEventListener('input', () => { setError(el, ''); updateSteps(); });
    });

    // live totals when delivery, payment or add-ons change
    ['#shippingZone', '#paymentMethod'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('change', () => {
        calculateTotal();
        const hint = $('#addressHint');
        if (hint) {
          hint.textContent = isPickup()
            ? 'No delivery address needed — you will collect the card at your appointment.'
            : (CFG.content.form && CFG.content.form.addressPlaceholder) || '';
        }
        const pay = (CFG.pricing.payment && CFG.pricing.payment.methods || []).find((m) => m.id === el.value);
        const payHint = $('#paymentHint');
        if (payHint) payHint.textContent = pay ? (pay.note || '') : '';
      });
    });
    const addOnList = $('#addOnsList');
    if (addOnList) addOnList.addEventListener('change', () => calculateTotal());

    // ---- promo code ----
    const promoInput = $('#promoCode');
    const promoBtn = $('#promoApply');
    const promoHint = $('#promoHint');
    if (promoBtn) {
      promoBtn.addEventListener('click', () => {
        const code = (promoInput && promoInput.value || '').trim();
        if (!code) {
          booking.promo = null;
          if (promoHint) { promoHint.textContent = ''; promoHint.className = 'field__hint'; }
          calculateTotal();
          return;
        }
        const found = findPromo(code);
        if (!found) {
          booking.promo = null;
          if (promoHint) {
            promoHint.textContent = (CFG.content.form && CFG.content.form.promoInvalid) || 'That code is not valid.';
            promoHint.className = 'field__hint is-err';
          }
          calculateTotal();
          return;
        }
        booking.promo = found;
        if (promoInput) promoInput.value = found.code;
        if (promoHint) {
          promoHint.textContent = (CFG.content.form && CFG.content.form.promoApplied) + ' — ' + (found.label || '');
          promoHint.className = 'field__hint is-ok';
        }
        calculateTotal();
      });
    }
    if (promoInput) {
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (promoBtn) promoBtn.click(); }
      });
    }

    function showStatus(type, msg) {
      if (!status) return;
      status.className = 'form-status is-visible form-status--' + type;
      status.textContent = msg;
    }

    function bookingSummary() {
      const t = calculateTotal();
      const pay = (CFG.pricing.payment && CFG.pricing.payment.methods || [])
        .find((m) => m.id === paymentMethodId());
      return {
        type: t.offer.id,
        productId: t.offer.product.id,
        product: t.offer.name,
        qty: t.qty,
        unit: t.offer.price,
        monthly: t.offer.monthly,
        discount: t.discount + t.promoAmount,
        shipping: t.shipping,
        cod: t.cod,
        addOns: t.addOns,
        addOnTotal: t.addOnTotal,
        features: t.features,
        branding: t.offer.branding,
        finish: design.finish,
        payment: pay ? pay.label : paymentMethodId(),
        zone: shippingLabel(),
        date: booking.date,
        slot: booking.slot,
        total: t.total,
        deposit: t.deposit,
        balance: t.balance,
      };
    }

    // Anti-spam: a real person takes a moment to read the form before
    // sending it, and nobody needs five bookings in five minutes from one
    // device. Both are soft limits — they never lose a genuine booking.
    let firstTouch = null;
    const touch = () => { if (firstTouch === null) firstTouch = Date.now(); };
    form.addEventListener('input', touch, true);
    form.addEventListener('focusin', touch, true);
    form.addEventListener('change', touch, true);

    const MIN_DWELL = 2500;                // ms
    const RATE_KEY = 'tapasul_booking_rate_v1';
    const RATE_MAX = 4;                    // bookings per hour from one device
    const RATE_WINDOW = 60 * 60 * 1000;

    function rateLimited() {
      try {
        const raw = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
        const now = Date.now();
        const hits = Array.isArray(raw) ? raw.filter((t) => now - t < RATE_WINDOW) : [];
        localStorage.setItem(RATE_KEY, JSON.stringify(hits));
        return hits.length >= RATE_MAX;
      } catch (e) { return false; }
    }

    function noteSubmission() {
      try {
        const raw = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
        const now = Date.now();
        const hits = Array.isArray(raw) ? raw.filter((t) => now - t < RATE_WINDOW) : [];
        hits.push(now);
        localStorage.setItem(RATE_KEY, JSON.stringify(hits));
      } catch (e) { /* private mode — the booking still goes through */ }
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (trap.value) return;              // silent bot rejection

      // field errors first — a real person should see what is wrong before
      // anything else, and only then hit the anti-spam guards
      if (!validate()) {
        showStatus('err', 'Please check the highlighted fields.');
        return;
      }

      if (firstTouch === null || Date.now() - firstTouch < MIN_DWELL) {
        showStatus('err', 'One moment — please check your details before sending.');
        return;
      }
      if (rateLimited()) {
        showStatus('err', 'You have sent several bookings from this device already. Please wait an hour, or email us and we will take it straight away.');
        return;
      }

      const o = bookingSummary();
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const phone = phoneEl.value.trim();
      const address = addrEl ? addrEl.value.trim() : '';
      const notes = notesEl ? notesEl.value.trim() : '';
      const mode = CFG.order.mode;

      const payload = {
        type: 'booking',
        name, email, phone, address, notes,
        date: o.date, slot: o.slot,
        productId: o.productId,
        product: o.product,
        quantity: o.qty,
        unitPrice: o.unit,
        monthlyHosting: o.monthly,
        discount: o.discount,
        shipping: o.shipping,
        shippingZone: o.zone,
        codFee: o.cod,
        paymentMethod: o.payment,
        branding: o.branding,
        finish: o.finish,
        addOns: o.addOns,
        addOnTotal: o.addOnTotal,
        features: o.features || [],
        total: o.total,
        deposit: o.deposit,
        balance: o.balance,
        currency: CFG.pricing.currencyCode,
        submittedAt: new Date().toISOString(),
      };

      submitBtn.disabled = true;
      noteSubmission();

      // keep a copy locally so admin.html can show it straight away
      const stored = saveLocalOrder(payload);

      try {
        if (mode === 'email') {
          const subject = 'Booking: ' + o.date + ' ' + o.slot + ' — ' + o.qty + ' × ' + o.product;
          const body = [
            'APPOINTMENT BOOKING',
            'Date: ' + o.date + (o.slot ? ' at ' + o.slot : ''),
            '',
            'Name: ' + name,
            'Email: ' + email,
            'Phone: ' + phone,
            'Address: ' + (address || '— collecting at the appointment'),
            o.notes ? 'Notes: ' + o.notes : '',
            '',
            'Card: ' + o.product + ' × ' + o.qty,
            'Unit price: ' + money(o.unit),
            'Branding: ' + o.branding + (o.finish ? ' (' + o.finish + ')' : ''),
            o.addOns.length ? 'Add-ons: ' + o.addOns.map((a) => a.label + (a.price ? ' (' + money(a.price) + ')' : '')).join(', ') : '',
            (o.features && o.features.length) ? 'Features on the card: ' + o.features.join(', ') : '',
            o.discount ? 'Discount: -' + money(o.discount) : '',
            'Delivery (' + o.zone + '): ' + money(o.shipping),
            o.cod ? 'Cash-on-delivery fee: ' + money(o.cod) : '',
            'Payment: ' + o.payment,
            '',
            'TOTAL: ' + money(o.total),
            o.deposit !== o.total ? 'Due today: ' + money(o.deposit) + ' · balance on the day: ' + money(o.balance) : '',
            'RECURRING: ' + (o.monthly ? money(o.monthly * o.qty) + '/month hosting' : 'none'),
            '',
            'Sent from ' + CFG.brand.url,
          ].filter(Boolean).join('\n');
          window.location.href = 'mailto:' + CFG.order.orderEmail +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
          showStatus('ok', 'Your email app should open with the booking details. Send it and we will reply to confirm your slot.');

        } else if (mode === 'formspree' || mode === 'google-form' || mode === 'local') {
          if (mode !== 'local' && !CFG.order.endpoint) throw new Error('No endpoint configured');
          if (CFG.order.endpoint) {
            const res = await fetch(CFG.order.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Endpoint returned ' + res.status);
          }
          showStatus('ok', CFG.order.successMessage);

        } else if (mode === 'demo') {
          showStatus('ok', CFG.order.successMessage + ' (Demo mode — nothing was actually sent.)');

        } else {
          showStatus('ok', CFG.order.successMessage + ' (Demo mode — nothing was actually sent.)');
        }
      } catch (err) {
        showStatus('err', 'Sorry, we could not send your booking. Please email us at ' + CFG.brand.email + '.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. SEO — structured data generated from the config
   * ------------------------------------------------------------------ */
  function injectStructuredData() {
    const graph = SEO.buildGraph ? SEO.buildGraph(CFG, window.location.origin) : [];
    let el = $('#structured-data');
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = 'structured-data';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  }

  /* ------------------------------------------------------------------ *
   * 10. ANALYTICS (opt-in, privacy-friendly)
   * ------------------------------------------------------------------ */
  function initAnalytics() {
    if (!consentGranted()) return;    // the visitor declined — load nothing
    const ga = CFG.analytics.googleAnalyticsId;
    if (ga) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ga;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', ga, { anonymize_ip: true });
    }
    const px = CFG.analytics.metaPixelId;
    if (px) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', px); fbq('track', 'PageView');
    }
  }

  /* ------------------------------------------------------------------ *
   * 11. WIRING
   * ------------------------------------------------------------------ */
  function init() {
    initConsent();
    applyBrand();
    applyContent();
    renderAll();
    initNav();
    initForm();
    injectStructuredData();
    initAnalytics();

    // pricing interactions
    document.addEventListener('click', (e) => {
      const sel = e.target.closest('[data-select-product]');
      if (sel) { selectProduct(sel.dataset.selectProduct); }
      // "Book the premium card" from the comparison section
      const pick = e.target.closest('[data-inside-pick]');
      if (pick) {
        const productId = pick.dataset.insidePick;
        const t = typeForProduct(productId);
        if (t) {
          booking.type = t.id;
          $$('.btype').forEach((c) => c.classList.toggle('is-active', c.dataset.type === t.id));
          applyBranding(t.branding || 'standard');
        }
        setStudioModel(productId);
        renderFeaturePick();
        calculateTotal();
        const form = $('#preorder');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    document.addEventListener('change', (e) => {
      if (e.target.name === 'bookingType') {
        booking.type = e.target.value;
        applyBranding(currentOffer().branding);
        renderFeaturePick();
        calculateTotal();
      }
    });

    const minus = $('#qtyMinus'), plus = $('#qtyPlus'), qtyInput = $('#orderQty');
    if (minus) minus.addEventListener('click', () => setQty(qty - 1));
    if (plus) plus.addEventListener('click', () => setQty(qty + 1));
    if (qtyInput) {
      qtyInput.addEventListener('change', () => setQty(parseInt(qtyInput.value, 10)));
      qtyInput.addEventListener('blur', () => setQty(parseInt(qtyInput.value, 10)));
      // live update while typing, so the total never looks stale
      qtyInput.addEventListener('input', () => {
        const n = parseInt(qtyInput.value, 10);
        if (!isNaN(n) && n >= 1) { qty = Math.min(999, n); calculateTotal(); }
      });
    }

    // deep link: ?product=card
    const wanted = new URLSearchParams(location.search).get('product');
    if (wanted && P[wanted]) currentModel = wanted;

    setQty(1);
    init3D();

    // smooth anchor scrolling that clears the sticky header
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY -
                  (CFG.features.scrollOffsetPx || 88);
        window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        history.replaceState(null, '', '#' + id);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
