/* ============================================================================
   TapAsul — legal.js
   Renders Terms of Use, Refund Policy and Privacy Policy from site.config.js.
   Every page is the same shell; the content comes from legalPages.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.TAPASUL_CONFIG || {};
  var legal = CFG.legal || {};
  var pages = CFG.legalPages || {};

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // {company} {email} {phone} {address} {law} {dpo} {dpoEmail} {retention}
  function fill(text) {
    var L = legal;
    var map = {
      company: L.businessStyle || L.companyName || CFG.brand.name,
      companyName: L.companyName || CFG.brand.name,
      email: L.email || CFG.brand.email,
      phone: L.phone || CFG.brand.phone,
      address: L.address || CFG.brand.address,
      law: L.governingLaw || 'the Philippines',
      dpo: L.dpoName || 'Data Protection Officer',
      dpoEmail: L.dpoEmail || L.email || CFG.brand.email,
      retention: L.orderRetentionMonths || 24,
    };
    return String(text == null ? '' : text).replace(/\{(\w+)\}/g, function (m, k) {
      return map[k] !== undefined ? map[k] : m;
    });
  }

  function render() {
    var key = document.body.getAttribute('data-legal');
    var page = pages[key];
    if (!page) return;

    document.title = (page.title || 'Legal') + ' — ' + (CFG.brand.name || 'TapAsul');
    var h1 = document.getElementById('legalTitle');
    if (h1) h1.textContent = page.title || '';

    var lede = document.getElementById('legalLede');
    if (lede) lede.textContent = fill(page.lede || '');

    var meta = document.getElementById('legalMeta');
    if (meta) {
      meta.innerHTML =
        '<div><strong>Operator</strong>' + esc(legal.businessStyle || legal.companyName || '') + '</div>' +
        '<div><strong>Contact</strong><a href="mailto:' + esc(legal.email || '') + '">' + esc(legal.email || '') + '</a></div>' +
        '<div><strong>Data Protection Officer</strong><a href="mailto:' + esc(legal.dpoEmail || '') + '">' + esc(legal.dpoEmail || '') + '</a></div>' +
        '<div><strong>Last updated</strong>' + esc(pages.updated || '') + '</div>';
    }

    var body = document.getElementById('legalBody');
    if (body) {
      body.innerHTML = (page.sections || []).map(function (sec) {
        var paras = (sec.body || []).map(function (p) { return '<p>' + esc(fill(p)) + '</p>'; }).join('');
        var list = (sec.list || []).length
          ? '<ul>' + sec.list.map(function (i) { return '<li>' + esc(fill(i)) + '</li>'; }).join('') + '</ul>'
          : '';
        return '<section><h2>' + esc(fill(sec.heading || '')) + '</h2>' + paras + list + '</section>';
      }).join('');
    }

    var notice = document.getElementById('legalNotice');
    if (notice) notice.textContent = pages.notice || '';

    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    var links = document.getElementById('legalLinks');
    if (links) {
      links.innerHTML = [
        ['terms', 'Terms of Use'],
        ['refund', 'Refund Policy'],
        ['privacy', 'Privacy Policy'],
      ].map(function (p) {
        return '<a href="' + p[0] + '.html"' + (p[0] === key ? ' class="is-current" aria-current="page"' : '') + '>' + p[1] + '</a>';
      }).join('');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
