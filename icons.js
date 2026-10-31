/* ============================================================================
   TapAsul — icons.js
   Inline SVG icon set. Replaces the Lucide CDN request: no network round-trip,
   no icons popping in late, and they are marked aria-hidden so screen readers
   don't announce decoration.
   Usage:  icon('check', 18)
   ========================================================================= */

window.ICONS = {
  check:       '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  'qr-code':   '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3"/>',
  'refresh-cw': '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  'shield-check': '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'move-3d':   '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
  mail:        '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  phone:       '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  pin:         '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  facebook:    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram:   '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
  tiktok:      '<path d="M16 3v9.5a4.5 4.5 0 1 1-4.5-4.5"/><path d="M16 3c.5 2.5 2 4 4.5 4.2"/>',
  menu:        '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close:       '<path d="M18 6 6 18M6 6l12 12"/>',
  lock:        '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

window.icon = function (name, size) {
  const d = window.ICONS[name];
  if (!d) return '';
  const s = size || 20;
  return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" ' +
         'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
         'stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>';
};
