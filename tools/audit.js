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

  /* ---------- 1. home page ---------- */
  await p.goto(BASE + '/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  const home = await p.evaluate(() => {
    const ld = document.querySelector('#structured-data');
    let types = [];
    try { types = JSON.parse(ld.textContent)['@graph'].map(n => n['@type']); } catch (e) { types = ['PARSE-FAIL']; }
    return {
      title: document.title,
      gateVisible: !document.getElementById('consentGate').hidden,
      canvases: document.querySelectorAll('canvas').length,
      webgl: (() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return false; } })(),
      products: document.querySelectorAll('#productGrid .product:not(.product--skeleton)').length,
      faqs: document.querySelectorAll('#faqList details').length,
      team: document.querySelectorAll('.member').length,
      teamPhotos: document.querySelectorAll('.member__avatar img').length,
      deliverySteps: document.querySelectorAll('#deliverySteps li').length,
      supportCards: document.querySelectorAll('#supportGrid .support-card').length,
      zones: document.querySelectorAll('#shippingZone option').length,
      payments: document.querySelectorAll('#paymentMethod option').length,
      addOns: document.querySelectorAll('#addOnsList input').length,
      bookingTypes: document.querySelectorAll('.btype').length,
      slots: document.querySelectorAll('.slot').length,
      dateMin: (document.getElementById('bookingDate') || {}).min || '',
      promoBox: !!document.getElementById('promoCode'),
      ctaTotal: (document.getElementById('bookingCtaTotal') || {}).textContent || '',
      studio: !!document.querySelector('#customizer'),
      studioBtn: !!document.querySelector('.hero__actions .btn--ghost'),
      three: typeof window.THREE !== 'undefined',
      heroPhoto: !!document.querySelector('.stage__photo img'),
      hero3d: !!document.querySelector('#card3d'),
      heroFaces: document.querySelectorAll('.card3d__face').length,
      work: !!document.querySelector('#work'),
      workItems: document.querySelectorAll('.work__item').length,
      workEmpty: !!document.querySelector('.work__empty'),
      navWork: document.querySelectorAll('.nav a[href="#work"], .footer a[href="#work"]').length,
      ldTypes: types,
      legalLinks: document.querySelectorAll('.footer a[href*="terms"], .footer a[href*="refund"], .footer a[href*="privacy"]').length,
      privacyLink: !!document.querySelector('.footer a[href*="privacy-policy"]'),
      consentBody: (document.getElementById('consentBody') || {}).textContent ? 1 : 0,
    };
  });
  ok('home loads, no JS errors', errs.length === 0 && cerr.length === 0, errs.concat(cerr).join(' | '));
  ok('no failed requests', failed.length === 0, failed.join(' | '));
  ok('consent gate visible on 1st visit', home.gateVisible);
  ok('2 products rendered (standard + premium)', home.products === 2, home.products);
  ok('14 FAQs', home.faqs === 14, home.faqs);
  ok('2 team members, 1 photo (co-founder low profile)', home.team === 2 && home.teamPhotos === 1, home.team + '/' + home.teamPhotos);
  ok('4 delivery steps', home.deliverySteps === 4, home.deliverySteps);
  ok('3 support channels', home.supportCards === 3, home.supportCards);
  ok('3 delivery zones (incl. pickup)', home.zones === 3, home.zones);
  ok('4 payment methods', home.payments === 4, home.payments);
  ok('add-ons section removed from booking form', home.addOns === 0, home.addOns);
  ok('the old 3D studio is gone (no section, no button, no three.js)', !home.studio && !home.studioBtn && !home.three && home.canvases === 0, JSON.stringify({ studio: home.studio, btn: home.studioBtn, three: home.three, canvas: home.canvases }));
  ok('the hero shows a card with a front and a back', home.hero3d && home.heroFaces === 2, JSON.stringify({ hero3d: home.hero3d, faces: home.heroFaces }));
  ok('the "My work" section is on the page', home.work && (home.workItems > 0 || home.workEmpty), JSON.stringify({ work: home.work, items: home.workItems, empty: home.workEmpty }));
  ok('the nav points at My work', home.navWork >= 2, home.navWork);
  ok('JSON-LD Organization+WebSite+2 Products+FAQPage', ['Organization', 'WebSite', 'Product', 'FAQPage'].every(t => home.ldTypes.includes(t)) && home.ldTypes.filter(t => t === 'Product').length === 2, home.ldTypes.join(','));
  ok('footer links Terms/Refund/Privacy', home.legalLinks >= 3 && home.privacyLink, home.legalLinks);
  const noAcrylic = await p.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    const cfgTxt = (window.TAPASUL_CONFIG.pricing.products.acrylic ? 'product-defined' : 'no-product');
    return { page: /acrylic|standee/.test(t), cfg: cfgTxt, order: window.TAPASUL_CONFIG.pricing.order.join(',') };
  });
  ok('no acrylic wording on the page, order = card + premium only',
     !noAcrylic.page && noAcrylic.order === 'card,premium', JSON.stringify(noAcrylic));

  const bk = await p.evaluate(() => ({
    types: document.querySelectorAll('.btype').length,
    slots: document.querySelectorAll('.slot').length,
    dateMin: document.getElementById('bookingDate').min,
    lead: window.TAPASUL_CONFIG.booking.leadDays,
    promo: !!document.getElementById('promoCode'),
    cta: document.getElementById('bookingCtaTotal').textContent.trim(),
    glass: document.querySelectorAll('.glass').length,
    step: document.querySelectorAll('.booking__steps li').length,
  }));
  ok('booking UI: 2 types, 7 slots, 3 glass panels, 4 step dots',
     bk.types === 2 && bk.slots === 7 && bk.glass === 3 && bk.step === 4, JSON.stringify(bk));
  ok('booking date starts at the lead time', !!bk.dateMin, bk.dateMin);
  ok('promo code box present + CTA shows the total', bk.promo && /\u20b1/.test(bk.cta), bk.cta);

  const inside = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.inside-card')];
    const txt = (el) => (el || {}).textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    const std = cards.find((c) => c.dataset.insideProduct === 'card');
    const prm = cards.find((c) => c.dataset.insideProduct === 'premium');
    const items = (c) => [...(c ? c.querySelectorAll('.inside-card__list strong') : [])].map((e) => e.textContent.trim());
    return {
      section: !!document.querySelector('#inside'),
      cards: cards.length,
      names: cards.map((c) => txt(c.querySelector('.inside-card__head h3'))),
      prices: cards.map((c) => txt(c.querySelector('.inside-card__price'))),
      stdItems: items(std),
      prmItems: items(prm),
      tiles: [...document.querySelectorAll('.inside__tile strong')].map((e) => e.textContent.trim()),
      ctas: [...document.querySelectorAll('.inside-card__cta')].map((e) => e.textContent.trim()),
      links: [...document.querySelectorAll('.inside-card__link')].map((e) => e.getAttribute('href')),
      title: txt(document.querySelector('#inside h2')),
    };
  });
  ok('inside-the-card section renders 2 tier cards', inside.section && inside.cards === 2, JSON.stringify(inside.names));

  // ---------- live profiles: the moving strip + the free-page CTA ----------
  const live = await p.evaluate(() => {
    const track = document.querySelector('#profileTrack');
    const items = [...document.querySelectorAll('.marquee__item')];
    const cta = document.querySelector('#profileCta');
    const btn = document.querySelector('.showcase__btn');
    return {
      section: !!document.querySelector('#live'),
      items: items.length,
      halves: document.querySelectorAll('.marquee__half').length,
      firstText: items[0] ? items[0].textContent.replace(/\s+/g, ' ').trim() : '',
      firstHref: items[0] ? items[0].getAttribute('href') : '',
      animation: track ? getComputedStyle(track).animationName : 'none',
      duration: track ? getComputedStyle(track).animationDuration : '',
      ctaTitle: cta ? (cta.querySelector('strong') || {}).textContent || '' : '',
      ctaSample: cta ? ((cta.querySelector('.showcase__urlInput') || {}).placeholder || '') : '',
      ctaNote: cta ? (cta.querySelector('.showcase__note') || {}).textContent || '' : '',
      btnText: btn ? btn.textContent.trim() : '',
      btnHref: btn ? (btn.getAttribute('href') || btn.id || '') : '',
    };
  });
  ok('live-profiles strip renders the customer pages', live.section && live.items >= 6 && live.halves === 2, live.items + ' chips');
  ok('the strip points at portal.tapasul.com', /portal\.tapasul\.com\/r\//.test(live.firstHref || ''), live.firstHref);
  ok('the strip actually moves', /marquee/.test(live.animation || '') && live.duration !== '0s', live.animation + ' ' + live.duration);
  ok('the free-page CTA is there', /page is free/i.test(live.ctaTitle) && /yourname/.test(live.ctaSample) && live.btnText.length > 3,
     live.ctaTitle + ' | ' + live.btnText + ' -> ' + live.btnHref);
  ok('the CTA says the free page only comes with a card',
     /digital card/i.test(live.ctaNote || '') && /not sold on its own|only/i.test(live.ctaNote || ''),
     live.ctaNote);

  // the strip must stay on ONE straight line and travel to the right
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

  // one click on the tier card must take you to the features page
  const jump = await p.evaluate(() => {
    const a = document.querySelector('.inside-card__link');
    return { label: a ? a.textContent.trim() : '', href: a ? a.getAttribute('href') : '', count: document.querySelectorAll('.inside-card__link').length };
  });
  ok('one click on the tier card opens the features page',
     jump.count === 2 && /check the features/i.test(jump.label) && /features\.html$/.test(jump.href || ''),
     JSON.stringify(jump));
  ok('section is titled "What is inside your digital card"', /inside your digital card/i.test(inside.title || ''), inside.title);
  ok('standard tier lists picture/tagline/bio/3 socials/contact + 2 features of choice',
     ['Profile picture', 'Tagline', 'Bio', '3 social media links', 'Contact info'].every((t) => inside.stdItems.includes(t)) &&
     inside.stdItems.includes('2 features of your choice'),
     inside.stdItems.join(' | '));
  ok('premium tier lists picture/all socials/tagline/all contacts/all features',
     ['Profile picture', 'All of your social media', 'Tagline', 'All contacts', 'All of the features'].every((t) => inside.prmItems.includes(t)),
     inside.prmItems.join(' | '));
  ok('the featured list is NOT on the home page any more', inside.tiles.length === 0, inside.tiles.length + ' tiles');
  ok('the tier cards link to the standalone features page',
     inside.links.length === 2 && inside.links.every((h) => /features\.html$/.test(h || '')),
     (inside.links || []).join(' | '));
  ok('tier prices show live values', /999/.test(inside.prices[0] || '') && /2,499/.test(inside.prices[1] || ''), inside.prices.join(' / '));

  const noPre = await p.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return { page: /pre-order|pre order/.test(t) };
  });
  ok('no pre-order wording left on the page', !noPre.page, JSON.stringify(noPre));

  const prem = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('#productGrid .product')];
    const prem = cards.find((c) => c.dataset.productCard === 'premium');
    const btype = document.querySelector('.btype[data-type="premium"]');
    return {
      premiumCard: !!prem,
      amount: prem ? prem.querySelector('.product__amount').textContent.trim() : '',
      recurring: prem ? prem.querySelector('.product__recurring').textContent.replace(/\s+/g, ' ').trim() : '',
      features: prem ? prem.querySelectorAll('.product__features li').length : 0,
      badge: prem ? (prem.querySelector('.product__badge') || {}).textContent : '',
      btype: !!btype,
      btypePrice: btype ? btype.querySelector('.btype__price').textContent.replace(/\s+/g, ' ').trim() : '',
      workItems: document.querySelectorAll('.work__item').length,
      workCfgItems: ((window.TAPASUL_CONFIG.myWork && window.TAPASUL_CONFIG.myWork.items) || []).length,
      cfgPremium: window.TAPASUL_CONFIG.pricing.products.premium
        ? [window.TAPASUL_CONFIG.pricing.products.premium.price, window.TAPASUL_CONFIG.pricing.products.premium.monthly]
        : null,
    };
  });
  ok('premium card: \u20b12,499 + \u20b299/month', prem.premiumCard && prem.amount.replace(/[^\d]/g, '') === '2499' && /299/.test(prem.recurring), JSON.stringify(prem).slice(0, 220));
  ok('premium card lists the logo customisation', /logo/i.test(prem.badge) && prem.features >= 5, prem.badge + ' / ' + prem.features + ' features');
  ok('premium booking option exists at the premium price', prem.btype && /2,499/.test(prem.btypePrice) && /299/.test(prem.btypePrice), prem.btypePrice);
  ok('the work gallery is driven by the config', prem.workItems === prem.workCfgItems, JSON.stringify({ rendered: prem.workItems, config: prem.workCfgItems }));

  /* ---------- 2. consent: accept ---------- */
  await p.click('#consentAccept');
  await p.waitForTimeout(500);
  const acc = await p.evaluate(() => ({
    state: document.documentElement.dataset.consent,
    hidden: document.getElementById('consentGate').hidden,
    stored: localStorage.getItem('tapasul_consent_v1'),
  }));
  ok('consent accept stores granted + hides gate', acc.state === 'granted' && acc.hidden && acc.stored === 'granted', JSON.stringify(acc));

  /* ---------- 3. booking math ---------- */
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
  await pb.goto(BASE + '/index.html', { waitUntil: 'load' });
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

  /* ---------- 4c. inside-the-card CTA picks the tier ---------- */
  await p.evaluate(() => document.querySelector('#inside').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(500);
  await p.click('[data-inside-pick="premium"]');
  await p.waitForTimeout(700);
  const picked = await p.evaluate(() => ({
    type: document.querySelector('.btype.is-active') ? document.querySelector('.btype.is-active').dataset.type : '',
    total: document.getElementById('displayTotal').textContent,
    rows: document.getElementById('summaryRows').textContent.replace(/\s+/g, ' '),
    type: document.querySelector('.btype.is-active') ? document.querySelector('.btype.is-active').dataset.type : '',
  }));
  ok('"Book the premium card" selects the premium tier',
     picked.type === 'premium' && /2,499/.test(picked.rows),
     picked.type + ' / ' + picked.rows.slice(0, 60));

  /* ---------- 4d. "choose your 2 features" picker ---------- */
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
  await p.evaluate(() => { document.querySelectorAll('#featurePickList .chip')[1].click(); });
  await p.waitForTimeout(250);
  const two = await p.evaluate(() => ({
    on: document.querySelectorAll('#featurePickList .chip.is-on').length,
    summary: document.getElementById('summaryRows').textContent.replace(/\s+/g, ' '),
    total: document.getElementById('displayTotal').textContent,
  }));
  ok('customer can pick exactly 2 features', two.on === 2, JSON.stringify(two));
  ok('the picked features show in the summary without changing the price',
     /Features/.test(two.summary) && /Client Reviews/.test(two.summary) && two.total === totalBefore,
     two.summary.slice(0, 90) + ' | total ' + two.total + ' (was ' + totalBefore + ')');

  await p.evaluate(() => { document.querySelectorAll('#featurePickList .chip')[2].click(); });
  await p.waitForTimeout(250);
  const three = await p.evaluate(() => ({
    on: document.querySelectorAll('#featurePickList .chip.is-on').length,
    err: (document.querySelector('#featurePickError') || {}).textContent || '',
  }));
  ok('a third feature is refused (only 2 allowed)', three.on === 2 && /2 features/.test(three.err), JSON.stringify(three));

  await p.evaluate(() => { document.querySelector('.btype[data-type="premium"]').click(); });
  await p.waitForTimeout(500);
  const prmPick = await p.evaluate(() => ({
    chips: document.querySelectorAll('#featurePickList .chip').length,
    hint: (document.querySelector('#featurePickHint') || {}).textContent || '',
  }));
  ok('premium booking has no picker (every feature included)', prmPick.chips === 0 && /every feature/i.test(prmPick.hint), JSON.stringify(prmPick));
  await p.evaluate(() => { document.querySelector('.btype[data-type="standard"]').click(); });
  await p.waitForTimeout(400);

  /* ---------- 5. the hero card turns over, and the work gallery ---------- */
  await p.evaluate(() => document.getElementById('card3d').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(600);
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

  const workState = await p.evaluate(() => ({
    items: document.querySelectorAll('.work__item').length,
    empty: !!document.querySelector('.work__empty'),
    cfg: (window.TAPASUL_CONFIG.myWork && window.TAPASUL_CONFIG.myWork.items || []).length,
  }));
  ok('the work gallery shows one tile per configured item',
     workState.items === workState.cfg && (workState.items > 0 ? workState.items === workState.cfg : workState.empty),
     JSON.stringify(workState));

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
      broken: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
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
  ok('the free page box has a name field and a claim button', flowBox.hasInput && flowBox.hasButton, JSON.stringify(flowBox));

  // step 1 — "Select Digital Card" brings them to the free page box
  await pf.click('[data-select-product="card"]');
  await pf.waitForTimeout(1600);
  const step1 = await pf.evaluate(() => {
    const c = document.getElementById('profileCta').getBoundingClientRect();
    return { inView: c.top < window.innerHeight && c.bottom > 0, focused: document.activeElement && document.activeElement.id };
  });
  ok('"Select Digital Card" opens the free page box', step1.inView, JSON.stringify(step1));

  // step 2 — they type their name and see their address
  await pf.fill('#profileName', 'Kusina ni Maria');
  await pf.waitForTimeout(400);
  const step2 = await pf.evaluate(() => ({
    echo: (document.getElementById('profileUrlEcho') || {}).textContent || '',
    url: (document.querySelector('.showcase__urlBase') || {}).textContent || '',
  }));
  ok('typing a name shows the page address they will get',
     step2.echo.indexOf('kusina-ni-maria') > -1, JSON.stringify(step2));

  // step 3 — "Claim my free page" opens the comparison
  await pf.click('#claimFreePage');
  await pf.waitForTimeout(1800);
  const step3 = await pf.evaluate(() => {
    const c = document.getElementById('inside').getBoundingClientRect();
    return { inView: c.top < window.innerHeight && c.bottom > 0, top: Math.round(c.top) };
  });
  ok('"Claim my free page" opens what is inside the card', step3.inView, JSON.stringify(step3));

  // step 4 — the booking form arrives with everything they gave us
  await pf.click('[data-inside-pick="card"]');
  await pf.waitForTimeout(2000);
  const step4 = await pf.evaluate(() => {
    const c = document.getElementById('preorder').getBoundingClientRect();
    const rows = [...document.querySelectorAll('#summaryRows .summary__row')].map(r => r.textContent).join(' | ');
    return {
      inView: c.top < window.innerHeight && c.bottom > 0,
      top: Math.round(c.top),
      name: (document.getElementById('customerName') || {}).value || '',
      rows: rows,
      type: (document.querySelector('.btype.is-active') || {}).dataset ? document.querySelector('.btype.is-active').dataset.type : '',
    };
  });
  ok('the booking section opens with the name they typed',
     step4.inView && step4.name === 'Kusina ni Maria', JSON.stringify(step4));
  ok('the booking summary shows their free page address',
     step4.rows.indexOf('portal.tapasul.com/r/kusina-ni-maria') > -1, step4.rows.slice(0, 160));
  ok('the funnel runs without JS errors', ferr.length === 0, ferr.join(' | '));
  await ctxFlow.close();

  /* ---------- 9b. the free page box in the booking form ---------- */
  for (const w of [1440, 390]) {
    const c = await b.newContext({ viewport: { width: w, height: 900 } });
    const fp = await c.newPage();
    const fpe = [];
    fp.on('pageerror', e => fpe.push(e.message));
    await fp.goto(BASE + '/index.html', { waitUntil: 'load' });
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
    await dp.goto(BASE + '/index.html?utm_source=fb&utm_campaign=audit', { waitUntil: 'load' });
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
      customerName: (document.getElementById('customerName') || {}).value || '',
      bookingBox: (document.getElementById('bookingProfileName') || {}).value || '',
      summary: (document.getElementById('summaryRows') || {}).textContent || '',
      hint: (document.getElementById('profileNameHint') || {}).textContent || '',
      echo: (document.getElementById('profileUrlEcho') || {}).textContent || '',
    }));
    ok('typing a page name in the showcase saves it on the booking',
       sync.summary.indexOf('portal.tapasul.com/r/hotdog') > -1 && sync.hint.indexOf('Saved') > -1,
       JSON.stringify({ summary: sync.summary.slice(0, 80), hint: sync.hint }));
    ok('the name follows into the booking form and its free page box',
       sync.customerName === 'hotdog' && sync.bookingBox === 'hotdog',
       JSON.stringify({ customerName: sync.customerName, bookingBox: sync.bookingBox }));
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

  /* ---------- 11. static files ---------- */
  const sm = await p.goto(BASE + '/sitemap.xml', { waitUntil: 'load' });
  const smText = await p.evaluate(() => document.body.innerText);
  ok('sitemap lists 5 URLs (home + features + 3 legal)', (smText.match(/<loc>/g) || []).length === 5, (smText.match(/<loc>/g) || []).length);
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
