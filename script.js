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
      priv.innerHTML = pv.paragraphs.map((p) => {
        const text = (p && typeof p === 'object') ? p.text : p;
        const style = (p && typeof p === 'object' && p.style === 'small')
          ? ' style="font-size:.8125rem;color:var(--text-faint);"' : '';
        let html = SEO.richText ? SEO.richText(text) : String(text);
        html = html.split('{email}').join(
          email ? '<a href="mailto:' + email + '" style="color:var(--brand-dark);text-decoration:underline;">' + email + '</a>' : ''
        );
        html = html.split('{brand}').join(CFG.brand.name || '');
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
      : (p.badge ? '<span class="product__badge">' + icon('shield-check', 15) + esc(p.badge) + '</span>' : '');

    const art = p.thumb || (p.faces && (p.faces.front || p.faces.back)) || '';
    const visual = art
      ? '<div class="product__media" aria-hidden="true"><img src="' + esc(art) + '" alt="" loading="lazy" width="320" height="202"></div>'
      : '<div class="product__media product__media--icon"><span class="product__icon">' + icon(p.icon, 24) + '</span></div>';

    return ''
      + '<article class="product" data-product-card="' + p.id + '">'
      +   '<div>'
      +     visual
      +     '<h3>' + esc(p.name) + '</h3>'
      +     '<p class="product__blurb">' + esc(p.blurb) + '</p>'
      +   '</div>'
      +   '<div class="product__price-block">'
      +     '<div class="product__price">'
      +       '<span class="product__amount">' + money(p.price) + '</span>'
      +       '<span class="product__note">' + esc(p.priceNote) + '</span>'
      +     '</div>'
      +     recurring
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
    const avatar = m.photo
      ? '<img src="' + esc(m.photo) + '" alt="" loading="lazy" width="76" height="76">'
      : esc(m.initials || '');
    return ''
      + '<article class="member">'
      +   '<div class="member__avatar" aria-hidden="true">' + avatar + '</div>'
      +   '<h3>' + esc(m.name) + '</h3>'
      +   '<p class="member__role">' + esc(m.role) + '</p>'
      +   '<p class="member__bio">' + esc(m.bio) + '</p>'
      + '</article>';
  }

  function renderAll() {
    const order = CFG.pricing.order;

    const grid = $('#productGrid');
    if (grid) grid.innerHTML = order.map((id) => productCard(P[id])).join('');

    const choices = $('#choiceList');
    if (choices) choices.innerHTML = order.map((id, i) => choiceRow(P[id], i === 0)).join('');

    const faq = $('#faqList');
    if (faq) faq.innerHTML = CFG.faq.map(faqItem).join('');

    const team = $('#teamGrid');
    if (team) team.innerHTML = CFG.team.map(memberCard).join('');

    const mt = $('#modelToggle');
    if (mt) {
      mt.innerHTML = order.map((id, i) =>
        '<button type="button" data-model="' + id + '" aria-pressed="' + (i === 0) + '">' +
        esc(P[id].shortName) + '</button>'
      ).join('');
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

  // {card} {acrylic} {hosting} → live prices, so copy can never drift
  function tokens(str) {
    return SEO.tokens ? SEO.tokens(CFG, str) : String(str);
  }

  /* ------------------------------------------------------------------ *
   * 4. PRICING
   * ------------------------------------------------------------------ */
  let qty = 1;

  function currentProduct() {
    const checked = $('input[name="productChoice"]:checked');
    return checked ? P[checked.value] : P[CFG.pricing.order[0]];
  }

  function bulkDiscount(subtotal) {
    const b = CFG.pricing.bulk;
    if (!b || !b.enabled) return 0;
    let pct = 0;
    b.tiers.forEach((t) => { if (qty >= t.minQty) pct = Math.max(pct, t.percent); });
    return Math.round(subtotal * pct / 100);
  }

  function calculateTotal() {
    const p = currentProduct();
    const subtotal = p.price * qty;
    const discount = bulkDiscount(subtotal);
    const total = subtotal - discount;

    const totalEl = $('#displayTotal');
    if (totalEl) totalEl.textContent = money(total);

    const hostEl = $('#displayHosting');
    if (hostEl) {
      if (p.monthly) {
        hostEl.hidden = false;
        hostEl.textContent = '+ ' + money(p.monthly * qty) + ' / month hosting';
      } else {
        hostEl.hidden = true;
      }
    }

    const saveEl = $('#displaySaving');
    if (saveEl) {
      if (discount > 0) { saveEl.hidden = false; saveEl.textContent = 'You save ' + money(discount); }
      else saveEl.hidden = true;
    }

    // mirror selection onto the product cards — single source of truth
    $$('[data-product-card]').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.productCard === p.id);
    });

    return { p: p, subtotal, discount, total };
  }

  function selectProduct(id) {
    const radio = $('input[name="productChoice"][value="' + id + '"]');
    if (radio) { radio.checked = true; }
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
  let currentColor = CFG.brand.colors.brand;
  let currentModel = CFG.pricing.order[0];

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

    function build(modelId, name, hex, side) {
      const model = P[modelId] || P[CFG.pricing.order[0]];
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
      const faceMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.05 });
      const backMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.05 });

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

      // ---- swap in the real printed artwork when it is ready ----
      if (hasFaces(model)) {
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
            faceMat.roughness = 0.62;
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
            backMat.roughness = 0.62;
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

    const heroV = buildViewer($('#hero3d'), { idleSpin: true, ariaLabel: '3D preview of a TapAsul NFC card. Use arrow keys to rotate.' });
    const studioV = buildViewer($('#studio3d'), { idleSpin: false, ariaLabel: '3D preview of your customised TapAsul product. Use arrow keys to rotate.' });

    viewers.push(heroV, studioV);

    function rebuild() {
      viewers.forEach((v) => v && v.build(state.model, state.name, state.color, state.side));
      const label = state.name || 'TapAsul product';
      ['#hero3d', '#studio3d'].forEach((sel) => {
        const el = $(sel);
        if (el) el.setAttribute('aria-label', '3D product preview for ' + label + '. Use arrow keys to rotate.');
      });
    }

    rebuild();

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

        // keep the order form in sync with what they're looking at
        const radio = $('input[name="productChoice"][value="' + state.model + '"]');
        if (radio) { radio.checked = true; calculateTotal(); }

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
    const status = $('#formStatus');
    const submitBtn = $('#submitBtn');

    function setError(el, msg) {
      const err = $('#' + el.id.replace('customer', '').toLowerCase() + 'Error');
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    }

    function validate() {
      let ok = true;
      const n = nameEl.value.trim();
      const e = emailEl.value.trim();

      if (n.length < 2) { setError(nameEl, 'Please enter your full name.'); ok = false; }
      else setError(nameEl, '');

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { setError(emailEl, 'Please enter a valid email address.'); ok = false; }
      else setError(emailEl, '');

      return ok;
    }

    [nameEl, emailEl].forEach((el) => el.addEventListener('input', () => setError(el, '')));

    function showStatus(type, msg) {
      if (!status) return;
      status.className = 'form-status is-visible form-status--' + type;
      status.textContent = msg;
    }

    function orderSummary() {
      const t = calculateTotal();
      return {
        productId: t.p.id,
        product: t.p.name,
        qty: qty,
        unit: t.p.price,
        monthly: t.p.monthly,
        discount: t.discount,
        total: t.total,
      };
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (trap.value) return;              // silent bot rejection
      if (!validate()) { showStatus('err', 'Please check the highlighted fields.'); return; }

      const o = orderSummary();
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const mode = CFG.order.mode;

      const payload = {
        name, email,
        productId: o.productId,
        product: o.product,
        quantity: o.qty,
        unitPrice: o.unit,
        monthlyHosting: o.monthly,
        discount: o.discount,
        total: o.total,
        currency: CFG.pricing.currencyCode,
        submittedAt: new Date().toISOString(),
      };

      submitBtn.disabled = true;

      // keep a copy locally so admin.html can show it straight away
      const stored = saveLocalOrder(payload);

      try {
        if (mode === 'email') {
          const subject = 'Pre-order: ' + o.qty + ' × ' + o.product;
          const body = [
            'Name: ' + name,
            'Email: ' + email,
            'Product: ' + o.product,
            'Quantity: ' + o.qty,
            'Unit price: ' + money(o.unit),
            'Monthly hosting: ' + (o.monthly ? money(o.monthly * o.qty) : 'none'),
            o.discount ? 'Discount: -' + money(o.discount) : '',
            'TOTAL: ' + money(o.total),
            '',
            'Sent from ' + CFG.brand.url,
          ].filter(Boolean).join('\n');
          window.location.href = 'mailto:' + CFG.order.orderEmail +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
          showStatus('ok', 'Your email app should open with the order details. Send it and we will reply to confirm.');

        } else if (mode === 'formspree' || mode === 'google-form' || mode === 'local') {
          if (mode !== 'local' && !CFG.order.endpoint) throw new Error('No endpoint configured');
          if (CFG.order.endpoint) {
            const res = await fetch(CFG.order.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(stored || payload),
            });
            if (!res.ok) throw new Error('Server responded ' + res.status);
          }
          showStatus('ok', CFG.order.successMessage);
          form.reset();
          setQty(1); calculateTotal();

        } else {
          showStatus('ok', CFG.order.successMessage + ' (Demo mode — nothing was actually sent.)');
        }
      } catch (err) {
        showStatus('err', 'Sorry, we could not send your order. Please email us at ' + CFG.brand.email + '.');
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
    });
    document.addEventListener('change', (e) => {
      if (e.target.name === 'productChoice') calculateTotal();
    });

    const minus = $('#qtyMinus'), plus = $('#qtyPlus'), qtyInput = $('#orderQty');
    if (minus) minus.addEventListener('click', () => setQty(qty - 1));
    if (plus) plus.addEventListener('click', () => setQty(qty + 1));
    if (qtyInput) {
      qtyInput.addEventListener('change', () => setQty(parseInt(qtyInput.value, 10)));
      qtyInput.addEventListener('blur', () => setQty(parseInt(qtyInput.value, 10)));
    }

    // deep link: ?product=acrylic
    const wanted = new URLSearchParams(location.search).get('product');
    if (wanted && P[wanted]) {
      const radio = $('input[name="productChoice"][value="' + wanted + '"]');
      if (radio) { radio.checked = true; currentModel = wanted; }
    }

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
