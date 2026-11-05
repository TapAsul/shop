/**
 * ============================================================================
 *  /api/bookings — every TapAsul booking, saved in Cloudflare D1 + emailed
 * ============================================================================
 *
 *  POST   /api/bookings    the booking form posts here. Public.
 *                          -> saves EVERY field to D1
 *                          -> emails a tidy copy to your Gmail
 *
 *  GET    /api/bookings    the dashboard (admin.html) reads every booking,
 *                          from every device. Needs the admin PIN.
 *
 *  PATCH  /api/bookings    change a booking's status / note. Needs the PIN.
 *
 *  Bindings this file expects (Cloudflare Pages -> Settings -> Functions):
 *    DB                  D1 database binding      -> your tapasul database
 *    EMAIL               Send Email binding       -> destination: your Gmail
 *    RESEND_API_KEY      optional, fallback mail (secret)
 *    ADMIN_PIN           secret, must match order.admin.pin
 *    BOOKING_EMAIL       optional, overrides the destination address
 *    MAIL_FROM           optional, the from address (e.g. bookings@tapasul.com)
 *
 *  Nothing here is secret except the bindings above — this file is safe to
 *  publish. If a binding is missing the booking is still saved; you just get
 *  a clear warning back and no email.
 * ============================================================================
 */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
};

const MAX_BODY_BYTES = 64 * 1024;      // a booking is ~2 KB; this stops floods
const RATE_MAX_PER_HOUR = 8;           // per IP address, soft guard
const DEFAULT_TO = 'tapasul.digitalcard@gmail.com';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const clean = (v, max = 500) =>
  (v === null || v === undefined ? '' : String(v)).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const parseList = (v) => {
  try {
    const x = JSON.parse(v || '[]');
    return Array.isArray(x) ? x : [];
  } catch (e) { return []; }
};

const list = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const peso = (n, currency = 'PHP') => {
  const sym = currency === 'PHP' ? '\u20B1' : '';
  return sym + num(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* -------------------------------------------------------------------------- *
 *  the booking, as we store it
 * -------------------------------------------------------------------------- */
function readBooking(body, request) {
  const addOns = Array.isArray(body.addOns) ? body.addOns : list(body.addOns);
  const features = list(body.features);
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

  return {
    client_id: clean(body.clientId || '', 80),
    name: clean(body.name, 120),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 40),
    address: clean(body.address, 400),
    notes: clean(body.notes, 2000),

    appt_date: clean(body.date || body.appointmentDate, 40),
    appt_slot: clean(body.slot || body.appointmentTime, 40),

    card_type: clean(body.cardType || (body.type && body.type !== 'booking' ? body.type : ''), 40),
    product_id: clean(body.productId, 60),
    product: clean(body.product, 160),
    quantity: Math.max(1, Math.min(999, Math.round(num(body.quantity || body.qty) || 1))),
    unit_price: num(body.unitPrice || body.unit),
    monthly_hosting: num(body.monthlyHosting || body.monthly),
    branding: clean(body.branding, 80),
    finish: clean(body.finish, 80),
    addons: JSON.stringify(addOns),
    addon_total: num(body.addOnTotal),
    features: JSON.stringify(features),
    profile_name: clean(body.profileName, 120),
    profile_url: clean(body.profileUrl, 200),

    discount: num(body.discount),
    promo_code: clean(body.promoCode || body.promo, 40),
    shipping: num(body.shipping),
    shipping_zone: clean(body.shippingZone || body.zone, 120),
    cod_fee: num(body.codFee || body.cod),
    payment_method: clean(body.paymentMethod || body.payment, 80),
    total: num(body.total),
    deposit: num(body.deposit),
    balance: num(body.balance),
    currency: clean(body.currency || 'PHP', 8),

    where: clean(body.meetAt || body.location || '', 200),
    page_url: clean(body.pageUrl || '', 400),
    referrer: clean(body.referrer || '', 400),
    user_agent: clean(body.userAgent || request.headers.get('user-agent') || '', 400),
    locale: clean(body.locale || '', 40),
    timezone: clean(body.timezone || '', 60),
    consent: clean(body.consent || '', 120),
    utm: JSON.stringify(utm),

    payload: JSON.stringify(body).slice(0, 20000),
  };
}

function newId() {
  const d = new Date();
  const stamp = d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return 'TS-' + stamp + '-' + rand;
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || ''));
const isPhone = (s) => (String(s || '').replace(/[^\d]/g, '').length >= 7);

