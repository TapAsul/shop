const { chromium } = require('/home/user/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const results = [];
function ok(name, pass, note) { results.push([pass ? 'PASS' : 'FAIL', name, note === undefined ? '' : String(note)]); }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], cerr = [], failed = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') cerr.push(m.text()); });
  p.on('requestfailed', r => failed.push(r.url() + ' ' + (r.failure() || {}).errorText));

  // visit a page, dismiss the consent gate, hand it back
  async function visit(page, file) {
    await page.goto(BASE + '/' + file, { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    await page.evaluate(() => {
      const gate = document.getElementById('consentGate');
      document.documentElement.dataset.gateSeen = gate ? String(!gate.hidden) : 'none';
      const a = document.getElementById('consentAccept');
      if (a) a.click();
    });
    await page.waitForTimeout(350);
    return page;
  }

  /* ---------- 1. HOME ---------- */
  await visit(p, 'index.html');
  const home = await p.evaluate(() => {
    const ld = document.querySelector('#structured-data');
    let types = [];
    try { types = JSON.parse(ld.textContent)['@graph'].map(n => n['@type']); } catch (e) { types = ['PARSE-FAIL']; }
    const nav = [...document.querySelectorAll('.nav a')];
    return {
      page: document.documentElement.dataset.page,
      title: document.title,
      gateVisible: document.documentElement.dataset.gateSeen === 'true',
      canvases: document.querySelectorAll('canvas').length,
      products: document.querySelectorAll('#productGrid .product:not(.product--skeleton)').length,
      sections: [...document.querySelectorAll('main section[id]')].map((x) => x.id),
      navLabels: nav.map((a) => a.textContent.trim()),
      navHrefs: nav.map((a) => a.getAttribute('href')),
      navActive: nav.filter((a) => a.classList.contains('is-active')).map((a) => a.textContent.trim()),
      cta: (document.querySelector('.header__cta .btn') || {}).getAttribute
        ? document.querySelector('.header__cta .btn').getAttribute('href') : '',
      ctaLabel: (document.querySelector('.header__cta .btn .cta-label') || {}).textContent || '',
      studio: !!document.querySelector('#customizer'),
      studioBtn: !!document.querySelector('.hero__actions .btn--ghost'),
      three: typeof window.THREE !== 'undefined',
      hero3d: !!document.querySelector('#card3d'),
      heroFaces: document.querySelectorAll('.card3d__face').length,
      h1: [...document.querySelectorAll('h1')].length,
      h1Text: (document.querySelector('h1') || {}).textContent || '',
      ldTypes: types,
      legalLinks: document.querySelectorAll('.footer a[href*="terms"], .footer a[href*="refund"], .footer a[href*="privacy"]').length,
      privacyLink: !!document.querySelector('.footer a[href*="privacy-policy"]'),
      footerHelp: [...document.querySelectorAll('.footer a')].map((a) => a.getAttribute('href')),
      // the four things that must NOT be in the header any more
      headerHasFaq: nav.some((a) => /faq/i.test(a.getAttribute('href') || '')),
      headerHasSupport: nav.some((a) => /support/i.test(a.getAttribute('href') || '')),
      headerHasPrivacy: nav.some((a) => /privacy|terms|refund/i.test(a.getAttribute('href') || '')),
      showcase: !!document.querySelector('#profileCta'),
      marketingBand: !!document.querySelector('.page-cta'),
    };
  });
  ok('home loads, no JS errors', errs.length === 0 && cerr.length === 0, errs.concat(cerr).join(' | '));
  ok('no failed requests', failed.length === 0, failed.join(' | '));
  ok('consent gate visible on 1st visit', home.gateVisible);
  ok('home is the home page (data-page + one h1)', home.page === 'home' && home.h1 === 1, home.page + ' / h1=' + home.h1);
  ok('home shows hero, my work, the demo and pricing — in that order',
     JSON.stringify(home.sections) === JSON.stringify(['home', 'work', 'live', 'products']), home.sections.join(', '));
  ok('2 products rendered (standard + premium)', home.products === 2, home.products);
  ok('the header has exactly Home / Product & Pricing / About Us / Booking',
     home.navLabels.join('|') === 'Home|Product & Pricing|About Us|Booking', home.navLabels.join(' | '));
  ok('every header link points at a real page',
     home.navHrefs.join('|') === 'index.html|pricing.html|about.html|booking.html', home.navHrefs.join(' | '));
  ok('the header marks the page you are on', home.navActive.join(',') === 'Home', home.navActive.join(','));
  ok('the header button says Order Now and goes to booking',
     /order now/i.test(home.ctaLabel) && home.cta === 'booking.html', home.ctaLabel + ' -> ' + home.cta);
  ok('FAQ, contact and legal are NOT in the header',
     !home.headerHasFaq && !home.headerHasSupport && !home.headerHasPrivacy,
     JSON.stringify({ faq: home.headerHasFaq, support: home.headerHasSupport, legal: home.headerHasPrivacy }));
  ok('FAQ, contact and legal ARE in the footer',
     home.footerHelp.indexOf('faq.html') > -1 &&
     home.footerHelp.indexOf('support.html') > -1 &&
     home.footerHelp.indexOf('privacy-policy.html') > -1,
     home.footerHelp.slice(-8).join(' '));
  ok('the old 3D studio is gone (no section, no button, no three.js)', !home.studio && !home.studioBtn && !home.three && home.canvases === 0, JSON.stringify({ studio: home.studio, btn: home.studioBtn, three: home.three, canvas: home.canvases }));
  ok('the hero shows a card with a front and a back', home.hero3d && home.heroFaces === 2, JSON.stringify({ hero3d: home.hero3d, faces: home.heroFaces }));
  ok('JSON-LD Organization+WebSite+2 Products+FAQPage', ['Organization', 'WebSite', 'Product', 'FAQPage'].every(t => home.ldTypes.includes(t)) && home.ldTypes.filter(t => t === 'Product').length === 2, home.ldTypes.join(','));
  ok('footer links Terms/Refund/Privacy', home.legalLinks >= 3 && home.privacyLink, home.legalLinks);

  const noAcrylic = await p.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return { page: /acrylic|standee/.test(t), order: window.TAPASUL_CONFIG.pricing.order.join(',') };
  });
  ok('no acrylic wording on the page, order = card + premium only',
     !noAcrylic.page && noAcrylic.order === 'card,premium', JSON.stringify(noAcrylic));

  // ---- the product cards on Home ----
  const prem = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('#productGrid .product')];
    const prem = cards.find((c) => c.dataset.productCard === 'premium');
    return {
      premiumCard: !!prem,
      amount: prem ? prem.querySelector('.product__amount').textContent.trim() : '',
      recurring: prem ? prem.querySelector('.product__recurring').textContent.replace(/\s+/g, ' ').trim() : '',
      features: prem ? prem.querySelectorAll('.product__features li').length : 0,
      badge: prem ? (prem.querySelector('.product__badge') || {}).textContent : '',
      selectBtn: !!document.querySelector('[data-select-product="card"]'),
    };
  });
  ok('premium card: \u20b12,499 + \u20b299/month', prem.premiumCard && prem.amount.replace(/[^\d]/g, '') === '2499' && /299/.test(prem.recurring), JSON.stringify(prem).slice(0, 200));
  ok('premium card lists the logo customisation', /logo/i.test(prem.badge) && prem.features >= 5, prem.badge + ' / ' + prem.features + ' features');

  // ---- the demo: live profile strip + the free-page CTA ----
  const live = await p.evaluate(() => {
    const track = document.querySelector('#profileTrack');
    const items = [...document.querySelectorAll('.marquee__item')];
    const cta = document.querySelector('#profileCta');
    const btn = document.querySelector('.showcase__btn');
    return {
      section: !!document.querySelector('#live'),
      items: items.length,
      halves: document.querySelectorAll('.marquee__half').length,
      firstHref: items[0] ? items[0].getAttribute('href') : '',
      animation: track ? getComputedStyle(track).animationName : 'none',
      duration: track ? getComputedStyle(track).animationDuration : '',
      ctaTitle: cta ? (cta.querySelector('strong') || {}).textContent || '' : '',
      ctaSample: cta ? ((cta.querySelector('.showcase__urlInput') || {}).placeholder || '') : '',
      ctaNote: cta ? (cta.querySelector('.showcase__note') || {}).textContent || '' : '',
      btnText: btn ? btn.textContent.trim() : '',
    };
  });
  ok('the demo (live profiles) is on Home', live.section && live.items >= 6 && live.halves === 2, live.items + ' chips');
  ok('the strip points at portal.tapasul.com', /portal\.tapasul\.com\/r\//.test(live.firstHref || ''), live.firstHref);
  ok('the strip actually moves', /marquee/.test(live.animation || '') && live.duration !== '0s', live.animation + ' ' + live.duration);
  ok('the free-page CTA is there', /page is free/i.test(live.ctaTitle) && /yourname/.test(live.ctaSample) && live.btnText.length > 3, live.ctaTitle + ' | ' + live.btnText);
  ok('the CTA says the free page only comes with a card',
     /digital card/i.test(live.ctaNote || '') && /not sold on its own|only/i.test(live.ctaNote || ''), live.ctaNote);

  const strip = await p.evaluate(() => {
    const items = [...document.querySelectorAll('.marquee__half:first-child .marquee__item')];
    const tops = [...new Set(items.map((i) => Math.round(i.getBoundingClientRect().top)))];
    return { rows: tops.length, items: items.length };
  });
  ok('the profile strip is one straight line', strip.rows === 1 && strip.items >= 6, JSON.stringify(strip));
  const xA = await p.evaluate(() => Math.round(document.querySelector('.marquee__track').getBoundingClientRect().left));
  await p.waitForTimeout(1100);
  const xB = await p.evaluate(() => Math.round(document.querySelector('.marquee__track').getBoundingClientRect().left));
  ok('the strip moves to the right', xB > xA, xA + ' -> ' + xB);

  /* ---------- 1b. PRODUCT & PRICING ---------- */
  await visit(p, 'pricing.html');
  const pricing = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('.nav a')];
    const rows = [...document.querySelectorAll('#compareTable tbody tr')];
    const groups = rows.filter((r) => r.classList.contains('cmp__group')).map((r) => r.textContent.trim());
    const cells = [...document.querySelectorAll('#compareTable tbody tr:not(.cmp__group) .cmp__cell')];
    const cards = [...document.querySelectorAll('.inside-card')];
    return {
      page: document.documentElement.dataset.page,
      h1: (document.querySelector('h1') || {}).textContent || '',
      active: nav.filter((a) => a.classList.contains('is-active')).map((a) => a.textContent.trim()),
      sections: [...document.querySelectorAll('main section[id]')].map((x) => x.id),
      cols: [...document.querySelectorAll('#compareTable thead th')].length,
      colNames: [...document.querySelectorAll('.cmp__col-name')].map((e) => e.textContent.trim()),
      colPrices: [...document.querySelectorAll('.cmp__col-price')].map((e) => e.textContent.trim()),
      groups: groups,
      rows: rows.filter((r) => !r.classList.contains('cmp__group')).length,
      ticks: cells.filter((c) => c.querySelector('.cmp__yes')).length,
      dashes: cells.filter((c) => c.querySelector('.cmp__no')).length,
      ctas: [...document.querySelectorAll('.cmp__cta')].map((b) => b.textContent.trim()),
      insideCards: cards.length,
      insideLinks: [...document.querySelectorAll('.inside-card__link')].map((a) => a.getAttribute('href')),
      featuredTiles: document.querySelectorAll('.inside__tile').length,
      products: document.querySelectorAll('#productGrid .product:not(.product--skeleton)').length,
      overflowsX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  ok('pricing page loads with the nav on "Product & Pricing"',
     pricing.page === 'pricing' && pricing.active.join('') === 'Product & Pricing', pricing.page + ' / ' + pricing.active.join(''));
  ok('pricing page has one h1 and the pricing sections',
     !!pricing.h1 && pricing.sections.join(',').indexOf('products') > -1 && pricing.sections.indexOf('compare') > -1,
     pricing.sections.join(', '));
  ok('the comparison table has 3 columns (label + 2 tiers)',
     pricing.cols === 3 && pricing.colNames.join('|') === 'Standard|Premium', pricing.colNames.join(' | '));
  ok('the comparison table shows live prices',
     /999/.test(pricing.colPrices[0] || '') && /2,499/.test(pricing.colPrices[1] || ''), pricing.colPrices.join(' / '));
  ok('the comparison table groups the rows and mixes ticks, dashes and text',
     pricing.groups.length >= 4 && pricing.rows >= 12 && pricing.ticks > 5 && pricing.dashes >= 2,
     JSON.stringify({ groups: pricing.groups.length, rows: pricing.rows, ticks: pricing.ticks, dashes: pricing.dashes }));
  ok('each tier has its own "Choose" button', pricing.ctas.length === 2 && /standard|premium/i.test(pricing.ctas[0] + pricing.ctas[1]), pricing.ctas.join(' | '));
  ok('the table does not push the page sideways on desktop', !pricing.overflowsX);
  ok('the old "what\'s inside" section is gone (the table covers it now)',
     !pricing.sections.includes('inside') && pricing.insideCards === 0 && pricing.featuredTiles === 0,
     pricing.sections.join(', ') + ' / cards=' + pricing.insideCards);

  /* ---------- 1c. ABOUT US ---------- */
  await visit(p, 'about.html');
  const about = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('.nav a')];
    return {
      page: document.documentElement.dataset.page,
      active: nav.filter((a) => a.classList.contains('is-active')).map((a) => a.textContent.trim()),
      team: document.querySelectorAll('.member').length,
      teamPhotos: document.querySelectorAll('.member__avatar img').length,
      work: document.querySelectorAll('.work__item').length,
      workEmpty: !!document.querySelector('.work__empty'),
      workCfg: (window.TAPASUL_CONFIG.myWork && window.TAPASUL_CONFIG.myWork.items || []).length,
      sections: [...document.querySelectorAll('main section[id]')].map((x) => x.id),
    };
  });
  ok('about page loads with the nav on "About Us"',
     about.page === 'about' && about.active.join('') === 'About Us', about.page + ' / ' + about.active.join(''));
  ok('the team is on the About page (2 people, 1 photo)',
     about.team === 2 && about.teamPhotos === 1, about.team + '/' + about.teamPhotos);
  ok('the About page is now just the page head, the team and the CTA',
     JSON.stringify(about.sections) === JSON.stringify(['top', 'team']) && about.work === 0,
     about.sections.join(', ') + ' / tiles=' + about.work);

  /* ---------- 1d. BOOKING ---------- */
  await visit(p, 'booking.html');
  const bk = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('.nav a')];
    return {
      page: document.documentElement.dataset.page,
      active: nav.filter((a) => a.classList.contains('is-active')).map((a) => a.textContent.trim()),
      types: document.querySelectorAll('.btype').length,
      slots: document.querySelectorAll('.slot').length,
      dateMin: (document.getElementById('bookingDate') || {}).min || '',
      lead: window.TAPASUL_CONFIG.booking.leadDays,
      promo: !!document.getElementById('promoCode'),
      cta: (document.getElementById('bookingCtaTotal') || {}).textContent || '',
      glass: document.querySelectorAll('.glass').length,
      step: document.querySelectorAll('.booking__steps li').length,
      deliverySteps: document.querySelectorAll('#deliverySteps li').length,
      zones: document.querySelectorAll('#shippingZone option').length,
      payments: document.querySelectorAll('#paymentMethod option').length,
      addOns: document.querySelectorAll('#addOnsList input').length,
      freePage: !!document.getElementById('bookingFreePage'),
      summary: !!document.getElementById('summaryRows'),
    };
  });
  ok('booking page loads with the nav on "Booking"',
     bk.page === 'booking' && bk.active.join('') === 'Booking', bk.page + ' / ' + bk.active.join(''));
  ok('booking UI: 2 types, 3 glass panels, 4 step dots, the summary',
     bk.types === 2 && bk.glass === 3 && bk.step === 4 && bk.summary, JSON.stringify(bk).slice(0, 200));
  ok('the free-page box lives inside the booking form', bk.freePage);
  ok('booking date starts at the lead time', !!bk.dateMin, bk.dateMin);
  ok('3 delivery zones + 4 payment methods', bk.zones === 3 && bk.payments === 4, bk.zones + '/' + bk.payments);
  ok('add-ons section removed from booking form', bk.addOns === 0, bk.addOns);
  ok('promo code box present + CTA shows the total', bk.promo && /\u20b1/.test(bk.cta), bk.cta);
  ok('4 delivery steps are on the booking page', bk.deliverySteps === 4, bk.deliverySteps);
  const premType = await p.evaluate(() => {
    const btype = document.querySelector('.btype[data-type="premium"]');
    return {
      btype: !!btype,
      btypePrice: btype ? btype.querySelector('.btype__price').textContent.replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok('premium booking option exists at the premium price',
     premType.btype && /2,499/.test(premType.btypePrice) && /299/.test(premType.btypePrice), premType.btypePrice);

  /* ---------- 1e. FAQ ---------- */
  await visit(p, 'faq.html');
  const faqPage = await p.evaluate(() => ({
    page: document.documentElement.dataset.page,
    faqs: document.querySelectorAll('#faqList details').length,
    h1: (document.querySelector('h1') || {}).textContent || '',
    active: [...document.querySelectorAll('.nav a.is-active')].length,
  }));
  ok('14 FAQs live on their own page', faqPage.page === 'faq' && faqPage.faqs === 14, faqPage.faqs);
  ok('the FAQ page is footer-only (no nav item highlighted)', faqPage.active === 0, faqPage.active);

  /* ---------- 1f. CONTACT & SUPPORT ---------- */
  await visit(p, 'support.html');
  const support = await p.evaluate(() => ({
    page: document.documentElement.dataset.page,
    cards: document.querySelectorAll('#supportGrid .support-card').length,
    privacy: !!document.querySelector('#privacy'),
    active: [...document.querySelectorAll('.nav a.is-active')].length,
  }));
  ok('3 support channels on Contact & Support', support.page === 'support' && support.cards === 3, support.cards);
  ok('the plain-language data note is on the support page', support.privacy);

  /* ---------- 1g. every page shares the same header + footer ---------- */
  const PAGES = ['index.html', 'pricing.html', 'about.html', 'booking.html', 'faq.html', 'support.html'];
  const shell = [];
  const pageErrs = [];
  for (const f of PAGES) {
    await p.goto(BASE + '/' + f, { waitUntil: 'load' });
    await p.waitForTimeout(700);
    const info = await p.evaluate(() => ({
      nav: [...document.querySelectorAll('.nav a')].map((a) => a.textContent.trim()).join('|'),
      footer: document.querySelectorAll('.footer a').length,
      h1: document.querySelectorAll('h1').length,
      bookingLink: !!document.querySelector('a[href="booking.html"]'),
      consoleErr: 0,
    }));
    shell.push(f + ':' + (info.nav === 'Home|Product & Pricing|About Us|Booking' ? 'ok' : 'BAD') + (info.h1 === 1 ? '' : '!h1'));
    pageErrs.push(info);
  }
  ok('all 6 pages have the same 4-item header and exactly one h1',
     shell.every((x) => x.endsWith('ok')) && pageErrs.every((i) => i.h1 === 1), shell.join(' '));
  ok('all 6 pages link to the booking page', pageErrs.every((i) => i.bookingLink));
  await visit(p, 'index.html');

  /* ---------- 2. consent: accept (fresh browser, so the gate is showing) ---------- */
  const ctxC = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const pc = await ctxC.newPage();
  await pc.goto(BASE + '/index.html', { waitUntil: 'load' });
  await pc.waitForTimeout(1200);
  const gateShown = await pc.isVisible('#consentAccept');
  await pc.click('#consentAccept');
  await pc.waitForTimeout(500);
  const acc = await pc.evaluate(() => ({
    state: document.documentElement.dataset.consent,
    hidden: document.getElementById('consentGate').hidden,
    stored: localStorage.getItem('tapasul_consent_v1'),
  }));
  ok('consent accept stores granted + hides gate',
     gateShown && acc.state === 'granted' && acc.hidden && acc.stored === 'granted', JSON.stringify(acc));
  await ctxC.close();

  /* ---------- 3. booking math (on the booking page) ---------- */
  await visit(p, 'booking.html');
  // pick the next open day so the audit passes whatever day it runs
  await p.evaluate(() => {
    const cfg = window.TAPASUL_CONFIG.booking;
    const days = cfg.days || [0, 1, 2, 3, 4, 5, 6];
    const d = new Date(); d.setDate(d.getDate() + (cfg.leadDays || 0));
    for (let i = 0; i < 14; i++) {
      if (days.indexOf(d.getDay()) !== -1) break;
      d.setDate(d.getDate() + 1);
    }
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const el = document.getElementById('bookingDate');
    el.value = iso; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(300);
  const slotInfo = await p.evaluate(() => ({
    slots: document.querySelectorAll('.slot').length,
    disabled: document.querySelectorAll('.slot:disabled').length,
  }));
  ok('time-slot grid renders for the chosen date', slotInfo.slots === 7, JSON.stringify(slotInfo));
  await p.click('.slot >> nth=0');
  await p.waitForTimeout(250);
  const slotOn = await p.evaluate(() => !!document.querySelector('.slot.is-active'));
  ok('a time slot can be selected', slotOn);
  await p.evaluate(() => { document.getElementById('orderQty').value = '3'; document.getElementById('orderQty').dispatchEvent(new Event('input', { bubbles: true })); });
  await p.selectOption('#shippingZone', { index: 0 });
  await p.waitForTimeout(300);
  const t1 = await p.evaluate(() => document.querySelector('#displayTotal').textContent.trim());
  ok('qty 3 + metro shipping = ₱3,147', t1.replace(/[^\d]/g, '') === '3147', t1);

  await p.selectOption('#paymentMethod', 'cod');
  await p.waitForTimeout(300);
  const t2 = await p.evaluate(() => document.querySelector('#displayTotal').textContent.trim());
  ok('COD adds ₱50 → ₱3,197', t2.replace(/[^\d]/g, '') === '3197', t2);

  const before = await p.evaluate(() => document.querySelector('#displayTotal').textContent.trim());
  const paidBoxes = await p.$$('#addOnsList input');
  ok('no add-on checkboxes remain in the form', paidBoxes.length === 0, paidBoxes.length);

  const brk = await p.evaluate(() => document.getElementById('summaryRows').textContent.replace(/\s+/g, ' '));
  ok('summary lists delivery + payment + add-ons', /Delivery/.test(brk) && /Cash on delivery|Cash-on-delivery/i.test(brk) && /\u20b1/.test(brk), brk.slice(0, 180));

  /* ---------- 3b. promo code ---------- */
  await p.fill('#promoCode', 'TAPASUL10');
  await p.click('#promoApply');
  await p.waitForTimeout(350);
  const promo = await p.evaluate(() => ({
    hint: document.getElementById('promoHint').textContent.trim(),
    total: document.getElementById('displayTotal').textContent.trim(),
    rows: document.getElementById('summaryRows').textContent.replace(/\s+/g, ' '),
  }));
  ok('a valid promo code discounts the total', /10%|Launch/i.test(promo.hint) && /Launch/i.test(promo.rows), promo.hint + ' | ' + promo.total);
  await p.fill('#promoCode', 'NOPECODE');
  await p.click('#promoApply');
  await p.waitForTimeout(300);
  const badPromo = await p.evaluate(() => document.getElementById('promoHint').textContent.trim());
  ok('an invalid promo code is rejected', /not valid/i.test(badPromo), badPromo);
  await p.fill('#promoCode', 'TAPASUL10');
  await p.click('#promoApply');
  await p.waitForTimeout(250);

  /* ---------- 4. validation ---------- */
  await p.fill('#customerName', 'A');
  await p.fill('#customerEmail', 'nope');
  await p.fill('#customerPhone', '123');
  await p.fill('#customerAddress', '');
  await p.click('#preOrderForm button[type="submit"]');
  await p.waitForTimeout(400);
  const inval = await p.evaluate(() => ({
    name: document.getElementById('customerName').getAttribute('aria-invalid'),
    email: document.getElementById('customerEmail').getAttribute('aria-invalid'),
    phone: document.getElementById('customerPhone').getAttribute('aria-invalid'),
    addr: document.getElementById('customerAddress').getAttribute('aria-invalid'),
    err: (document.getElementById('addressError') || {}).textContent,
  }));
  ok('address/name/email/phone validation fires', inval.name === 'true' && inval.email === 'true' && inval.addr === 'true' && inval.phone === 'true', JSON.stringify(inval));

  /* ---------- 4b. anti-spam (fresh page so the dwell clock starts now) ---------- */
  const pb = await ctx.newPage();
  await pb.goto(BASE + '/booking.html', { waitUntil: 'load' });
  await pb.waitForTimeout(2200);
  await pb.evaluate(() => {
    const cfg = window.TAPASUL_CONFIG.booking;
    const days = cfg.days || [0, 1, 2, 3, 4, 5, 6];
    const d = new Date(); d.setDate(d.getDate() + (cfg.leadDays || 0));
    for (let i = 0; i < 14; i++) {
      if (days.indexOf(d.getDay()) !== -1) break;
      d.setDate(d.getDate() + 1);
    }
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const el = document.getElementById('bookingDate');
    el.value = iso; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pb.waitForTimeout(250);
  await pb.click('.slot >> nth=0');
  await pb.fill('#customerName', 'Juan Dela Cruz');
  await pb.fill('#customerEmail', 'juan@example.com');
  await pb.fill('#customerPhone', '09171234567');
  await pb.fill('#customerAddress', '12 Katipunan Ave, Quezon City, 1108');
  await pb.click('#preOrderForm button[type="submit"]');
  await pb.waitForTimeout(500);
  const spam = await pb.evaluate(() => ({
    status: (document.getElementById('formStatus') || {}).textContent || '',
    stored: (localStorage.getItem('tapasul_bookings_v1') || '').length,
  }));
  ok('instant submit is blocked (min dwell)', /One moment/i.test(spam.status) && spam.stored < 10, JSON.stringify(spam).slice(0, 160));
  await pb.waitForTimeout(2700);
  await pb.click('#preOrderForm button[type="submit"]');
  await pb.waitForTimeout(700);
  const good = await pb.evaluate(() => ({
    status: (document.getElementById('formStatus') || {}).textContent || '',
    stored: (localStorage.getItem('tapasul_bookings_v1') || '').length,
    rate: (localStorage.getItem('tapasul_booking_rate_v1') || '').length,
    record: JSON.parse(localStorage.getItem('tapasul_bookings_v1') || '[]')[0] || {},
  }));
  ok('a real booking goes through after the dwell', good.stored > 10 && /One moment/i.test(good.status) === false, JSON.stringify(good).slice(0, 200));
  ok('the booking stores date + slot + phone', !!good.record.date && !!good.record.slot && !!good.record.phone,
     JSON.stringify({ date: good.record.date, slot: good.record.slot, phone: good.record.phone }));
  await pb.close();

  /* ---------- 4d. "choose your feature" picker ---------- */
  // make sure we are on the Standard card first — the picker only shows there
  await p.evaluate(() => {
    const b = document.querySelector('.btype[data-type="standard"]');
    if (b) b.click();
  });
  await p.waitForTimeout(500);
  const picker = await p.evaluate(() => {
    const chips = [...document.querySelectorAll('#featurePickList .chip')];
    return {
      visible: !document.querySelector('#featurePickBlock').hidden,
      count: chips.length,
      labels: chips.map((c) => c.textContent.trim()),
    };
  });
  ok('booking form shows the "choose your features" picker', picker.visible && picker.count >= 7, picker.count + ' chips');
  ok('picker offers every featured feature',
     picker.labels.length >= 7 && picker.labels.includes('Client Reviews') && picker.labels.includes('Payment method'),
     picker.labels.join(' | '));

  const totalBefore = await p.evaluate(() => document.getElementById('displayTotal').textContent);
  await p.evaluate(() => { document.querySelector('#featurePickList .chip').click(); });
  await p.waitForTimeout(250);
  const one = await p.evaluate(() => ({
    on: document.querySelectorAll('#featurePickList .chip.is-on').length,
    summary: document.getElementById('summaryRows').textContent.replace(/\s+/g, ' '),
    total: document.getElementById('displayTotal').textContent,
    hint: (document.querySelector('#featurePickHint') || {}).textContent || '',
  }));
  ok('the standard card lets the customer pick one feature', one.on === 1, JSON.stringify({ on: one.on, hint: one.hint }));
  ok('the picked feature shows in the summary without changing the price',
     /Features/.test(one.summary) && /Client Reviews/.test(one.summary) && one.total === totalBefore,
     one.summary.slice(0, 90) + ' | total ' + one.total + ' (was ' + totalBefore + ')');

  await p.evaluate(() => { document.querySelectorAll('#featurePickList .chip')[1].click(); });
  await p.waitForTimeout(250);
  const twoTry = await p.evaluate(() => ({
    on: document.querySelectorAll('#featurePickList .chip.is-on').length,
    err: (document.querySelector('#featurePickError') || {}).textContent || '',
  }));
  ok('a second feature is refused (only 1 allowed)',
     twoTry.on === 1 && /1 feature/.test(twoTry.err), JSON.stringify(twoTry));

  await p.evaluate(() => { document.querySelector('.btype[data-type="premium"]').click(); });
  await p.waitForTimeout(500);
  const prmPick = await p.evaluate(() => ({
    chips: document.querySelectorAll('#featurePickList .chip').length,
    hint: (document.querySelector('#featurePickHint') || {}).textContent || '',
  }));
  ok('premium booking has no picker (every feature included)', prmPick.chips === 0 && /every feature/i.test(prmPick.hint), JSON.stringify(prmPick));
  await p.evaluate(() => { document.querySelector('.btype[data-type="standard"]').click(); });
  await p.waitForTimeout(400);

  /* ---------- 4e. booked days and times are blocked ---------- */
  const ctxAv = await b.newContext({ viewport: { width: 1280, height: 950 } });
  // pretend four people already took every time on one day (maxPerSlot = 4)
  await ctxAv.addInitScript(() => {
    const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    const date = document.getElementById ? null : null; // placeholder, real date set below
    const d = new Date(); d.setDate(d.getDate() + 6);
    while (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    window.__fullDay = iso;
    const list = [];
    slots.forEach((s) => { for (let i = 0; i < 4; i++) list.push({ id: 'T' + s + i, date: iso, slot: s, status: 'new', created: Date.now() }); });
    localStorage.setItem('tapasul_bookings_v1', JSON.stringify(list));
  });
  const pAv = await ctxAv.newPage();
  const avErrs = [];
  pAv.on('pageerror', (e) => avErrs.push(e.message));
  await pAv.goto(BASE + '/booking.html', { waitUntil: 'load' });
  await pAv.waitForTimeout(1600);
  await pAv.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
  await pAv.waitForTimeout(500);
  await pAv.click('#dateTrigger');
  await pAv.waitForTimeout(700);
  const avState = await pAv.evaluate(() => {
    const full = document.querySelector('.datepick__day--full');
    return {
      panelOpen: !document.getElementById('datePanel').hidden,
      dayCells: document.querySelectorAll('.datepick__day[data-date]').length,
      fullDay: full ? full.dataset.date : '',
      fullBlocked: full ? full.disabled : false,
      fullTitle: full ? full.title : '',
      fullLabel: full ? full.getAttribute('aria-label') : '',
      matchesSeeded: !!full && full.dataset.date === window.__fullDay,
    };
  });
  ok('the date picker opens as a calendar with the month laid out',
     avState.panelOpen && avState.dayCells >= 28, JSON.stringify({ open: avState.panelOpen, cells: avState.dayCells }));
  ok('a day that is completely booked is greyed out and cannot be picked',
     avState.fullBlocked && avState.matchesSeeded && /fully booked/i.test(avState.fullLabel),
     JSON.stringify(avState));

  // the times on that day say "Full" too
  await pAv.evaluate(() => {
    const el = document.getElementById('bookingDate');
    el.value = window.__fullDay;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pAv.waitForTimeout(500);
  const avSlots = await pAv.evaluate(() => ({
    total: document.querySelectorAll('.slot').length,
    disabled: document.querySelectorAll('.slot:disabled').length,
    labels: [...document.querySelectorAll('.slot:disabled .slot__state')].map((x) => x.textContent.trim()),
    hint: (document.getElementById('slotHint') || {}).textContent || '',
  }));
  ok('every time on a fully booked day is disabled and marked "Full"',
     avSlots.disabled === avSlots.total && avSlots.labels.every((t) => /full/i.test(t)),
     JSON.stringify(avSlots));
  ok('the visitor is told to pick another day', /taken|another day/i.test(avSlots.hint), avSlots.hint);
  ok('the availability check runs without JS errors', avErrs.length === 0, avErrs.join(' | '));
  await ctxAv.close();

  /* ---------- 5. the hero card turns over, and the work gallery ---------- */
  await visit(p, 'index.html');
  await p.evaluate(() => document.getElementById('card3d').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(900);
  const ryBefore = await p.evaluate(() => {
    const c = document.getElementById('card3dInner');
    return parseFloat(c.style.getPropertyValue('--ry')) || 0;
  });
  const cbox = await p.locator('#card3d').boundingBox();
  const cx = cbox.x + cbox.width / 2, cy = cbox.y + cbox.height / 2;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.mouse.move(cx + 150, cy, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  const ryAfter = await p.evaluate(() => {
    const c = document.getElementById('card3dInner');
    return parseFloat(c.style.getPropertyValue('--ry')) || 0;
  });
  ok('the hero card can be turned over by dragging', Math.abs(ryAfter - ryBefore) > 30, ryBefore + ' -> ' + ryAfter);

  await visit(p, 'index.html');
  const workState = await p.evaluate(() => ({
    items: document.querySelectorAll('.work__item').length,
    empty: !!document.querySelector('.work__empty'),
    cfg: (window.TAPASUL_CONFIG.myWork && window.TAPASUL_CONFIG.myWork.items || []).length,
  }));
  ok('the work gallery shows one tile per configured item',
     workState.items === workState.cfg && (workState.items > 0 ? workState.items === workState.cfg : workState.empty),
     JSON.stringify(workState));

  /* ---------- 5b. tapping a card opens it big ---------- */
  await p.evaluate(() => { document.getElementById('work').scrollIntoView({ block: 'start' }); });
  await p.waitForTimeout(500);
  await p.click('.work__item[data-work-open="0"]');
  await p.waitForTimeout(1000);
  const lbOpen = await p.evaluate(() => {
    const lb = document.getElementById('workLightbox');
    const img = document.getElementById('lbImg');
    const r = img.getBoundingClientRect();
    return {
      open: lb && !lb.hidden,
      title: (document.getElementById('lbTitle') || {}).textContent || '',
      natural: img.naturalWidth, loaded: img.complete && img.naturalWidth > 0,
      width: Math.round(r.width),
      locked: document.documentElement.classList.contains('is-locked'),
      focus: (document.activeElement || {}).className || '',
    };
  });
  ok('tapping a card opens the picture, big and sharp',
     lbOpen.open && lbOpen.loaded && lbOpen.natural >= 2000 && lbOpen.width > 500 && lbOpen.locked,
     JSON.stringify(lbOpen));
  ok('the lightbox names the client and traps the page behind it',
     lbOpen.title.length > 2 && /lightbox__close/.test(lbOpen.focus), lbOpen.title + ' / ' + lbOpen.focus);

  // tapping the picture blows it up to actual size (for scanning)
  await p.click('#lbImg');
  await p.waitForTimeout(500);
  const lbZoom = await p.evaluate(() => {
    const img = document.getElementById('lbImg');
    const stage = document.getElementById('lbStage');
    return {
      zoomed: stage.classList.contains('is-zoomed'),
      width: Math.round(img.getBoundingClientRect().width),
      pannable: stage.scrollWidth > stage.clientWidth,
    };
  });
  ok('tapping the picture zooms it in and lets you pan',
     lbZoom.zoomed && lbZoom.width > 1500 && lbZoom.pannable, JSON.stringify(lbZoom));

  // arrows move between cards, Esc closes
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(400);
  const lbNext = await p.evaluate(() => (document.getElementById('lbTitle') || {}).textContent || '');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const lbAfter = await p.evaluate(() => ({
    hidden: document.getElementById('workLightbox').hidden,
    locked: document.documentElement.classList.contains('is-locked'),
    focusBack: document.activeElement.getAttribute('data-work-open'),
  }));
  ok('arrow keys move between cards and Esc closes it',
     lbNext !== lbOpen.title && lbAfter.hidden && !lbAfter.locked && lbAfter.focusBack === '0',
     JSON.stringify({ next: lbNext, after: lbAfter }));

  /* ---------- 6. decline path ---------- */
  const ctx2 = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const p2 = await ctx2.newPage();
  const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(BASE + '/index.html', { waitUntil: 'load' });
  await p2.waitForTimeout(1500);
  await p2.click('#consentDecline');
  await p2.waitForTimeout(500);
  const dec = await p2.evaluate(() => ({
    state: document.documentElement.dataset.consent,
    stored: localStorage.getItem('tapasul_consent_v1'),
    ga: !!document.querySelector('script[src*="googletagmanager"]'),
  }));
  ok('decline = declined, no analytics loaded', dec.state === 'declined' && dec.stored === 'declined' && !dec.ga, JSON.stringify(dec));
  await ctx2.close();

  /* ---------- 7. legal pages ---------- */
  for (const [f, min] of [['terms.html', 10], ['refund-policy.html', 8], ['privacy-policy.html', 8]]) {
    const r = await p.goto(BASE + '/' + f, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const lg = await p.evaluate(() => ({
      s: document.querySelectorAll('#legalBody section').length,
      h1: (document.querySelector('h1') || {}).textContent,
      canon: (document.querySelector('link[rel=canonical]') || {}).href,
      links: document.querySelectorAll('#legalLinks a').length,
    }));
    ok(f + ' → 200 with ' + min + '+ sections', r.status() === 200 && lg.s >= min && lg.links === 3, r.status() + ' / ' + lg.s + ' sections');
  }

  /* ---------- 7b. the standalone features page ---------- */
  {
    const ctxF = await b.newContext();
    const pf = await ctxF.newPage();
    const ferrs = [];
    pf.on('pageerror', (e) => ferrs.push('PAGEERROR ' + e.message));
    pf.on('console', (m) => { if (m.type() === 'error') ferrs.push('CONSOLE ' + m.text()); });
    const rf = await pf.goto(BASE + '/features.html', { waitUntil: 'load' });
    await pf.waitForTimeout(1200);
    const fg = await pf.evaluate(() => ({
      title: document.title,
      desc: (document.querySelector('meta[name=description]') || {}).content || '',
      canon: (document.querySelector('link[rel=canonical]') || {}).href || '',
      h1: (document.querySelector('h1') || {}).textContent || '',
      cards: document.querySelectorAll('.inside-card').length,
      tiles: [...document.querySelectorAll('.inside__tile')].map((t) => t.textContent.replace(/\s+/g, ' ').trim()),
      compare: !!document.querySelector('#insideCompare'),
      cta: !!document.querySelector('#profileCta'),
      preview: !!document.querySelector('#cardpreview'),
      work: !!document.querySelector('#work'),
      footerLink: document.querySelectorAll('.footer a[href="features.html"]').length,
      hasHomeLink: document.querySelectorAll('.footer a[href="index.html"], .nav a[href^="index.html"]').length,
    }));
    ok('features.html → 200 and shows ONLY the featured band (8 tiles)',
       rf.status() === 200 && fg.tiles.length === 8 && !fg.compare && !fg.cta && !fg.preview && !fg.work,
       rf.status() + ' / ' + fg.tiles.length + ' tiles / compare=' + fg.compare + ' cta=' + fg.cta);
    ok('features.html lists reviews, portfolio, OTP, appointment, carousel, URLs, payment',
       ['Client Reviews', 'Portfolio', 'OTP Before Entering', 'Book Appointment', '1 slide of 5-picture carousel', 'Payment method'].every((t) => fg.tiles.some((x) => x.includes(t))),
       fg.tiles.join(' | '));
    ok('features.html has its own title, description and canonical',
       /inside your digital card/i.test(fg.title) && fg.desc.length > 40 && /features\.html$/.test(fg.canon),
       fg.title + ' / ' + fg.canon);
    ok('features.html keeps a link back home', fg.footerLink >= 1 && fg.hasHomeLink >= 1,
       JSON.stringify({ footerLink: fg.footerLink, home: fg.hasHomeLink }));
    ok('features.html loads with no console errors', ferrs.length === 0, ferrs.join(' / ') || 'clean');
    await ctxF.close();
  }

  /* ---------- 8. 404 ---------- */
  const r404 = await p.goto(BASE + '/nope-does-not-exist.html', { waitUntil: 'load' });
  ok('404 page returns HTTP 404', r404.status() === 404, r404.status());

  /* ---------- 9. mobile ---------- */
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + '/index.html', { waitUntil: 'load' });
  await p3.waitForTimeout(2500);
  const mob = await p3.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  ok('mobile 390: no horizontal scroll', mob.overflow <= 1, JSON.stringify(mob));
  await ctx3.close();

  /* ---------- 9a. the boot check + the CSP hash ---------- */
  const ctxBoot = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const pBoot = await ctxBoot.newPage();
  await pBoot.goto(BASE + '/index.html', { waitUntil: 'load' });
  await pBoot.waitForTimeout(2000);
  const boot = await pBoot.evaluate(() => {
    const el = document.getElementById('loadError');
    return {
      exists: !!el,
      hidden: el ? el.hidden : null,
      hasCopy: el ? /did not finish loading/i.test(el.textContent) : false,
      names: el ? (el.textContent.match(/script\.js|site\.config\.js|logo\.js|assets\//g) || []) : [],
    };
  });
  ok('boot-check banner exists and stays hidden on a good load',
     boot.exists && boot.hidden === true && boot.hasCopy, JSON.stringify(boot));

  // the banner must stay hidden on every other page too (the booking page has
  // no product cards, which is what the old check looked for)
  const otherPages = ['pricing.html', 'booking.html', 'about.html', 'faq.html', 'support.html'];
  const shownOn = [];
  for (const f of otherPages) {
    await pBoot.goto(BASE + '/' + f, { waitUntil: 'load' });
    await pBoot.waitForTimeout(1900);
    const r = await pBoot.evaluate(() => {
      const el = document.getElementById('loadError');
      return { page: document.documentElement.dataset.page || location.pathname.split('/').pop(),
               shown: el ? !el.hidden : null };
    });
    if (r.shown !== null && r.shown === true) shownOn.push(r.page);
  }
  ok('the "did not finish loading" banner stays hidden on the other 5 pages',
     shownOn.length === 0, shownOn.join(', ') || 'hidden everywhere');

  // now break it on purpose — the banner must appear and explain itself
  const pBootBad = await ctxBoot.newPage();
  await pBootBad.route('**/script.js', (r) => r.abort());
  await pBootBad.route('**/site.config.js', (r) => r.abort());
  await pBootBad.goto(BASE + '/index.html', { waitUntil: 'load' });
  await pBootBad.waitForTimeout(2200);
  const bootBad = await pBootBad.evaluate(() => {
    const el = document.getElementById('loadError');
    return {
      shown: el ? !el.hidden : false,
      text: el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : '',
    };
  });
  ok('boot-check banner appears when the site files are missing',
     bootBad.shown && /did not finish loading/i.test(bootBad.text), JSON.stringify(bootBad));
  await ctxBoot.close();

  const hashCheck = await p.evaluate(async () => {
    const html = await (await fetch('index.html')).text();
    const m = html.match(/<script id="bootCheck">([\s\S]*?)<\/script>/);
    if (!m) return { ok: false, why: 'no inline script' };
    const bytes = new TextEncoder().encode(m[1]);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    const headers = await (await fetch('_headers')).text();
    return { ok: headers.includes("'sha256-" + b64 + "'"), why: b64 };
  });
  ok('CSP hash in _headers matches the boot-check script', hashCheck.ok, JSON.stringify(hashCheck));

  /* ---------- 9b. the logo never shows as a broken picture ---------- */
  const ctxLogo = await b.newContext({ viewport: { width: 900, height: 500 } });
  const pLogo = await ctxLogo.newPage();
  await pLogo.route('**/logo-frog*.svg', (r) => r.abort());
  await pLogo.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await pLogo.waitForTimeout(2200);
  const logoFb = await pLogo.evaluate(() => {
    const consent = document.querySelector('.consent__mark');
    const head = document.querySelector('.header .logo__mark');
    const drawn = (el) => !!(el && el.querySelector && el.querySelector('use'));
    return {
      consent: consent ? consent.tagName : 'missing',
      consentDrawn: drawn(consent),
      header: head ? (head.querySelector('img') ? 'img' : (head.querySelector('svg') ? 'svg' : 'missing')) : 'missing',
      headerDrawn: drawn(head),
      // the lightbox image is empty until a card is opened — only count real srcs
      broken: [...document.querySelectorAll('img')]
        .filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).length,
    };
  });
  ok('logo falls back to an inline copy when the file will not load',
     logoFb.consentDrawn && logoFb.headerDrawn && logoFb.broken === 0,
     JSON.stringify(logoFb));
  await ctxLogo.close();

  /* ---------- 9b. the guided booking funnel ---------- */
  const ctxFlow = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const pf = await ctxFlow.newPage();
  const ferr = [];
  pf.on('pageerror', e => ferr.push(e.message));
  await pf.goto(BASE + '/index.html', { waitUntil: 'load' });
  await pf.waitForTimeout(2600);
  await pf.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
  await pf.waitForTimeout(500);

  const flowBox = await pf.evaluate(() => {
    const i = document.getElementById('profileName');
    return {
      hasInput: !!i && i.tagName === 'INPUT',
      hasButton: !!document.getElementById('claimFreePage'),
      urlBase: (document.querySelector('.showcase__urlBase') || {}).textContent || '',
    };
  });
  ok('the demo has a free-page name field and a claim button', flowBox.hasInput && flowBox.hasButton, JSON.stringify(flowBox));

  // step 1 — "Select Digital Card" on Home takes you to the Booking page
  await pf.click('[data-select-product="card"]');
  await pf.waitForTimeout(1800);
  const step1 = await pf.evaluate(() => ({
    url: location.pathname.split('/').pop(),
    search: location.search,
    form: !!document.getElementById('preOrderForm'),
  }));
  ok('"Select Digital Card" opens the Booking page with that card chosen',
     step1.url === 'booking.html' && step1.form, JSON.stringify(step1));

  // step 2 — the free-page box inside the form keeps the name, and the summary
  await pf.fill('#bookingProfileName', 'Kusina ni Maria');
  await pf.locator('#bookingProfileName').blur();
  await pf.waitForTimeout(600);
  const step2 = await pf.evaluate(() => ({
    echo: (document.getElementById('bookingProfileEcho') || {}).textContent || '',
    name: (document.getElementById('customerName') || {}).value || '',
    rows: [...document.querySelectorAll('#summaryRows .summary__row')].map(r => r.textContent).join(' | '),
  }));
  ok('typing a page name on Booking fills the name and the summary',
     /kusina-ni-maria/.test(step2.echo) && step2.name === 'Kusina ni Maria' &&
     step2.rows.indexOf('portal.tapasul.com/r/kusina-ni-maria') > -1,
     JSON.stringify({ echo: step2.echo, name: step2.name }));

  // step 3 — "Claim my free page" in the demo jumps to the pricing page
  await pf.goto(BASE + '/index.html', { waitUntil: 'load' });
  await pf.waitForTimeout(1500);
  await pf.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
  await pf.waitForTimeout(300);
  await pf.fill('#profileName', 'Kusina ni Maria');
  await pf.locator('#profileName').blur();
  await pf.waitForTimeout(300);
  await pf.click('#claimFreePage');
  await pf.waitForTimeout(1800);
  const step3 = await pf.evaluate(() => {
    const c = document.getElementById('compare');
    return {
      url: location.pathname.split('/').pop(),
      inView: c ? c.getBoundingClientRect().top < window.innerHeight : false,
      hash: location.hash,
    };
  });
  ok('"Claim my free page" opens the comparison table (pricing page)',
     step3.url === 'pricing.html' && step3.inView, JSON.stringify(step3));

  // step 4 — choosing a tier in the comparison table books that tier
  await pf.click('[data-compare-pick="premium"]');
  await pf.waitForTimeout(1800);
  const step4 = await pf.evaluate(() => ({
    url: location.pathname.split('/').pop(),
    search: location.search,
    type: (document.querySelector('.btype.is-active') || {}).dataset
      ? document.querySelector('.btype.is-active').dataset.type : '',
  }));
  ok('"Choose Premium" in the comparison table books the premium card',
     step4.url === 'booking.html' && step4.type === 'premium', JSON.stringify(step4));
  ok('the funnel runs without JS errors', ferr.length === 0, ferr.join(' | '));
  await ctxFlow.close();

  /* ---------- 9b. the free page box in the booking form ---------- */
  for (const w of [1440, 390]) {
    const c = await b.newContext({ viewport: { width: w, height: 900 } });
    const fp = await c.newPage();
    const fpe = [];
    fp.on('pageerror', e => fpe.push(e.message));
    await fp.goto(BASE + '/booking.html', { waitUntil: 'load' });
    await fp.waitForTimeout(1400);
    await fp.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
    await fp.waitForTimeout(300);
    await fp.fill('#bookingProfileName', 'Lola Bakeshop ni Aling Nena');
    await fp.locator('#bookingProfileName').blur();
    await fp.waitForTimeout(400);
    const fpInfo = await fp.evaluate(() => {
      const box = document.getElementById('bookingFreePage');
      const echo = document.getElementById('bookingProfileEcho');
      const b = box.getBoundingClientRect();
      const e = echo ? echo.getBoundingClientRect() : null;
      return {
        hasButton: !!document.getElementById('bookingClaimFreePage'),
        echo: echo ? echo.textContent : '',
        echoFits: !e || (echo.scrollWidth <= echo.clientWidth + 1 && e.right <= innerWidth + 1),
        boxFits: Math.round(b.right) <= innerWidth + 1,
        right: Math.round(b.right), vw: innerWidth,
        summary: (document.getElementById('summaryRows') || {}).textContent || '',
        name: (document.getElementById('customerName') || {}).value || '',
      };
    });
    ok('free page box @' + w + ': no claim button, saves as you type',
       !fpInfo.hasButton && fpInfo.summary.indexOf('lola-bakeshop-ni-aling-nena') > -1 && fpInfo.name === 'Lola Bakeshop ni Aling Nena',
       JSON.stringify({ button: fpInfo.hasButton, name: fpInfo.name, summary: fpInfo.summary.slice(0, 90) }));
    ok('free page box @' + w + ': the page address fits inside the card',
       fpInfo.echoFits && fpInfo.boxFits, JSON.stringify({ echo: fpInfo.echo, right: fpInfo.right, vw: fpInfo.vw }));
    ok('free page box @' + w + ': no JS errors', fpe.length === 0, fpe.join(' | '));
    await c.close();
  }

  /* ---------- 9c. the booking goes to D1 + email ---------- */
  {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
    const dp = await c.newPage();
    const derr = [];
    dp.on('pageerror', e => derr.push(e.message));
    dp.on('console', m => { if (m.type() === 'error') derr.push(m.text()); });
    let posted = null;
    let fail = false;
    await dp.route('**/api/bookings', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"orders":[]}' });
      }
      posted = JSON.parse(route.request().postData() || '{}');
      if (fail) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"boom"}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"id":"TS-TEST-1","emailed":true}' });
    });
    await dp.goto(BASE + '/booking.html?utm_source=fb&utm_campaign=audit', { waitUntil: 'load' });
    await dp.waitForTimeout(1200);
    await dp.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
    await dp.waitForTimeout(300);
    await dp.fill('#customerName', 'Kusina ni Maria');
    await dp.fill('#customerEmail', 'maria@example.com');
    await dp.fill('#customerPhone', '09171234567');
    await dp.fill('#customerAddress', '12 Mabini St, Quezon City');
    await dp.fill('#bookingNotes', 'Gold logo please');
    await dp.fill('#bookingProfileName', 'Kusina ni Maria');
    await dp.locator('#bookingProfileName').blur();
    await dp.evaluate(() => {
      const d = new Date(); d.setDate(d.getDate() + 3);
      while (d.getDay() === 0) d.setDate(d.getDate() + 1);
      const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const el = document.getElementById('bookingDate');
      el.value = iso; el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await dp.waitForTimeout(400);
    await dp.click('.slot >> nth=0');
    await dp.waitForTimeout(3000);            // the dwell guard wants a moment
    await dp.click('#submitBtn');
    await dp.waitForTimeout(1200);

    const want = ['name','email','phone','address','notes','date','slot','meetAt','cardType','productId',
      'product','quantity','unitPrice','monthlyHosting','branding','finish','addOns','addOnTotal','features',
      'profileName','profileUrl','subtotal','discount','promoCode','promoAmount','shipping','shippingZone',
      'codFee','paymentMethod','total','deposit','balance','currency','pageUrl','referrer','userAgent',
      'locale','timezone','screen','consent','utm','submittedAt','bookingId','clientId'];
    const got = posted ? Object.keys(posted) : [];
    const missing = want.filter(k => got.indexOf(k) === -1);
    ok('the booking is POSTed to /api/bookings with every field',
       !!posted && missing.length === 0, JSON.stringify({ sent: got.length, missing }));
    ok('the payload carries the page address and campaign tags',
       !!posted && /portal\.tapasul\.com\/r\/kusina-ni-maria/.test(posted.profileUrl || '') &&
       (posted.utm || {}).utm_source === 'fb',
       JSON.stringify({ profileUrl: posted && posted.profileUrl, utm: posted && posted.utm }));
    const okMsg = await dp.evaluate(() => document.getElementById('formStatus').textContent.trim());
    ok('the customer is told the booking went through', /received/i.test(okMsg), okMsg.slice(0, 90));
    ok('the D1 path runs without JS errors', derr.length === 0, derr.join(' | '));

    // and if the database is down, the booking still reaches you by email
    fail = true;
    await dp.evaluate(() => { document.getElementById('formStatus').textContent = ''; });
    await dp.click('#submitBtn');
    await dp.waitForTimeout(900);
    const fallback = await dp.evaluate(() => document.getElementById('formStatus').textContent.trim());
    ok('a failed database call falls back to the mail app',
       /email app/i.test(fallback), fallback.slice(0, 90));
    await c.close();
  }

  /* ---------- 9d. the showcase name saves itself into the booking ---------- */
  {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
    const sp = await c.newPage();
    const serr = [];
    sp.on('pageerror', e => serr.push(e.message));
    await sp.goto(BASE + '/index.html', { waitUntil: 'load' });
    await sp.waitForTimeout(1200);
    await sp.evaluate(() => { const a = document.getElementById('consentAccept'); if (a) a.click(); });
    await sp.waitForTimeout(300);
    // type and nothing else — no "Claim my free page" click
    await sp.type('#profileName', 'hotdog', { delay: 30 });
    await sp.locator('#profileName').blur();
    await sp.waitForTimeout(400);
    const sync = await sp.evaluate(() => ({
      hint: (document.getElementById('profileNameHint') || {}).textContent || '',
      echo: (document.getElementById('profileUrlEcho') || {}).textContent || '',
      stored: sessionStorage.getItem('tapasul_freename_v1') || '',
    }));
    ok('typing a page name in the demo saves it straight away',
       sync.hint.indexOf('Saved') > -1 && sync.stored === 'hotdog',
       JSON.stringify({ hint: sync.hint, stored: sync.stored }));
    // and it is still there after moving to the booking page
    await sp.goto(BASE + '/booking.html', { waitUntil: 'load' });
    await sp.waitForTimeout(1400);
    const carried = await sp.evaluate(() => ({
      customerName: (document.getElementById('customerName') || {}).value || '',
      bookingBox: (document.getElementById('bookingProfileName') || {}).value || '',
      summary: (document.getElementById('summaryRows') || {}).textContent || '',
    }));
    ok('the name follows into the booking form and its free page box',
       carried.customerName === 'hotdog' && carried.bookingBox === 'hotdog' &&
       carried.summary.indexOf('portal.tapasul.com/r/hotdog') > -1,
       JSON.stringify({ customerName: carried.customerName, box: carried.bookingBox }));
    ok('the showcase echo shows the address they will get',
       sync.echo === 'Your page will be portal.tapasul.com/r/hotdog', sync.echo);
    ok('the showcase name box runs without JS errors', serr.length === 0, serr.join(' | '));
    await c.close();
  }

  /* ---------- 10. admin ---------- */
  const ctx4 = await b.newContext({ viewport: { width: 1440, height: 950 } });
  const p4 = await ctx4.newPage();
  const e4 = [];
  p4.on('pageerror', e => e4.push(e.message));
  await p4.goto(BASE + '/admin.html', { waitUntil: 'load' });
  await p4.fill('#pin', '1234');
  await p4.click('#gateForm button[type="submit"]');
  await p4.waitForTimeout(700);
  const adm = await p4.evaluate(() => ({
    open: document.getElementById('app').style.display !== 'none',
    tabs: document.querySelectorAll('.tab').length,
  }));
  ok('admin unlocks with PIN', adm.open && adm.tabs === 4, JSON.stringify(adm));
  await p4.click('.tab[data-view="pricing"]');
  await p4.waitForTimeout(500);
  const calc = await p4.evaluate(() => {
    const price = document.querySelector('.calc__result-price');
    const lines = document.querySelectorAll('.calc__line').length;
    return { price: price ? price.textContent : '', lines: lines, guide: !!document.querySelector('.calc__guide') };
  });
  ok('pricing calculator renders with results', !!calc.price && calc.lines > 12 && calc.guide, JSON.stringify(calc));
  await ctx4.close();

  /* the dashboard is private: no public page may link to it */
  const PUB = ['/index.html', '/about.html', '/pricing.html', '/booking.html', '/faq.html',
               '/support.html', '/features.html', '/terms.html', '/privacy-policy.html',
               '/refund.html', '/refund-policy.html', '/404.html'];
  const leaks = [];
  for (const u of PUB) {
    await p.goto(BASE + u, { waitUntil: 'domcontentloaded' });
    const hit = await p.evaluate(() =>
      [...document.querySelectorAll('a[href], iframe[src], script[src]')]
        .map(el => el.getAttribute('href') || el.getAttribute('src') || '')
        .filter(h => /admin/i.test(h)));
    if (hit.length) leaks.push(u + ' → ' + hit.join(','));
  }
  ok('no public page links to the admin dashboard', leaks.length === 0, leaks.join(' | '));

  /* ---------- 11. static files ---------- */
  const sm = await p.goto(BASE + '/sitemap.xml', { waitUntil: 'load' });
  const smText = await p.evaluate(() => document.body.innerText);
  ok('sitemap lists 11 URLs (home + 6 pages + features + legal)', (smText.match(/<loc>/g) || []).length === 11, (smText.match(/<loc>/g) || []).length);
  const rb = await p.goto(BASE + '/robots.txt', { waitUntil: 'load' });
  const rbText = await p.evaluate(() => document.body.innerText);
  ok('robots blocks admin + points at sitemap', /Disallow: \/admin\.html/.test(rbText) && /Sitemap:/.test(rbText));

  console.log('');
  let fails = 0;
  results.forEach(([s, n, note]) => { if (s === 'FAIL') fails++; console.log(s.padEnd(5) + n + (note ? '   [' + note + ']' : '')); });
  console.log('\n' + (results.length - fails) + '/' + results.length + ' passed' + (fails ? '  — ' + fails + ' FAILED' : '  — ALL GREEN'));
  await b.close();
  process.exit(fails ? 1 : 0);
})();
