/* ============================================================================
   TapAsul — seo.js
   ----------------------------------------------------------------------------
   One source of truth for everything that has to be written twice:
   the search-engine meta tags, the JSON-LD structured data, robots.txt,
   sitemap.xml and the web manifest.

   It is used in two places, so they can never drift apart:
     • script.js          (browser) → window.TAPASUL_SEO
     • tools/build-seo.js (Node)   → require('./seo.js')

   You should not need to edit this file. Everything comes from site.config.js.
   ========================================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TAPASUL_SEO = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------- utils */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function money(cfg, n) {
    return cfg.pricing.currency + Number(n).toLocaleString('en-PH');
  }

  // "09623017609" -> "+639623017609"  (for tel: links and schema.org)
  function telHref(phone) {
    var raw = String(phone || '').trim();
    if (!raw) return '';
    var s = raw.replace(/[^\d+]/g, '');
    if (s.charAt(0) === '+') s = s.slice(1);
    if (s.charAt(0) === '0') s = '63' + s.slice(1);
    return '+' + s;
  }

  // {card} {acrylic} {hosting} -> live prices, so copy can never fall out of sync
  function tokens(cfg, str) {
    var out = String(str == null ? '' : str);
    var P = cfg.pricing.products || {};
    (cfg.pricing.order || []).forEach(function (id) {
      if (P[id]) out = out.split('{' + id + '}').join(money(cfg, P[id].price));
    });
    var card = P[(cfg.pricing.order || [])[0]];
    if (card && card.monthly) out = out.split('{hosting}').join(money(cfg, card.monthly));
    return out;
  }

  // "smart NFC" in *stars* becomes <em>, "**bold**" becomes <strong>
  function richText(str) {
    return esc(str)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  // Is the configured URL still the placeholder? Then we fall back to the
  // domain the page is actually being served from, so the site is correct
  // even before you set brand.url.
  function isPlaceholder(url) {
    var u = String(url || '');
    return !u || u.indexOf('tapasul.example') !== -1 || u.indexOf('example.com') !== -1 ||
           u.indexOf('your-domain') !== -1 || u.indexOf('example.org') !== -1;
  }

  // The one place the site decides what its own address is.
  //   base(cfg)         -> the domain exactly as configured (used by the build)
  //   base(cfg, origin) -> falls back to the domain the page is served from
  //                         when brand.url is still the placeholder
  function base(cfg, origin) {
    var u = String((cfg.brand && cfg.brand.url) || '');
    if (origin && isPlaceholder(u)) u = String(origin);
    return u.replace(/\/+$/, '');
  }

  function abs(cfg, path, origin) {
    if (!path) return '';
    if (/^(https?:)?\/\//i.test(path) || path.charAt(0) === '/') return path;
    return base(cfg, origin) + '/' + path.replace(/^\/+/, '');
  }

  /* ------------------------------------------------------ structured data */

  function buildGraph(cfg, origin) {
    var b = cfg.brand, c = cfg.content || {}, b0 = base(cfg, origin);
    var graph = [
      {
        '@type': 'Organization',
        '@id': b0 + '/#org',
        name: b.name,
        url: b0 + '/',
        slogan: b.tagline,
        logo: abs(cfg, (b.logo && b.logo.icon) || 'assets/apple-touch-icon.png', origin),
        email: b.email,
        telephone: telHref(b.phone),
        sameAs: Object.keys(b.socials || {}).map(function (k) { return b.socials[k]; }).filter(Boolean),
        address: { '@type': 'PostalAddress', addressLocality: b.address, addressCountry: 'PH' },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: b.email,
          telephone: telHref(b.phone),
          availableLanguage: ['en', 'fil'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': b0 + '/#site',
        url: b0 + '/',
        name: b.name,
        publisher: { '@id': b0 + '/#org' },
      },
    ];

    (cfg.pricing.order || []).forEach(function (id) {
      var p = cfg.pricing.products[id];
      if (!p) return;
      graph.push({
        '@type': 'Product',
        name: p.name,
        description: p.blurb,
        image: abs(cfg, (p.faces && p.faces.front) || p.thumb, origin),
        brand: { '@type': 'Brand', name: b.name },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: cfg.pricing.currencyCode,
          availability: 'https://schema.org/PreOrder',
          url: b0 + '/#preorder',
        },
      });
    });

    graph.push({
      '@type': 'FAQPage',
      mainEntity: (cfg.faq || []).map(function (f) {
        return {
          '@type': 'Question',
          name: tokens(cfg, f.q),
          acceptedAnswer: { '@type': 'Answer', text: tokens(cfg, f.a) },
        };
      }),
    });

    return graph;
  }

  function jsonLd(cfg, origin) {
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': buildGraph(cfg, origin) }, null, 2);
  }

  /* --------------------------------------------------------- static files */

  function robotsTxt(cfg) {
    var b0 = base(cfg);
    return [
      'User-agent: *',
      'Allow: /',
      '',
      '# The admin dashboard is not for search engines.',
      'Disallow: /admin.html',
      'Disallow: /admin',
      '',
      'Sitemap: ' + b0 + '/sitemap.xml',
      '',
    ].join('\n');
  }

  function sitemapXml(cfg) {
    var b0 = base(cfg);
    var pages = [{ loc: b0 + '/', priority: '1.0', changefreq: 'monthly' }];
    var extra = (cfg.seo && cfg.seo.extraPages) || [];
    extra.forEach(function (p) {
      pages.push({
        loc: b0 + (p.path.charAt(0) === '/' ? p.path : '/' + p.path),
        priority: p.priority || '0.5',
        changefreq: p.changefreq || 'monthly',
      });
    });
    var xml = pages.map(function (p) {
      return '  <url>\n' +
        '    <loc>' + esc(p.loc) + '</loc>\n' +
        '    <changefreq>' + p.changefreq + '</changefreq>\n' +
        '    <priority>' + p.priority + '</priority>\n' +
        '  </url>';
    }).join('\n');
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      xml + '\n</urlset>\n';
  }

  function manifest(cfg) {
    var b = cfg.brand, col = b.colors || {};
    return JSON.stringify({
      name: b.name + ' — ' + ((cfg.content && cfg.content.pageTitleSuffix) || 'Smart NFC Digital Cards'),
      short_name: b.name,
      description: b.description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: col.brandLight || '#f8fafc',
      theme_color: col.brand || '#0881ef',
      icons: [
        { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }, null, 2) + '\n';
  }

  /* ---------------------------------------------------------- head markup */

  function headHtml(cfg, origin) {
    var b = cfg.brand, c = cfg.content || {}, b0 = base(cfg, origin);
    var title = c.pageTitle || (b.name + ' | ' + (c.pageTitleSuffix || 'Smart NFC Digital Cards'));
    var desc = c.metaDescription || b.description;
    var ogDesc = c.ogDescription || desc;
    var img = abs(cfg, b.ogImage, origin);
    var url = b0 + '/';

    return [
      '  <title>' + esc(title) + '</title>',
      '  <meta name="description" content="' + esc(desc) + '">',
      '  <link rel="canonical" href="' + esc(url) + '">',
      '',
      '  <!-- Open Graph / social sharing -->',
      '  <meta property="og:type" content="website">',
      '  <meta property="og:site_name" content="' + esc(b.name) + '">',
      '  <meta property="og:title" content="' + esc(title) + '">',
      '  <meta property="og:description" content="' + esc(ogDesc) + '">',
      '  <meta property="og:image" content="' + esc(img) + '">',
      '  <meta property="og:image:width" content="1200">',
      '  <meta property="og:image:height" content="630">',
      '  <meta property="og:url" content="' + esc(url) + '">',
      '  <meta property="og:locale" content="en_PH">',
      '  <meta property="og:image:alt" content="' + esc(c.ogImageAlt || (b.name + ' — ' + b.tagline)) + '">',
      '  <meta name="twitter:card" content="summary_large_image">',
      '  <meta name="twitter:title" content="' + esc(title) + '">',
      '  <meta name="twitter:description" content="' + esc(ogDesc) + '">',
      '  <meta name="twitter:image" content="' + esc(img) + '">',
    ].join('\n');
  }

  return {
    esc: esc, money: money, telHref: telHref, tokens: tokens,
    richText: richText, abs: abs, base: base, isPlaceholder: isPlaceholder,
    buildGraph: buildGraph, jsonLd: jsonLd,
    robotsTxt: robotsTxt, sitemapXml: sitemapXml, manifest: manifest, headHtml: headHtml,
  };
});