/* -------------------------------------------------------------------------- *
 *  the email
 * -------------------------------------------------------------------------- */
function bookingRows(b) {
  const rows = [];
  const push = (label, value, strong) => {
    const empty = value === '' || value === null || value === undefined;
    // a bold label with no value is a section heading ("APPOINTMENT", ...)
    if (empty && !strong) return;
    rows.push([label, empty ? '' : String(value), !!strong]);
  };

  push('Booking ID', b.id, true);
  push('Status', 'new');
  push('Sent', b.submittedAt ? b.submittedAt.replace('T', ' ').slice(0, 19) + ' UTC' : '');

  push('APPOINTMENT', '', true);
  push('Date', b.appt_date);
  push('Time', b.appt_slot);
  push('Where', b.where || '');

  push('CUSTOMER', '', true);
  push('Name', b.name, true);
  push('Email', b.email);
  push('Phone', b.phone);
  push('Delivery address', b.address || 'collecting at the appointment');
  push('Notes from them', b.notes);

  push('THE CARD', '', true);
  push('Product', b.product + (b.product_id ? ' (' + b.product_id + ')' : ''));
  push('Card type', b.card_type);
  push('Quantity', String(b.quantity));
  push('Price each', peso(b.unit_price, b.currency));
  push('Branding', b.branding);
  push('Finish', b.finish);
  push('Features on the card', parseList(b.features).join(', '));
  push('Add-ons', parseList(b.addons || b.addOns)
    .map((a) => (typeof a === 'string' ? a : ((a.label || a.title || '') + (a.price ? ' (' + peso(a.price, b.currency) + ')' : ''))))
    .join(', '));
  push('Add-on total', b.addon_total ? peso(b.addon_total, b.currency) : '');

  push('THEIR FREE PAGE', '', true);
  push('Page name', b.profile_name);
  push('Page address', b.profile_url);

  push('MONEY', '', true);
  push('Subtotal', peso(b.unit_price * b.quantity, b.currency));
  push('Discount' + (b.promo_code ? ' (code ' + b.promo_code + ')' : ''), b.discount ? '-' + peso(b.discount, b.currency) : '');
  push('Delivery' + (b.shipping_zone ? ' — ' + b.shipping_zone : ''), b.shipping ? peso(b.shipping, b.currency) : '');
  push('Cash-on-delivery fee', b.cod_fee ? peso(b.cod_fee, b.currency) : '');
  push('Payment method', b.payment_method);
  push('TOTAL', peso(b.total, b.currency), true);
  push('Due today (deposit)', peso(b.deposit, b.currency));
  push('Balance on the day', peso(b.balance, b.currency));
  push('Recurring', b.monthly_hosting ? peso(b.monthly_hosting * b.quantity, b.currency) + ' / month hosting' : 'none');

  push('HOW THEY GOT HERE', '', true);
  push('Page', b.page_url);
  push('Came from', b.referrer || 'direct');
  const utm = (() => { try { return JSON.parse(b.utm || '{}'); } catch (e) { return {}; } })();
  const utmStr = Object.keys(utm).map((k) => k + '=' + utm[k]).join(' · ');
  push('Campaign', utmStr);
  push('Language', b.locale);
  push('Time zone', b.timezone);
  push('Consent', b.consent);
  push('Device', b.user_agent);

  return rows;
}

function emailText(b) {
  const lines = ['NEW BOOKING — ' + (b.product || 'TapAsul card'), ''];
  bookingRows(b).forEach(([label, value, strong]) => {
    if (!label) return;
    if (value === '' && strong) { lines.push('', '— ' + label + ' —'); return; }
    if (value === '') return;
    lines.push(label + ': ' + value);
  });
  lines.push('', 'Saved in your Cloudflare D1 database and in the dashboard:', '');
  return lines.join('\n');
}

