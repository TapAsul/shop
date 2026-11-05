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
      brandingBtns: document.querySelectorAll('#brandingToggle button').length,
      finishes: document.querySelectorAll('#finishToggle button').length,
      gradients: document.querySelectorAll('#gradientSwatches button').length,
      colours: document.querySelectorAll('#colourSwatches button').length,
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
  ok('4 add-ons in the booking form', home.addOns === 4, home.addOns);
  ok('studio: branding/finish/gradient/colour controls', home.brandingBtns === 2 && home.finishes === 3 && home.gradients === 4 && home.colours === 3);
  ok('WebGL live, 2 canvases', home.webgl && home.canvases === 2, home.canvases);
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
  ok('booking UI: 3 types, 7 slots, 3 glass panels, 4 step dots',
     bk.types === 3 && bk.slots === 7 && bk.glass === 3 && bk.step === 4, JSON.stringify(bk));
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
      title: txt(document.querySelector('#inside h2')),
    };
  });
  ok('inside-the-card section renders 2 tier cards', inside.section && inside.cards === 2, JSON.stringify(inside.names));
  ok('section is titled "What is inside your digital card"', /inside your digital card/i.test(inside.title || ''), inside.title);
  ok('standard tier lists picture/tagline/bio/3 socials/contact + 2 features of choice',
     ['Profile picture', 'Tagline', 'Bio', '3 social media links', 'Contact info'].every((t) => inside.stdItems.includes(t)) &&
     inside.stdItems.includes('2 features of your choice'),
     inside.stdItems.join(' | '));
  ok('premium tier lists picture/all socials/tagline/all contacts/all features',
     ['Profile picture', 'All of your social media', 'Tagline', 'All contacts', 'All of the features'].every((t) => inside.prmItems.includes(t)),
     inside.prmItems.join(' | '));
  ok('featured list: reviews, portfolio, OTP, appointment, carousel, URLs, payment',
     ['Client Reviews', 'Portfolio', 'OTP Before Entering', 'Book Appointment', '1 slide of 5-picture carousel', 'Payment method'].every((t) => inside.tiles.includes(t)) && inside.tiles.length >= 7,
     inside.tiles.join(' | '));
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
      modelBtns: document.querySelectorAll('#modelToggle button').length,
      cfgPremium: window.TAPASUL_CONFIG.pricing.products.premium
        ? [window.TAPASUL_CONFIG.pricing.products.premium.price, window.TAPASUL_CONFIG.pricing.products.premium.monthly]
        : null,
    };
  });
  ok('premium card: \u20b12,499 + \u20b299/month', prem.premiumCard && prem.amount.replace(/[^\d]/g, '') === '2499' && /299/.test(prem.recurring), JSON.stringify(prem).slice(0, 220));
  ok('premium card lists the logo customisation', /logo/i.test(prem.badge) && prem.features >= 5, prem.badge + ' / ' + prem.features + ' features');
  ok('premium booking option exists at the premium price', prem.btype && /2,499/.test(prem.btypePrice) && /299/.test(prem.btypePrice), prem.btypePrice);
  ok('studio shows a card picker for 2 products', prem.modelBtns === 2, prem.modelBtns);

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
  const paid = await p.$$('#addOnsList input');
  for (const el of paid) {
    const isFree = await el.evaluate(n => !n.dataset.price || Number(n.dataset.price) === 0);
    if (!isFree) { await el.check(); break; }
  }
  await p.waitForTimeout(300);
  const t3 = await p.evaluate(() => document.querySelector('#displayTotal').textContent.trim());
  ok('a paid add-on raises the total', t3.replace(/[^\d]/g, '') !== before.replace(/[^\d]/g, ''), before + ' -> ' + t3);

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
    model: [...document.querySelectorAll('#modelToggle button')].map((b) => b.dataset.model + '=' + b.getAttribute('aria-pressed')).join(','),
  }));
  ok('"Book the premium card" selects the premium tier',
     picked.type === 'premium' && /premium=true/.test(picked.model) && /2,499/.test(picked.rows),
     picked.type + ' / ' + picked.model + ' / ' + picked.rows.slice(0, 60));

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

  /* ---------- 5. studio customisation ---------- */
  await p.evaluate(() => document.getElementById('customizer').scrollIntoView());
  await p.waitForTimeout(1800);
  await p.click('[data-branding="custom"]');
  await p.waitForTimeout(500);
  await p.click('[data-gradient="sunset"]');
  await p.waitForTimeout(400);
  await p.setInputFiles('#logoUpload', '/home/user/tapasul-site/assets/logo-frog.svg');
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => ({
    customShown: !document.getElementById('customBlock').hidden,
    logo: (document.getElementById('logoFileName') || {}).textContent,
    gradPressed: document.querySelector('#gradientSwatches [data-gradient="sunset"]').getAttribute('aria-pressed'),
    colourPressed: document.querySelector('#colourSwatches button').getAttribute('aria-pressed'),
  }));
  ok('custom branding block + logo upload works', st.customShown && st.logo === 'logo-frog.svg', JSON.stringify(st));
  ok('gradient selected, flat colour deselected', st.gradPressed === 'true' && st.colourPressed === 'false', JSON.stringify(st));

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
  ok('sitemap lists 4 URLs (home + 3 legal)', (smText.match(/<loc>/g) || []).length === 4, (smText.match(/<loc>/g) || []).length);
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
