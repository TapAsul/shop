#!/usr/bin/env node
/* ==========================================================================
   Keeps the Content-Security-Policy hash in sync with the small inline
   "boot check" script in index.html.

   The boot check is the banner that says "this page did not finish loading"
   when the site files did not all arrive. Because Cloudflare's _headers
   file sets a strict `script-src 'self'`, that one inline script needs a
   SHA-256 hash to be allowed.

   Run this after editing the boot-check <script> block in index.html:

       node tools/update-csp-hash.js

   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const headersPath = path.join(root, '_headers');

const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script id="bootCheck">([\s\S]*?)<\/script>/);
if (!match) {
  console.error('Could not find the boot-check script (id="bootCheck") in index.html.');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(match[1], 'utf8').digest('base64');
const directive = "script-src 'self' 'sha256-" + hash + "';";

let headers = fs.readFileSync(headersPath, 'utf8');
const before = headers;
headers = headers.replace(/script-src 'self'(?: 'sha256-[^']*')?;/, directive);
if (headers === before) {
  console.error('Could not find the script-src directive in _headers.');
  process.exit(1);
}
fs.writeFileSync(headersPath, headers);

console.log('Content-Security-Policy hash updated');
console.log('  ' + directive);