function emailHtml(b) {
  const rows = bookingRows(b);
  let body = '';
  rows.forEach(([label, value, strong]) => {
    if (value === '' && strong) {
      body += '<tr><td colspan="2" style="padding:18px 0 6px;font:700 11px/1.2 sans-serif;' +
        'letter-spacing:.09em;text-transform:uppercase;color:#0881ef">' + escapeHtml(label) + '</td></tr>';
      return;
    }
    if (value === '') return;
    body += '<tr>' +
      '<td style="padding:6px 12px 6px 0;font:400 13px/1.5 sans-serif;color:#64748b;vertical-align:top;white-space:nowrap">' +
        escapeHtml(label) + '</td>' +
      '<td style="padding:6px 0;font:' + (strong ? '700' : '600') + ' 13px/1.5 sans-serif;color:#0f172a;' +
        'word-break:break-word">' + escapeHtml(value) + '</td>' +
      '</tr>';
  });

  return '<!doctype html><html><body style="margin:0;background:#eef6ff;padding:24px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto">' +
    '<tr><td style="background:#0881ef;border-radius:16px 16px 0 0;padding:18px 22px;' +
      'font:800 16px/1.3 sans-serif;color:#fff">New TapAsul booking' +
      '<div style="font:500 12px/1.5 sans-serif;color:#cfe6ff;margin-top:4px">' +
        escapeHtml(b.product || '') + ' · ' + escapeHtml(b.quantity + ' pc') + ' · ' +
        escapeHtml(b.appt_date || 'no date') + (b.appt_slot ? ' at ' + escapeHtml(b.appt_slot) : '') +
      '</div></td></tr>' +
    '<tr><td style="background:#fff;padding:20px 22px;border-radius:0 0 16px 16px">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + body + '</table>' +
      '<p style="font:600 13px/1.6 sans-serif;color:#0f172a;margin:22px 0 4px">Reply to this email to write ' +
        'straight back to ' + escapeHtml(b.name) + '.</p>' +
      '<p style="font:400 12px/1.6 sans-serif;color:#64748b;margin:0">' +
        'Saved in Cloudflare D1 as ' + escapeHtml(b.id) + '. Open admin.html to change its status.</p>' +
    '</td></tr></table></body></html>';
}

async function sendEmail(env, b) {
  const to = clean(env.BOOKING_EMAIL || DEFAULT_TO, 200);
  const fromEmail = clean(env.MAIL_FROM || 'bookings@' + (env.SITE_DOMAIN || 'tapasul.com'), 200);
  const subject = 'NEW BOOKING · ' + (b.appt_date || 'no date') +
    (b.appt_slot ? ' ' + b.appt_slot : '') +
    ' · ' + b.quantity + ' × ' + (b.product || 'card') +
    ' · ' + peso(b.total, b.currency) + ' — ' + b.name;

  // 1. Cloudflare Email Routing (no API key, no third party)
  if (env.EMAIL && typeof env.EMAIL.send === 'function') {
    await env.EMAIL.send({
      to,
      from: { email: fromEmail, name: 'TapAsul Bookings' },
      replyTo: b.email,
      subject,
      text: emailText(b),
      html: emailHtml(b),
    });
    return 'cloudflare-email';
  }

  // 2. Resend, if you set the key instead
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM || 'TapAsul <onboarding@resend.dev>',
        to: [to],
        reply_to: b.email,
        subject,
        text: emailText(b),
        html: emailHtml(b),
      }),
    });
    if (!res.ok) throw new Error('Resend ' + res.status + ': ' + (await res.text()).slice(0, 300));
    return 'resend';
  }

  throw new Error('No email binding. Add the Send Email binding (EMAIL) or RESEND_API_KEY.');
}

/* -------------------------------------------------------------------------- *
 *  POST — a new booking
 * -------------------------------------------------------------------------- */
