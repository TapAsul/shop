#!/usr/bin/env node
/* ============================================================================
   TapAsul — tools/build-seo.js
   ----------------------------------------------------------------------------
   Reads site.config.js and regenerates every file that has to contain your
   domain, so you only ever change the domain in ONE place.

   It writes:
     • robots.txt            (blocks the admin dashboard, points at the sitemap)
     • sitemap.xml           (your real domain)
     • manifest.webmanifest  (app name, colours, icons)
     • index.html            (title, description, canonical, Open Graph tags
                              and the JSON-LD structured data)
     • admin.html            (the same Open Graph + canonical tags)

   Run it after editing site.config.js:
       node tools/build-seo.js

   On Cloudflare Pages, put this exact command in "Build command" and it runs
   automatically on every deploy.

   It also prints a short "before you publish" checklist.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const SEO = require(path.join(__dirname, '..', 'seo.js'));

const ROOT = path.join(__dirname, '..');

/* ------------------------------------------------------------------ *
 * 1. Load site.config.js
 *
 * The config is a plain browser script (`window.TAPASUL_CONFIG = {...}`).
 * We evaluate it with a fake `window` so there is exactly ONE config file
 * for both the browser and this build script.
 * ------------------------------------------------------------------ */
function loadConfig() {
  const file = path.join(ROOT, 'site.config.js');
  const src = fs.readFileSync(file, 'utf8');
  const fakeWindow = {};
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', src + '\n;return window.TAPASUL_CONFIG;');
  const cfg = fn(fakeWindow);
  if (!cfg) throw new Error('site.config.js did not define window.TAPASUL_CONFIG');
  return cfg;
}

/* ------------------------------------------------------------------ *
 * 2. Replace a marked block in a file
 * ------------------------------------------------------------------ */
function replaceBlock(file, marker, content) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return false;
  let src = fs.readFileSync(abs, 'utf8');
  const re = new RegExp(
    '(<!--\\s*' + marker + ':begin[^>]*-->)([\\s\\S]*?)(<!--\\s*' + marker + ':end[^>]*-->)'
  );
  if (!re.test(src)) return false;
  src = src.replace(re, (_, b, _old, e) => b + '\n' + content + '\n  ' + e);
  fs.writeFileSync(abs, src, 'utf8');
  return true;
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content, 'utf8');
  console.log('  ✓ ' + file);
}

/* ------------------------------------------------------------------ *
 * 3. Build
 * ------------------------------------------------------------------ */
function main() {
  const cfg = loadConfig();
  const base = SEO.base(cfg);

  console.log('\nBuilding SEO files for ' + (base || '(no domain set)') + '\n');

  write('robots.txt', SEO.robotsTxt(cfg));
  write('sitemap.xml', SEO.sitemapXml(cfg));
  write('manifest.webmanifest', SEO.manifest(cfg));

  // head block inside index.html
  const head = SEO.headHtml(cfg);
  if (replaceBlock('index.html', 'seo', head)) console.log('  ✓ index.html (meta + Open Graph)');
  else console.log('  ! index.html — could not find the <!-- seo:begin --> markers');

  // JSON-LD inside index.html
  const ld = '<script type="application/ld+json" id="structured-data">\n' +
    SEO.jsonLd(cfg).split('\n').map((l) => '  ' + l).join('\n') +
    '\n  </script>';
  if (replaceBlock('index.html', 'ld', ld)) console.log('  ✓ index.html (structured data)');

  // admin.html gets the same title + canonical so it never looks broken
  const adminHead = [
    '  <title>' + SEO.esc(cfg.brand.name) + ' — Pre-order dashboard</title>',
    '  <meta name="robots" content="noindex, nofollow">',
    '  <link rel="canonical" href="' + SEO.esc(base + '/admin.html') + '">',
    '  <meta property="og:title" content="' + SEO.esc(cfg.brand.name + ' — Pre-order dashboard') + '">',
    '  <meta property="og:description" content="Internal pre-order dashboard.">',
  ].join('\n');
  if (replaceBlock('admin.html', 'seo', adminHead)) console.log('  ✓ admin.html (noindex + title)');

  console.log('');
  checklist(cfg);
}

/* ------------------------------------------------------------------ *
 * 4. "Before you publish" checklist
 * ------------------------------------------------------------------ */
function checklist(cfg) {
  const items = [];
  const url = String(cfg.brand.url || '');

  if (!url || url.indexOf('tapasul.example') !== -1) {
    items.push(['✗', 'brand.url is still the placeholder',
      'Set it to your real domain, e.g. https://tapasul.com, then run this again.']);
  } else if (!/^https:\/\//i.test(url)) {
    items.push(['!', 'brand.url should start with https://',
      'Cloudflare gives you a free HTTPS certificate — use https://']);
  } else {
    items.push(['✓', 'Domain set', url]);
  }

  const pin = (cfg.order && cfg.order.admin && cfg.order.admin.pin) || '';
  if (!pin || pin === '1234') {
    items.push(['✗', 'Admin PIN is still the default',
      'Change order.admin.pin in site.config.js. Anyone can read it — it is a soft lock.']);
  } else if (String(pin).length < 6) {
    items.push(['!', 'Admin PIN is short', 'Use at least 6 characters.']);
  } else {
    items.push(['✓', 'Admin PIN changed', '••••••']);
  }

  const mode = cfg.order && cfg.order.mode;
  if (mode === 'demo') {
    items.push(['!', 'Order mode is "demo"',
      'Set order.mode to "email" so pre-orders actually reach you.']);
  } else {
    items.push(['✓', 'Order mode', mode]);
  }

  if (mode === 'formspree' || mode === 'google-form') {
    if (!cfg.order.endpoint) {
      items.push(['✗', 'Order endpoint is empty',
        'Add the Formspree / Apps Script URL to order.endpoint.']);
    } else {
      items.push(['✓', 'Order endpoint set', cfg.order.endpoint]);
    }
  }

  if (!cfg.brand.email) {
    items.push(['✗', 'brand.email is empty', 'Pre-orders need somewhere to go.']);
  }

  if (cfg.order && cfg.order.admin && !cfg.order.admin.remoteUrl) {
    items.push(['!', 'No remote order sheet',
      'Without order.admin.remoteUrl you only see orders made on this device.']);
  }

  const photo = (cfg.team || []).every((m) => !m.photo);
  if (photo) items.push(['!', 'No team photos', 'Add photo: "assets/team/your-photo.jpg"']);

  console.log('  Before you publish');
  console.log('  ' + '─'.repeat(58));
  items.forEach(([mark, title, note]) => {
    console.log('  ' + mark + ' ' + title + (note ? '\n      ' + note : ''));
  });
  console.log('  ' + '─'.repeat(58) + '\n');
}

try {
  main();
} catch (err) {
  console.error('\n✗ Build failed: ' + err.message + '\n');
  process.exit(1);
}
