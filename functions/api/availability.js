/**
 * ============================================================================
 *  /api/availability — "which days and times are already taken?"
 * ============================================================================
 *
 *  GET /api/availability?from=2026-11-01&to=2026-12-31
 *
 *      -> {
 *           ok: true,
 *           maxPerSlot: 4,
 *           dates: {
 *             "2026-11-08": { "09:00": 4, "11:00": 2 },   // count per time
 *             "2026-11-09": { "09:00": 4, ... }
 *           }
 *         }
 *
 *  Public on purpose: it returns **only counts**. No name, email, phone or
 *  address is ever exposed, so the booking form can grey out a day or a time
 *  that is already full without anyone learning who booked it.
 *
 *  A date is "fully booked" when every slot in `booking.slots` has reached
 *  `booking.maxPerSlot` (both live in site.config.js — the client applies the
 *  same rule, this endpoint just reports the numbers).
 *
 *  Binding this file expects:
 *    DB   D1 database binding -> your tapasul database (see schema.sql)
 *
 *  If the binding is missing the endpoint answers { ok: false, dates: {} }
 *  and the site quietly falls back to the bookings saved in the visitor's own
 *  browser, so nothing breaks.
 * ============================================================================
 */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=30',
  'x-content-type-options': 'nosniff',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';

  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || to < from) {
    return json({ ok: false, error: 'Send from and to as YYYY-MM-DD.' }, 400);
  }

  // keep the answer small: at most a year at a time
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (days > 366) {
    return json({ ok: false, error: 'Ask for at most one year at a time.' }, 400);
  }

  if (!env || !env.DB) {
    return json({ ok: false, reason: 'no-db', dates: {} });
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT appt_date AS date, appt_slot AS slot, COUNT(*) AS n
         FROM bookings
        WHERE appt_date BETWEEN ?1 AND ?2
          AND appt_slot IS NOT NULL AND appt_slot <> ''
          AND status <> 'cancelled'
        GROUP BY appt_date, appt_slot`
    ).bind(from, to).all();

    const dates = {};
    (results || []).forEach((row) => {
      if (!row.date || !row.slot) return;
      (dates[row.date] = dates[row.date] || {})[row.slot] = Number(row.n) || 0;
    });

    return json({ ok: true, dates });
  } catch (err) {
    // a broken database must never stop someone from booking
    return json({ ok: false, reason: 'db-error', dates: {} });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
}