export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ ok: false, error: 'The DB binding is missing. Add your D1 database as "DB" in the Pages settings.' }, 503);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'Too large.' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch (e) { return json({ ok: false, error: 'Bad JSON.' }, 400); }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'Bad JSON.' }, 400);

  // honeypot — a bot filled the hidden field, pretend it worked
  if (body._gotcha || body.website) return json({ ok: true, id: null, quiet: true });

  const b = readBooking(body, request);
  b.id = clean(body.bookingId || '', 40) || newId();
  b.submittedAt = new Date().toISOString();

  const problems = [];
  if (!b.name) problems.push('name');
  if (!isEmail(b.email)) problems.push('email');
  if (!isPhone(b.phone)) problems.push('phone');
  if (problems.length) {
    return json({ ok: false, error: 'Missing or invalid: ' + problems.join(', ') }, 422);
  }

  // the same client id twice (a double tap) should not create two rows
  if (b.client_id) {
    const dupe = await env.DB.prepare('SELECT id FROM bookings WHERE client_id = ? LIMIT 1')
      .bind(b.client_id).first();
    if (dupe) return json({ ok: true, id: dupe.id, duplicate: true });
  }

  // one device flooding the form
  const ip = request.headers.get('cf-connecting-ip') || '';
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const hit = await env.DB.prepare('SELECT COUNT(*) AS n FROM bookings WHERE ip = ? AND created_at > ?')
      .bind(ip, since).first();
    if (hit && hit.n >= RATE_MAX_PER_HOUR) {
      return json({ ok: false, error: 'Too many bookings from this connection in the last hour.' }, 429);
    }
  }

  const cols = [
    'id', 'client_id', 'created_at', 'status', 'ip',
    'name', 'email', 'phone', 'address', 'notes',
    'appt_date', 'appt_slot',
    'card_type', 'product_id', 'product', 'quantity', 'unit_price', 'monthly_hosting',
    'branding', 'finish', 'addons', 'addon_total', 'features', 'profile_name', 'profile_url',
    'discount', 'promo_code', 'shipping', 'shipping_zone', 'cod_fee', 'payment_method',
    'total', 'deposit', 'balance', 'currency',
    'page_url', 'referrer', 'user_agent', 'locale', 'timezone', 'consent', 'utm', 'payload',
    'emailed', 'email_via', 'email_error',
  ];
  const values = [
    b.id, b.client_id, b.submittedAt, 'new', ip,
    b.name, b.email, b.phone, b.address, b.notes,
    b.appt_date, b.appt_slot,
    b.card_type, b.product_id, b.product, b.quantity, b.unit_price, b.monthly_hosting,
    b.branding, b.finish, b.addons, b.addon_total, b.features, b.profile_name, b.profile_url,
    b.discount, b.promo_code, b.shipping, b.shipping_zone, b.cod_fee, b.payment_method,
    b.total, b.deposit, b.balance, b.currency,
    b.page_url, b.referrer, b.user_agent, b.locale, b.timezone, b.consent, b.utm, b.payload,
    0, '', '',
  ];

  try {
    await env.DB.prepare(
      'INSERT INTO bookings (' + cols.join(', ') + ') VALUES (' + cols.map(() => '?').join(', ') + ')'
    ).bind(...values).run();
  } catch (err) {
    return json({ ok: false, error: 'Could not save the booking: ' + String(err && err.message || err).slice(0, 200) }, 500);
  }

  // the booking is safe now — email is best effort
  let emailed = 0, via = '', emailError = '';
  try {
    via = await sendEmail(env, b);
    emailed = 1;
  } catch (err) {
    emailError = String(err && err.message || err).slice(0, 400);
  }

  try {
    await env.DB.prepare('UPDATE bookings SET emailed = ?, email_via = ?, email_error = ? WHERE id = ?')
      .bind(emailed, via, emailError, b.id).run();
  } catch (e) { /* the booking is already saved */ }

  return json({
    ok: true,
    id: b.id,
    emailed: !!emailed,
    warning: emailed ? undefined : 'Saved, but the email did not send: ' + emailError,
  });
}

/* -------------------------------------------------------------------------- *
 *  the PIN
 * -------------------------------------------------------------------------- */
