-- ============================================================================
--  TapAsul bookings — Cloudflare D1 schema
-- ----------------------------------------------------------------------------
--  Run it once on your database:
--    npx wrangler d1 execute tapasul-bookings --remote --file=./schema.sql
--
--  or paste it into: Cloudflare dashboard -> Workers & Pages -> D1 ->
--  tapasul-bookings -> Console -> paste -> Run.
--
--  Every column the booking form collects has its own field, so you can query
--  and export it without digging through JSON. The untouched original is kept
--  in payload as well, so nothing is ever lost if the form grows later.
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  -- identity ----------------------------------------------------------------
  id              TEXT PRIMARY KEY,          -- TS-20261104-A1B2C3
  client_id       TEXT,                      -- from the browser, stops double taps
  created_at      TEXT NOT NULL,             -- ISO 8601, UTC
  updated_at      TEXT,
  status          TEXT NOT NULL DEFAULT 'new',
  admin_note      TEXT,
  ip              TEXT,

  -- who ---------------------------------------------------------------------
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT,
  notes           TEXT,

  -- when / where ------------------------------------------------------------
  appt_date       TEXT,
  appt_slot       TEXT,

  -- what they booked --------------------------------------------------------
  card_type       TEXT,                      -- standard / premium / digital
  product_id      TEXT,
  product         TEXT,
  quantity        INTEGER DEFAULT 1,
  unit_price      REAL DEFAULT 0,
  monthly_hosting REAL DEFAULT 0,            -- per card, per month
  branding        TEXT,
  finish          TEXT,
  addons          TEXT,                      -- JSON: [{id,label,price}]
  addon_total     REAL DEFAULT 0,
  features        TEXT,                      -- JSON: ["Client Reviews", ...]
  profile_name    TEXT,                      -- their free page
  profile_url     TEXT,

  -- money -------------------------------------------------------------------
  discount        REAL DEFAULT 0,
  promo_code      TEXT,
  shipping        REAL DEFAULT 0,
  shipping_zone   TEXT,
  cod_fee         REAL DEFAULT 0,
  payment_method  TEXT,
  total           REAL DEFAULT 0,
  deposit         REAL DEFAULT 0,
  balance         REAL DEFAULT 0,
  currency        TEXT DEFAULT 'PHP',

  -- how they got here -------------------------------------------------------
  page_url        TEXT,
  referrer        TEXT,
  user_agent      TEXT,
  locale          TEXT,
  timezone        TEXT,
  consent         TEXT,
  utm             TEXT,                      -- JSON

  -- the whole thing ---------------------------------------------------------
  payload         TEXT NOT NULL,             -- JSON, exactly what was posted
  emailed         INTEGER DEFAULT 0,
  email_via       TEXT,                      -- cloudflare-email / resend
  email_error     TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_email   ON bookings (email);
CREATE INDEX IF NOT EXISTS idx_bookings_appt    ON bookings (appt_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client  ON bookings (client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ip      ON bookings (ip, created_at);

-- Handy views ---------------------------------------------------------------
CREATE VIEW IF NOT EXISTS bookings_export AS
SELECT
  id                                   AS "Booking ID",
  created_at                           AS "Sent",
  status                               AS "Status",
  appt_date                            AS "Date",
  appt_slot                            AS "Time",
  name                                 AS "Name",
  email                                AS "Email",
  phone                                AS "Phone",
  address                              AS "Address",
  product                              AS "Product",
  card_type                            AS "Card type",
  quantity                             AS "Qty",
  unit_price                           AS "Price each",
  branding                             AS "Branding",
  finish                               AS "Finish",
  features                             AS "Features",
  addons                               AS "Add-ons",
  profile_url                          AS "Free page",
  discount                             AS "Discount",
  shipping + cod_fee                   AS "Delivery",
  payment_method                       AS "Payment",
  total                                AS "Total",
  deposit                              AS "Due today",
  balance                              AS "Balance",
  monthly_hosting * quantity           AS "Monthly hosting",
  notes                                AS "Notes",
  utm                                  AS "Campaign",
  referrer                             AS "Came from"
FROM bookings
ORDER BY created_at DESC;

-- Money you can count -------------------------------------------------------
CREATE VIEW IF NOT EXISTS bookings_totals AS
SELECT
  COUNT(*)                        AS bookings,
  COALESCE(SUM(total), 0)         AS booked_value,
  COALESCE(SUM(deposit), 0)       AS deposits,
  COALESCE(SUM(balance), 0)       AS balances,
  COALESCE(SUM(shipping), 0)      AS delivery_collected,
  COALESCE(SUM(discount), 0)      AS discounts_given
FROM bookings
WHERE status <> 'cancelled';
