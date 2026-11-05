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
        toast($('#preorder') ? 'Thanks — you can book below.' : 'Thanks for accepting.');
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
  // the logo can be swapped from site.config.js — brand.logo.mark
  function applyLogo() {
    const logo = CFG.brand.logo || {};
    if (logo.mark) $$('.logo__mark img[data-logo="mark"]').forEach((i) => { i.src = logo.mark; });
    if (logo.markWhite) $$('.logo__mark img[data-logo="mark-white"]').forEach((i) => { i.src = logo.markWhite; });
    if (logo.showWordmark === false) $$('.logo__text').forEach((el) => { el.hidden = true; });
    // the consent popup uses the same file
    if (logo.mark) $$('.logo__mark img[data-logo="mark"], .consent__mark').forEach((i) => { i.src = logo.mark; });
  }

  /* ------------------------------------------------------------------ *
   * THE HERO CARD — a real card you can turn over
   * Pure CSS 3D: drag (or use the arrow keys) and the card turns. The
   * front is the printed card, the back is the QR code.
   * ------------------------------------------------------------------ */
  function initHeroCard() {
    const box = $('#card3d');
    const card = $('#card3dInner');
    if (!box || !card) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ry = -30, rx = 10;         // where the card is pointing
    let visible = true;            // don't spin the card while it is off-screen
    let dragging = false;
    let lastX = 0, lastY = 0;
    let idleTimer = null;

    function paint() {
      card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      // the light slides across the card as it turns, so it feels solid
      const shine = Math.max(0, Math.min(1, 0.5 + Math.sin(ry * Math.PI / 180) * 0.5));
      card.style.setProperty('--shine', shine.toFixed(3));
    }

    function stopIdle() {
      if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
      card.classList.remove('is-idle');
    }

    function startIdle() {
      if (reduce || dragging || idleTimer || !visible) return;
      card.classList.add('is-idle');
      idleTimer = setInterval(() => {
        ry += 0.35;
        if (ry > 360) ry -= 360;
        paint();
      }, 40);
    }

    function onDown(e) {
      // stop the browser from starting a native image drag — that cancels the
      // pointer and the card would stop following the mouse
      if (e.preventDefault) e.preventDefault();
      dragging = true;
      stopIdle();
      lastX = e.clientX;
      lastY = e.clientY;
      card.classList.add('is-dragging');
      if (box.setPointerCapture && e.pointerId !== undefined) {
        try { box.setPointerCapture(e.pointerId); } catch (_) { /* not needed */ }
      }
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      ry += dx * 0.55;
      rx = Math.max(-32, Math.min(32, rx - dy * 0.35));
      paint();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('is-dragging');
      setTimeout(startIdle, 2200);
    }

    box.addEventListener('pointerdown', onDown);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerup', onUp);
    box.addEventListener('pointercancel', onUp);
    box.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 30 : 12;
      if (e.key === 'ArrowLeft') { ry -= step; }
      else if (e.key === 'ArrowRight') { ry += step; }
      else if (e.key === 'ArrowUp') { rx = Math.max(-32, rx - step); }
      else if (e.key === 'ArrowDown') { rx = Math.min(32, rx + step); }
      else return;
      e.preventDefault();
      stopIdle();
      paint();
      setTimeout(startIdle, 2200);
    });

    paint();
    startIdle();

    // stop spinning the card while nobody can see it
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) startIdle(); else stopIdle();
      }, { threshold: 0.05 });
      io.observe(box);
    }
  }

  /* ------------------------------------------------------------------ *
   * MY WORK — the gallery of cards you have made
   * Everything comes from site.config.js -> myWork.items
   * ------------------------------------------------------------------ */
  function renderMyWork() {
    const cfg = CFG.myWork || {};
    const box = $('#workGrid');
    if (!box) return;
    if (cfg.enabled === false) { $('#work') && $('#work').remove(); return; }

    const items = cfg.items || [];
    if (!items.length) {
      // nothing added yet — show the owner exactly what to do
      box.innerHTML =
        '<div class="work__empty">'
        +   '<img class="work__emptyMark" src="assets/logo-frog.svg" data-logo="mark" alt="" width="34" height="44">'
        +   '<strong>Your work goes here</strong>'
        +   '<span>Put your card photos in <code>assets/work/</code>, then list them in '
        +     '<code>site.config.js</code> under <code>myWork.items</code> — one line each:</span>'
        +   '<code class="work__sample">{ image: "assets/work/my-card.jpg", title: "Client name", note: "What they do" }</code>'
        + '</div>';
      return;
    }

    box.innerHTML = items.map((w) => {
      const img = w.image
        ? '<img src="' + esc(w.image) + '" alt="' + esc(w.title || 'TapAsul card') + '" loading="lazy">'
        : '';
      const body =
          (w.title ? '<strong>' + esc(w.title) + '</strong>' : '')
        + (w.note ? '<span>' + esc(w.note) + '</span>' : '');
      const inner = img + (body ? '<span class="work__body">' + body + '</span>' : '');
      if (w.href) {
        return '<a class="work__item" href="' + esc(w.href) + '" target="_blank" rel="noopener">' + inner + '</a>';
      }
      return '<figure class="work__item">' + inner + '</figure>';
    }).join('');
  }

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
    // a page can bring its own title (features.html) — otherwise use the default
    const pageKey = document.body && document.body.getAttribute('data-page-title');
    const perPage = (content.pageTitles || {})[pageKey];
    document.title = perPage || content.pageTitle || (b.name + ' | ' + (content.pageTitleSuffix || 'Smart NFC Digital Cards'));
    const canon = $('link[rel="canonical"]');
    let pageUrl = (SEO.base ? SEO.base(CFG, origin) : b.url) + '/';
    if (canon) {
      // a sub-page (features.html) keeps the canonical that the build wrote
      if (pageKey) pageUrl = canon.href;
      else canon.href = pageUrl;
    }
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:image', SEO.abs ? SEO.abs(CFG, b.ogImage, origin) : b.ogImage);
    setMeta('property', 'og:site_name', b.name);
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:description', content.ogDescription || content.metaDescription || b.description);
    if (!pageKey) setMeta('name', 'description', content.metaDescription || b.description);
    setMeta('name', 'twitter:image', SEO.abs ? SEO.abs(CFG, b.ogImage, origin) : b.ogImage);
    setMeta('name', 'twitter:title', document.title);
    setMeta('name', 'twitter:description', content.ogDescription || content.metaDescription || b.description);
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
            ? '<a class="btype__link" href="#work">See custom cards we made →</a>'
            : '') +
        '</div>' +
      '</label>';
    }).join('');

    $$('.btype', box).forEach((card) => {
      card.addEventListener('click', () => {
        booking.type = card.dataset.type;
        $$('.btype', box).forEach((c) => c.classList.toggle('is-active', c === card));
        applyBranding(currentOffer().branding);
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
    const saved = $('#featurePickSaved');
    if (saved) {
      if (booking.features.length) {
        saved.textContent = 'Saved to your booking: ' + booking.features.join(', ') + '.';
      } else {
        saved.textContent = '';
      }
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

  // keep the branding choice in step with the chosen booking type
  function applyBranding(brandingId) {
    design.branding = brandingId;
    const radio = $('input[name="cardBranding"][value="' + brandingId + '"]');
    if (radio && !radio.checked) radio.checked = true;
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

  // ---- live profiles: the moving strip + the "your page is free" CTA ----
  function renderShowcase() {
    const cfg = CFG.showcase;
    if (!cfg) return;

    const track = $('#profileTrack');
    if (track) {
      const people = cfg.people || [];
      const chip = (p) => {
        const href = p.href || ((cfg.baseUrl || '') + p.name);
        return '<a class="marquee__item" href="' + esc(href) + '" target="_blank" rel="noopener">' +
          '<span class="marquee__dot" style="background:' + esc(p.tint || '#0881EF') + '"></span>' +
          '<span class="marquee__host">' + esc((cfg.baseUrl || '').replace(/^https?:\/\//, '')) + '</span>' +
          '<strong>' + esc(p.name) + '</strong>' +
          '</a>';
      };
      const half = '<div class="marquee__half">' + people.map(chip).join('') + '</div>';
      // the second copy is only there to make the loop seamless
      track.innerHTML = half + '<div class="marquee__half" aria-hidden="true">' + people.map(chip).join('') + '</div>';
    }

    const cta = $('#profileCta');
    if (cta && cfg.cta) {
      cta.innerHTML =
        '<div class="showcase__text">'
        +   '<strong>' + esc(cfg.cta.title) + '</strong>'
        +   '<span>' + esc(cfg.cta.text) + '</span>'
        +   '<label class="showcase__label" for="profileName">' + esc(cfg.cta.nameLabel || 'Your name') + '</label>'
        +   '<div class="showcase__url">'
        +     '<span class="showcase__urlBase">' + esc(cfg.cta.urlBase || 'portal.tapasul.com/r/') + '</span>'
        +     '<input class="showcase__urlInput" id="profileName" type="text" maxlength="30"'
        +       ' autocomplete="off" spellcheck="false"'
        +       ' placeholder="' + esc(cfg.cta.namePlaceholder || 'yourname') + '"'
        +       ' aria-label="' + esc(cfg.cta.nameLabel || 'Your name') + '">'
        +   '</div>'
        +   '<span class="showcase__urlPreview" id="profileUrlEcho" role="status"></span>'
        +   '<span class="showcase__hint" id="profileNameHint" role="status"></span>'
        +   (cfg.cta.note ? '<span class="showcase__note">' + icon('check', 14) + esc(cfg.cta.note) + '</span>' : '')
        + '</div>'
        + '<button type="button" class="btn btn--primary showcase__btn" id="claimFreePage">'
        +   esc(cfg.cta.button) + '</button>';
    }
  }

  /* ------------------------------------------------------------------ *
   * THE FLOW
   *   1. "Select Digital Card"  -> the free page box (they type a name)
   *   2. "Claim my free page"    -> what is inside the card
   *   3. "Book the ... card"     -> the booking form, with the name on it
   * ------------------------------------------------------------------ */
  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/['’.]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  // the name they typed for their page
  function setFlowName(value) {
    flow.name = String(value || '').trim();
    flow.slug = slugify(flow.name);
    const hint = $('#profileNameHint');
    if (hint) hint.textContent = flow.slug ? '' : 'Type your name so we can set up your page.';
    return flow.slug;
  }

  // keeps the booking form in step with what they typed
  function applyFlowToForm() {
    if (!flow.name) return;
    const nameEl = $('#customerName');
    if (nameEl && (!nameEl.value.trim() || nameEl.value === autoNameValue)) {
      nameEl.value = flow.name;
      autoNameValue = flow.name;
      nameEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // and keep the free-page boxes showing the same name
    const showcase = $('#profileName');
    if (showcase && !showcase.value.trim()) showcase.value = flow.name;
    const bookingBox = $('#bookingProfileName');
    if (bookingBox && (!bookingBox.value.trim() || bookingBox.value === autoBoxValue)) {
      bookingBox.value = flow.name;
      autoBoxValue = flow.name;
    }
    calculateTotal();
  }

  // if they change the name themselves, stop overwriting it
  function trackNameField() {
    const nameEl = $('#customerName');
    if (!nameEl) return;
    nameEl.addEventListener('input', () => {
      if (nameEl.value !== autoNameValue) autoNameValue = '';
    });
  }

  // the page address they will get
  function profileUrl() {
    const c = (CFG.showcase && CFG.showcase.cta) || {};
    const base = c.urlBase || 'portal.tapasul.com/r/';
    return base + (flow.slug || c.namePlaceholder || 'yourname');
  }

  function initShowcaseFlow() {
    const input = $('#profileName');
    const btn = $('#claimFreePage');
    if (!input && !btn) return;

    if (input) {
      const showUrl = () => {
        const echo = $('#profileUrlEcho');
        if (echo) echo.textContent = flow.slug ? 'Your page will be ' + profileUrl() : '';
      };
      // whatever they type here is saved on the booking straight away — the
      // button only takes them to the next step, it is not what saves it
      const commit = () => {
        if (!flow.slug) return;
        applyFlowToForm();
        if (typeof renderSummary === 'function') renderSummary();
        const hint = $('#profileNameHint');
        if (hint) hint.textContent = 'Saved to your booking — it will be on your order.';
      };
      input.addEventListener('input', () => {
        setFlowName(input.value);
        showUrl();
        const hint = $('#profileNameHint');
        if (hint && !flow.slug) hint.textContent = '';
        commit();
      });
      input.addEventListener('change', commit);
      input.addEventListener('blur', commit);
      // show the address they will get, right away
      showUrl();
      if (flow.slug && !input.value) { input.value = flow.name; commit(); }
    }

    if (btn) {
      btn.addEventListener('click', () => {
        const slug = setFlowName(input ? input.value : '');
        const hint = $('#profileNameHint');
        if (!slug) {
          if (hint) hint.textContent = 'Type your name so we can set up your page.';
          if (input) input.focus();
          return;
        }
        scrollToSection((CFG.showcase.cta && CFG.showcase.cta.next) || '#inside');
      });
    }
  }

  // the customer's free page, claimed inside the booking form
  function initBookingFreePage() {
    const input = $('#bookingProfileName');
    const echo = $('#bookingProfileEcho');
    if (!input) return;

    // no claim button: the page saves itself while they type
    const showUrl = () => {
      if (!echo) return;
      if (!flow.slug) {
        echo.textContent = '';
        echo.classList.remove('is-on');
        return;
      }
      echo.textContent = 'Your page: ' + profileUrl();
      echo.classList.add('is-on');
    };

    const commit = () => {
      if (!flow.slug) return;
      applyFlowToForm();
      if (typeof renderSummary === 'function') renderSummary();
      const showcase = $('#profileName');
      if (showcase && !showcase.value && flow.name) showcase.value = flow.name;
    };

    input.addEventListener('input', () => {
      if (input.value !== autoBoxValue) autoBoxValue = '';   // they typed here
      setFlowName(input.value);
      showUrl();
      commit();
    });
    input.addEventListener('change', commit);
    input.addEventListener('blur', commit);

    // they may have named their page earlier, in the showcase
    if (flow.name && !input.value) {
      input.value = flow.name;
      showUrl();
      commit();
    } else {
      showUrl();
    }
  }

  // scrolls to a section, clearing the sticky header
  function scrollToSection(selector) {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) return;
    const offset = CFG.features.scrollOffsetPx || 88;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = () => Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);

    // if the visitor scrolls by hand, stop correcting for them
    let userMoved = false;
    const stop = () => { userMoved = true; };
    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    window.addEventListener('keydown', stop, { once: true });

    window.scrollTo({ top: target(), behavior: reduce ? 'auto' : 'smooth' });

    // the sections below the fold are painted only when they scroll into view,
    // which can move the page a little — keep the target lined up for a moment
    setTimeout(() => {
      let tries = 0;
      const timer = setInterval(() => {
        if (userMoved || tries++ > 12) {
          clearInterval(timer);
          window.removeEventListener('wheel', stop);
          window.removeEventListener('touchstart', stop);
          window.removeEventListener('keydown', stop);
          return;
        }
        const y = target();
        if (Math.abs(y - window.scrollY) > 3) window.scrollTo({ top: y, behavior: 'auto' });
      }, 120);
    }, reduce ? 150 : 700);
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
                (i.text ? '<span>' + esc(i.text) + '</span>' : '') +
                (i.link ? '<a class="inside-card__link" href="' + esc(i.link.href || '#insideFeatured') + '">' +
                  esc(i.link.label || 'Check the features') +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>' +
                  '</a>' : '') +
                '</span></li>').join('')
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
              +   '</div>'
              +   '<span class="inside__pills">'
              +     '<span class="inside__pill inside__pill--std">Standard · pick ' + max + '</span>'
              +     '<span class="inside__pill inside__pill--prm">Premium · included</span>'
              +   '</span>'
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

    renderShowcase();
    renderInside();
    renderMyWork();

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
        '<div class="delivery-card"><h4>Valenzuela</h4><strong>' + esc(dl.timelineValenzuela || '') + '</strong>' +
          '<p>' + esc((zones.find((z) => z.id === 'valenzuela') || {}).label || '') + ' delivery</p></div>' +
        '<div class="delivery-card"><h4>Outside Valenzuela</h4><strong>' + esc(dl.timelineOutside || '') + '</strong>' +
          '<p>' + esc((zones.find((z) => z.id === 'outside') || {}).label || '') + ' delivery</p></div>' +
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
    if (CFG.features.showWork === false) $('#work') && $('#work').remove();
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
    if (flow.slug) add('Your page', esc(profileUrl()), 'summary__row--page');
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
    // move the booking to the option that matches the card they just picked
    const t = typeForProduct(id);
    if (t) {
      booking.type = t.id;
      $$('.btype').forEach((c) => c.classList.toggle('is-active', c.dataset.type === t.id));
      applyBranding(t.branding || 'standard');
    }
    renderFeaturePick();
    calculateTotal();
    // step 1 of the flow: they tell us the name for their page
    const cta = $('#profileCta');
    if (cta) {
      scrollToSection(cta);
      const input = $('#profileName');
      if (input) setTimeout(() => input.focus({ preventScroll: true }), 450);
    } else {
      scrollToSection('#preorder');
    }
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
   * ORDER STATE
   * ------------------------------------------------------------------ */
  // what the visitor typed for their own page, on the way to booking
  const flow = { name: '', slug: '' };
  // the name we put in the booking form ourselves; if it still holds exactly
  // that, we may keep it in step while they type in the free-page box
  let autoNameValue = '';
  let autoBoxValue = '';

  // which branding the customer picked — TapAsul artwork or their own
  const design = {
    branding: (CFG.customizer.branding && CFG.customizer.branding.default) || 'standard',
    finish: 'matte',
  };

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

  // a human-readable id for the booking, e.g. TS-20261104-7F3A9C
  function newBookingId() {
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return 'TS-' + stamp + '-' + rand;
  }

  // ?utm_source=fb&utm_campaign=... — so you know which post brought them
  function utmTags() {
    const out = {};
    try {
      new URLSearchParams(location.search).forEach((v, k) => {
        if (/^(utm_|ref$|fbclid$|gclid$)/i.test(k) && v) out[k] = String(v).slice(0, 120);
      });
    } catch (e) { /* no URL API — skip */ }
    return out;
  }

  // the plain-text booking, used by the mailto fallback and the local record
  function bookingEmailBody(p) {
    const line = (label, value, strong) => {
      if (value === undefined || value === null || value === '') return;
      return (strong ? label.toUpperCase() : '  ' + label) + ': ' + value;
    };
    const addOns = (p.addOns || []).map((a) => (a.label || a) + (a.price ? ' (' + money(a.price) + ')' : ''));
    const utm = Object.keys(p.utm || {}).map((k) => k + '=' + p.utm[k]).join(' · ');
    return [
      'NEW BOOKING — ' + (p.product || 'card'),
      '',
      line('Booking id', p.bookingId),
      line('Sent', p.submittedAt),
      '',
      'APPOINTMENT',
      line('Date', p.date),
      line('Time', p.slot),
      line('Where', p.meetAt),
      '',
      'CUSTOMER',
      line('Name', p.name),
      line('Email', p.email),
      line('Phone', p.phone),
      line('Address', p.address || 'collecting at the appointment'),
      line('Notes', p.notes),
      '',
      'THE CARD',
      line('Product', p.product),
      line('Card type', p.cardType),
      line('Quantity', p.quantity),
      line('Price each', money(p.unitPrice)),
      line('Branding', p.branding),
      line('Finish', p.finish),
      line('Features', (p.features || []).join(', ')),
      line('Add-ons', addOns.join(', ')),
      '',
      'THEIR FREE PAGE',
      line('Page name', p.profileName),
      line('Page address', p.profileUrl),
      '',
      'MONEY',
      line('Subtotal', money(p.subtotal)),
      line('Discount', p.discount ? '-' + money(p.discount) : ''),
      line('Promo code', p.promoCode),
      line('Delivery', money(p.shipping) + ' (' + p.shippingZone + ')'),
      line('Cash-on-delivery', p.codFee ? money(p.codFee) : ''),
      line('Payment', p.paymentMethod),
      line('TOTAL', money(p.total), true),
      line('Due today', money(p.deposit)),
      line('Balance on the day', money(p.balance)),
      line('Recurring', p.monthlyHosting ? money(p.monthlyHosting * p.quantity) + ' / month hosting' : 'none'),
      '',
      'HOW THEY GOT HERE',
      line('Page', p.pageUrl),
      line('Came from', p.referrer || 'direct'),
      line('Campaign', utm),
      line('Language', p.locale),
      line('Time zone', p.timezone),
      line('Screen', p.screen),
      line('Consent', p.consent),
      line('Device', p.userAgent),
      '',
      'Sent from ' + CFG.brand.url,
    ].filter((l) => l !== undefined && l !== null).join('\n');
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

    // one id per filled-in form: if they double-tap "Book", the worker sees
    // the same id twice and keeps a single row
    const clientId = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

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
        subtotal: t.subtotal,
        monthly: t.offer.monthly,
        discount: t.discount,
        promo: t.promo || null,
        promoAmount: t.promoAmount || 0,
        shipping: t.shipping,
        cod: t.cod,
        addOns: t.addOns,
        addOnTotal: t.addOnTotal,
        features: t.features,
        profileName: flow.name,
        profileUrl: flow.slug ? profileUrl() : '',
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

      // everything the form knows about this booking — the more we send, the
      // less you have to guess later
      const payload = {
        type: 'booking',
        // which booking this is (so a double tap never makes two rows)
        bookingId: newBookingId(),
        clientId: clientId,
        // who
        name, email, phone, address, notes,
        // when + where
        date: o.date, slot: o.slot,
        meetAt: (($('#bookingLocation') || {}).textContent || '').trim(),
        // what
        cardType: o.type,
        productId: o.productId,
        product: o.product,
        quantity: o.qty,
        unitPrice: o.unit,
        monthlyHosting: o.monthly,
        branding: o.branding,
        finish: o.finish,
        addOns: o.addOns,
        addOnTotal: o.addOnTotal,
        features: o.features || [],
        profileName: o.profileName || '',
        profileUrl: o.profileUrl || '',
        // money
        subtotal: o.subtotal,
        discount: o.discount + o.promoAmount,
        promoCode: (o.promo && o.promo.code) || '',
        promoAmount: o.promoAmount || 0,
        shipping: o.shipping,
        shippingZone: o.zone,
        codFee: o.cod,
        paymentMethod: o.payment,
        total: o.total,
        deposit: o.deposit,
        balance: o.balance,
        currency: CFG.pricing.currencyCode,
        // how they got here
        pageUrl: location.href,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        locale: navigator.language || '',
        timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })(),
        screen: (window.screen ? window.screen.width + 'x' + window.screen.height : ''),
        consent: consentGranted() ? 'analytics yes · storage yes' : 'necessary only',
        utm: utmTags(),
        submittedAt: new Date().toISOString(),
      };

      submitBtn.disabled = true;
      noteSubmission();

      // keep a copy locally so admin.html can show it straight away
      const stored = saveLocalOrder(payload);

      try {
        if (mode === 'email') {
          // no backend: hand the whole booking to their mail app
          const subject = 'Booking: ' + o.date + ' ' + o.slot + ' — ' + o.qty + ' × ' + o.product + ' — ' + name;
          const body = bookingEmailBody(payload);
          window.location.href = 'mailto:' + CFG.order.orderEmail +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
          showStatus('ok', 'Your email app should open with the booking details. Send it and we will reply to confirm your slot.');

        } else if (mode === 'worker' || mode === 'd1') {
          // our own Cloudflare Function: saves the booking in D1 and emails it
          const res = await fetch(CFG.order.endpoint || '/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
          });
          let out = {};
          try { out = await res.json(); } catch (e) { out = {}; }
          if (!res.ok || out.ok === false) {
            throw new Error(out.error || ('Endpoint returned ' + res.status));
          }
          if (out.id && stored) { stored.id = out.id; }
          showStatus('ok', CFG.order.successMessage + (out.emailed === false ? '' : ''));

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
        // never lose a booking: if our database does not answer, put the whole
        // booking in their mail app instead, already addressed to us
        if (mode === 'worker' || mode === 'd1') {
          const subject = 'Booking: ' + o.date + ' ' + o.slot + ' — ' + o.qty + ' × ' + o.product + ' — ' + name;
          try {
            window.location.href = 'mailto:' + CFG.order.orderEmail +
              '?subject=' + encodeURIComponent(subject) +
              '&body=' + encodeURIComponent(bookingEmailBody(payload));
            showStatus('ok', 'Our booking system is busy right now, so your email app should open with the booking ready to send. Please send it — we will reply to confirm your slot.');
          } catch (e) {
            showStatus('err', 'Sorry, we could not send your booking. Please email us at ' + CFG.brand.email + '.');
          }
        } else {
          showStatus('err', 'Sorry, we could not send your booking. Please email us at ' + CFG.brand.email + '.');
        }
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
        renderFeaturePick();
        calculateTotal();
        // step 3 of the flow: everything they typed comes with them
        applyFlowToForm();
        scrollToSection('#preorder');
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
    if (wanted && P[wanted]) {
      const wt = typeForProduct(wanted);
      if (wt) {
        booking.type = wt.id;
        $$('.btype').forEach((c) => c.classList.toggle('is-active', c.dataset.type === wt.id));
      }
    }

    setQty(1);
    applyLogo();
    initHeroCard();
    initShowcaseFlow();
    initBookingFreePage();
    trackNameField();

    // smooth anchor scrolling that clears the sticky header
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        // going straight to the booking form keeps what they typed
        if (id === 'preorder') applyFlowToForm();
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