async function pinOk(request, env) {
  const expected = String(env.ADMIN_PIN || '');
  if (!expected) return 'unset';
  const given = request.headers.get('x-admin-pin') ||
    (new URL(request.url).searchParams.get('pin') || '');
  if (!given || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/* -------------------------------------------------------------------------- *
 *  GET — every booking, newest first
 * -------------------------------------------------------------------------- */
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'The DB binding is missing.' }, 503);

  const auth = await pinOk(request, env);
  if (auth === 'unset') {
    return json({ ok: false, error: 'Set the ADMIN_PIN secret in your Pages project, then reload.' }, 503);
  }
  if (!auth) return json({ ok: false, error: 'Wrong PIN.' }, 401);

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') || '300', 10) || 300));
  const status = clean(url.searchParams.get('status') || '', 40);

  const sql = 'SELECT * FROM bookings' + (status ? ' WHERE status = ?' : '') +
    ' ORDER BY created_at DESC LIMIT ?';
  const stmt = env.DB.prepare(sql);
  const { results } = await (status ? stmt.bind(status, limit) : stmt.bind(limit)).all();

  const orders = (results || []).map((r) => ({
    id: r.id,
    submittedAt: r.created_at,
    createdAt: r.created_at,
    status: r.status || 'new',
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    notes: r.notes,
    date: r.appt_date,
    slot: r.appt_slot,
    cardType: r.card_type,
    productId: r.product_id,
    product: r.product,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    monthlyHosting: r.monthly_hosting,
    branding: r.branding,
    finish: r.finish,
    addOns: (() => { try { return JSON.parse(r.addons || '[]'); } catch (e) { return []; } })(),
    addOnTotal: r.addon_total,
    features: (() => { try { return JSON.parse(r.features || '[]'); } catch (e) { return []; } })(),
    profileName: r.profile_name,
    profileUrl: r.profile_url,
    discount: r.discount,
    promoCode: r.promo_code,
    shipping: r.shipping,
    shippingZone: r.shipping_zone,
    codFee: r.cod_fee,
    paymentMethod: r.payment_method,
    total: r.total,
    deposit: r.deposit,
    balance: r.balance,
    currency: r.currency,
    pageUrl: r.page_url,
    referrer: r.referrer,
    userAgent: r.user_agent,
    locale: r.locale,
    timezone: r.timezone,
    consent: r.consent,
    emailed: !!r.emailed,
    emailVia: r.email_via,
    source: 'd1',
  }));

  return json({ ok: true, count: orders.length, orders });
}

/* -------------------------------------------------------------------------- *
 *  PATCH — status / note, so the dashboard writes back to D1
 * -------------------------------------------------------------------------- */
export async function onRequestPatch({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'The DB binding is missing.' }, 503);
  const auth = await pinOk(request, env);
  if (auth === 'unset') return json({ ok: false, error: 'Set the ADMIN_PIN secret.' }, 503);
  if (!auth) return json({ ok: false, error: 'Wrong PIN.' }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad JSON.' }, 400); }
  const id = clean(body && body.id, 60);
  if (!id) return json({ ok: false, error: 'Which booking?' }, 422);

  const sets = [], binds = [];
  if (body.status !== undefined) {
    const allowed = ['new', 'contacted', 'confirmed', 'shipped', 'cancelled', 'done', 'paid'];
    const s = clean(body.status, 20).toLowerCase();
    if (allowed.indexOf(s) === -1) return json({ ok: false, error: 'Unknown status.' }, 422);
    sets.push('status = ?'); binds.push(s);
  }
  if (body.note !== undefined) { sets.push('admin_note = ?'); binds.push(clean(body.note, 2000)); }
  if (!sets.length) return json({ ok: false, error: 'Nothing to change.' }, 422);

  sets.push('updated_at = ?'); binds.push(new Date().toISOString());
  binds.push(id);

  const res = await env.DB.prepare('UPDATE bookings SET ' + sets.join(', ') + ' WHERE id = ?').bind(...binds).run();
  if (!res.meta || !res.meta.changes) return json({ ok: false, error: 'No booking with that id.' }, 404);
  return json({ ok: true, id });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
      'access-control-allow-headers': 'content-type, x-admin-pin',
      'access-control-max-age': '86400',
    },
  });
}
