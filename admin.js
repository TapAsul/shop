/* ==========================================================================
   TapAsul Admin — dashboard logic
   No dependencies. Reads site.config.js, shows pre-orders captured by the
   public site, and gives you a copy-and-paste pricing editor.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.TAPASUL_CONFIG || {};
  var ADMIN = CFG.order && CFG.order.admin ? CFG.order.admin : {};
  var PRODUCTS = (CFG.pricing && CFG.pricing.order) || [];
  var P = (CFG.pricing && CFG.pricing.products) || {};
  var CURRENCY = (CFG.pricing && CFG.pricing.currency) || '₱';
  var STATUSES = ADMIN.statuses || ['new', 'contacted', 'confirmed', 'shipped', 'cancelled'];
  var KEY = ADMIN.storageKey || 'tapasul_orders_v1';

  var SESSION_KEY = 'tapasul_admin_unlocked';
  var state = { orders: [], view: 'overview', selected: null, prices: {} };

  /* ---------------- helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function money(n) {
    var v = Number(n) || 0;
    return CURRENCY + v.toLocaleString('en-PH');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function dateOf(o) {
    var d = o.submittedAt ? new Date(o.submittedAt) : new Date(o.createdAt || 0);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  function dayKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function shortDate(d) {
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }

  function statusBadge(status) {
    var s = String(status || 'new');
    var cls = 'badge badge--' + (STATUSES.indexOf(s) >= 0 ? s : 'new');
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  /* ---------------- data ---------------- */
  function localOrders() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function writeLocal(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* quota */ }
  }

  function normalise(o, source) {
    return {
      id: o.id || ('ts_' + Math.random().toString(36).slice(2, 9)),
      submittedAt: o.submittedAt || o.createdAt || new Date().toISOString(),
      name: o.name || o.customer || '',
      email: o.email || '',
      product: o.product || '',
      productId: o.productId || '',
      quantity: Number(o.quantity || o.qty || 1),
      unitPrice: Number(o.unitPrice || 0),
      monthlyHosting: Number(o.monthlyHosting || 0),
      discount: Number(o.discount || 0),
      total: Number(o.total || 0),
      currency: o.currency || 'PHP',
      status: o.status || 'new',
      note: o.note || '',
      source: o.source || source || 'site',
    };
  }

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false, i;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];

    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1)
      .filter(function (r) { return r.some(function (c) { return String(c).trim(); }); })
      .map(function (r) {
        var o = {};
        head.forEach(function (h, i) { o[h] = (r[i] === undefined ? '' : r[i]).trim(); });
        return normalise(o, 'sheet');
      });
  }

  function loadRemote() {
    var url = ADMIN.remoteUrl;
    if (!url) return Promise.resolve([]);
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('json') >= 0) return r.json();
        return r.text();
      })
      .then(function (data) {
        if (Array.isArray(data)) return data.map(function (o) { return normalise(o, 'sheet'); });
        if (typeof data === 'string') return parseCSV(data);
        if (data && Array.isArray(data.orders)) return data.orders.map(function (o) { return normalise(o, 'sheet'); });
        return [];
      })
      .catch(function () { return []; });
  }

  function load() {
    var local = localOrders().map(function (o) { return normalise(o, 'local'); });
    return loadRemote().then(function (remote) {
      var seen = {};
      var merged = [];
      // remote first so local edits win on conflict
      remote.concat(local).forEach(function (o) {
        if (seen[o.id]) return;
        seen[o.id] = true;
        merged.push(o);
      });
      merged.sort(function (a, b) { return dateOf(b) - dateOf(a); });
      state.orders = merged;
      renderAll();
    });
  }

  function saveStatus(id, status) {
    var list = localOrders();
    var hit = false;
    list.forEach(function (o) {
      if (o.id === id) { o.status = status; hit = true; }
    });
    if (!hit) {
      var found = state.orders.filter(function (o) { return o.id === id; })[0];
      if (found) { var copy = Object.assign({}, found, { status: status }); list.unshift(copy); }
    }
    writeLocal(list);
    state.orders.forEach(function (o) { if (o.id === id) o.status = status; });
    renderAll();
  }

  function deleteOrder(id) {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    writeLocal(localOrders().filter(function (o) { return o.id !== id; }));
    state.orders = state.orders.filter(function (o) { return o.id !== id; });
    if (state.selected === id) { state.selected = null; renderDetail(); }
    renderAll();
    toast('Order deleted');
  }

  /* ---------------- gate ---------------- */
  function gateOpen() { return $('#gate').style.display !== 'none'; }

  function unlock() {
    $('#gate').style.display = 'none';
    $('#app').classList.add('on');
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* ignore */ }
    load();
  }

  function lock() {
    $('#app').classList.remove('on');
    $('#gate').style.display = '';
    $('#pin').value = '';
    $('#pin').focus();
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  $('#gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var pin = $('#pin').value.trim();
    if (pin && pin === String(ADMIN.pin)) {
      $('#gateErr').classList.remove('show');
      unlock();
    } else {
      $('#gateErr').classList.add('show');
      $('#pin').select();
    }
  });

  $('#lockBtn').addEventListener('click', lock);
  $('#refreshBtn').addEventListener('click', function () { load(); toast('Refreshed'); });

  /* ---------------- navigation ---------------- */
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.view = tab.dataset.view;
      $$('.tab').forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + state.view; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = $('.tab[data-view="' + b.dataset.goto + '"]');
      if (t) t.click();
    });
  });

  /* ---------------- overview ---------------- */
  function renderStats() {
    var orders = state.orders;
    var revenue = 0, units = 0, hosting = 0, pending = 0;
    var monthKey = dayKey(new Date()).slice(0, 7);
    var thisMonth = 0;

    orders.forEach(function (o) {
      revenue += o.total;
      units += o.quantity;
      hosting += o.monthlyHosting * o.quantity;
      if (o.status === 'new' || o.status === 'contacted') pending++;
      if (dayKey(dateOf(o)).slice(0, 7) === monthKey) thisMonth++;
    });

    $('#statRevenue').textContent = money(revenue);
    $('#statRevenueNote').textContent = 'across ' + orders.length + ' order' + (orders.length === 1 ? '' : 's');
    $('#statOrders').textContent = orders.length;
    $('#statOrdersNote').textContent = thisMonth + ' this month';
    $('#statUnits').textContent = units;
    $('#statAvg').textContent = orders.length ? money(Math.round(revenue / orders.length)) : money(0);
    $('#statHosting').textContent = money(hosting) + ' / month hosting';
    $('#statPending').textContent = pending;
    $('#orderCount').textContent = orders.length;
  }

  function renderChart() {
    var wrap = $('#chart');
    wrap.innerHTML = '';
    var days = [], counts = {}, total = 0;
    for (var i = 13; i >= 0; i--) {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
      counts[dayKey(d)] = 0;
    }
    state.orders.forEach(function (o) {
      var k = dayKey(dateOf(o));
      if (k in counts) { counts[k]++; total++; }
    });
    var max = Math.max.apply(null, days.map(function (d) { return counts[dayKey(d)]; }).concat([1]));
    days.forEach(function (d) {
      var n = counts[dayKey(d)];
      var col = el('div', { class: 'chart__col', title: n + ' order' + (n === 1 ? '' : 's') + ' on ' + d.toDateString() });
      col.appendChild(el('div', { class: 'chart__value', text: n ? String(n) : '' }));
      col.appendChild(el('div', {
        class: 'chart__bar' + (n ? '' : ' is-empty'),
        style: 'height:' + Math.max(3, Math.round((n / max) * 100)) + '%'
      }));
      col.appendChild(el('div', { class: 'chart__label', text: d.getDate() === 1 ? d.toLocaleDateString('en-PH', { month: 'short' }) : String(d.getDate()) }));
      wrap.appendChild(col);
    });
    $('#chartTotal').textContent = total + ' order' + (total === 1 ? '' : 's');
  }

  function renderMix() {
    var box = $('#mixList');
    box.innerHTML = '';
    var totals = {}, revenue = {};
    state.orders.forEach(function (o) {
      var k = o.productId || o.product || 'Other';
      totals[k] = (totals[k] || 0) + o.quantity;
      revenue[k] = (revenue[k] || 0) + o.total;
    });
    var keys = Object.keys(totals);
    if (!keys.length) {
      box.appendChild(el('p', { class: 'empty', style: 'padding:24px 0', text: 'No orders yet.' }));
      return;
    }
    var max = Math.max.apply(null, keys.map(function (k) { return totals[k]; }));
    keys.forEach(function (k) {
      var row = el('div', { style: 'margin-bottom:16px' });
      var head = el('div', { style: 'display:flex;justify-content:space-between;gap:12px;margin-bottom:6px' });
      head.appendChild(el('strong', { style: 'font-size:.9rem;color:var(--ink)', text: (P[k] && P[k].name) || k }));
      head.appendChild(el('span', { style: 'font-size:.85rem;color:var(--text-muted)', text: totals[k] + ' unit' + (totals[k] === 1 ? '' : 's') + ' · ' + money(revenue[k]) }));
      row.appendChild(head);
      var bar = el('div', { style: 'height:9px;border-radius:99px;background:var(--surface-alt);overflow:hidden' });
      bar.appendChild(el('div', { style: 'height:100%;width:' + Math.round((totals[k] / max) * 100) + '%;background:linear-gradient(90deg,var(--brand),#4aa6f5);border-radius:99px' }));
      row.appendChild(bar);
      box.appendChild(row);
    });
  }

  /* ---------------- tables ---------------- */
  function orderRows(orders, withActions) {
    var table = el('table');
    var thead = el('thead');
    var hr = el('tr');
    ['Order', 'Customer', 'Product', 'Qty', 'Total', 'Monthly', 'Status', 'Placed'].forEach(function (h) {
      hr.appendChild(el('th', { text: h }));
    });
    if (withActions) hr.appendChild(el('th', { text: '' }));
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    orders.forEach(function (o) {
      var tr = el('tr');
      tr.appendChild(el('td', {}, [
        el('div', { style: 'font-weight:600;color:var(--ink)', text: o.name || '—' }),
        el('div', { style: 'font-size:.75rem;color:var(--text-faint)', text: o.id })
      ]));
      tr.appendChild(el('td', {}, [
        o.email ? el('a', { href: 'mailto:' + o.email, text: o.email }) : el('span', { text: '—' })
      ]));
      tr.appendChild(el('td', { text: o.product || '—' }));
      tr.appendChild(el('td', { class: 'num', text: String(o.quantity) }));
      tr.appendChild(el('td', { class: 'num', style: 'font-weight:700', text: money(o.total) }));
      tr.appendChild(el('td', { class: 'num', text: o.monthlyHosting ? money(o.monthlyHosting) : '—' }));
      tr.appendChild(el('td', {}, [])).innerHTML = statusBadge(o.status);
      tr.appendChild(el('td', { style: 'white-space:nowrap;font-size:.82rem;color:var(--text-muted)', text: shortDate(dateOf(o)) }));

      if (withActions) {
        var actions = el('td');
        var sel = el('select', { class: 'rowbtn', style: 'padding:3px 6px' });
        STATUSES.forEach(function (s) {
          var opt = el('option', { value: s, text: s });
          if (s === o.status) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', function () {
          saveStatus(o.id, sel.value);
          toast('Marked as ' + sel.value);
        });
        actions.appendChild(sel);

        var view = el('button', { class: 'rowbtn', type: 'button', text: 'View', style: 'margin-left:6px' });
        view.addEventListener('click', function () {
          state.selected = o.id;
          renderDetail();
          var t = $('.tab[data-view="orders"]');
          if (t && state.view !== 'orders') t.click();
          $('#orderDetail').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        actions.appendChild(view);

        var del = el('button', { class: 'rowbtn danger', type: 'button', text: 'Delete', style: 'margin-left:6px' });
        del.addEventListener('click', function () { deleteOrder(o.id); });
        actions.appendChild(del);
        tr.appendChild(actions);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  function filteredOrders() {
    var q = ($('#search').value || '').toLowerCase().trim();
    var st = $('#filterStatus').value;
    var pr = $('#filterProduct').value;
    var range = parseInt($('#filterRange').value, 10);
    var cut = null;
    if (range) { cut = new Date(); cut.setDate(cut.getDate() - range); }

    return state.orders.filter(function (o) {
      if (st && o.status !== st) return false;
      if (pr && (o.productId || o.product) !== pr) return false;
      if (cut && dateOf(o) < cut) return false;
      if (q) {
        var hay = [o.name, o.email, o.product, o.productId, o.id, o.status, o.note].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderOrders() {
    var list = filteredOrders();
    var box = $('#ordersTable');
    box.innerHTML = '';
    if (!state.orders.length) {
      box.appendChild(el('div', { class: 'empty' }, [
        el('h3', { text: 'No orders yet' }),
        el('p', { text: 'Pre-orders submitted through the site appear here. Set the order mode in site.config.js to "local" so they are captured, or point the dashboard at a published Google Sheet to collect orders from every device.' })
      ]));
      return;
    }
    if (!list.length) {
      box.appendChild(el('div', { class: 'empty' }, [
        el('h3', { text: 'Nothing matches those filters' }),
        el('p', { text: 'Try clearing the search box or widening the date range.' })
      ]));
      return;
    }
    box.appendChild(orderRows(list, true));
  }

  function renderRecent() {
    var box = $('#recentTable');
    box.innerHTML = '';
    if (!state.orders.length) {
      box.appendChild(el('div', { class: 'empty' }, [
        el('h3', { text: 'Nothing here yet' }),
        el('p', { text: 'Pre-orders will show up on this page as soon as the site starts capturing them.' })
      ]));
      return;
    }
    box.appendChild(orderRows(state.orders.slice(0, 6), false));
  }

  function renderDetail() {
    var box = $('#orderDetail');
    box.innerHTML = '';
    var o = state.orders.filter(function (x) { return x.id === state.selected; })[0];
    if (!o) {
      box.appendChild(el('p', { style: 'color:var(--text-muted);font-size:.9rem', text: 'Select an order to see the full details.' }));
      return;
    }
    var rows = [
      ['Order ID', o.id],
      ['Customer', o.name],
      ['Email', o.email],
      ['Product', o.product],
      ['Quantity', String(o.quantity)],
      ['Unit price', money(o.unitPrice)],
      ['Discount', o.discount ? '-' + money(o.discount) : '—'],
      ['Total', money(o.total)],
      ['Monthly hosting', o.monthlyHosting ? money(o.monthlyHosting) + ' / month' : '—'],
      ['Status', o.status],
      ['Placed', shortDate(dateOf(o))],
      ['Source', o.source === 'local' ? 'this device' : (o.source || 'site')],
      ['Note', o.note || '—'],
    ];
    var table = el('table');
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', { style: 'width:170px;font-weight:600;color:var(--text-muted)', text: r[0] }));
      tr.appendChild(el('td', { text: r[1] }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);

    var mail = el('a', {
      class: 'btn btn--primary btn--sm',
      href: 'mailto:' + (o.email || '') +
        '?subject=' + encodeURIComponent('Your TapAsul pre-order ' + o.id) +
        '&body=' + encodeURIComponent('Hi ' + (o.name || '') + ',\n\nThanks for your pre-order.\n\nOrder: ' + o.id + '\nProduct: ' + o.product + '\nQuantity: ' + o.quantity + '\nTotal: ' + money(o.total) + '\n\n— TapAsul'),
      text: 'Email this customer',
      style: 'margin-top:16px'
    });
    box.appendChild(mail);
  }

  /* ---------------- pricing editor ---------------- */
  function loadPrices() {
    state.prices = {};
    PRODUCTS.forEach(function (id) {
      var p = P[id] || {};
      state.prices[id] = { price: p.price, monthly: p.monthly || 0 };
    });
    renderPriceRows();
    renderPriceCode();
  }

  function renderPriceRows() {
    var box = $('#priceRows');
    box.innerHTML = '';
    PRODUCTS.forEach(function (id) {
      var p = P[id] || {};
      var row = el('div', { class: 'price-row' });
      row.appendChild(el('div', { class: 'price-row__name' }, [
        document.createTextNode(p.name || id),
        el('small', { text: p.shortName || id })
      ]));

      var priceIn = el('input', { class: 'input', type: 'number', min: '0', step: '1', value: state.prices[id].price, 'aria-label': (p.name || id) + ' price' });
      priceIn.addEventListener('input', function () {
        state.prices[id].price = Number(priceIn.value) || 0;
        renderPriceCode();
      });
      row.appendChild(el('div', {}, [el('div', { class: 'field-label', style: 'font-size:.72rem;color:var(--text-faint);margin-bottom:4px', text: 'Price' }), priceIn]));

      var monIn = el('input', { class: 'input', type: 'number', min: '0', step: '1', value: state.prices[id].monthly, 'aria-label': (p.name || id) + ' monthly fee' });
      monIn.addEventListener('input', function () {
        state.prices[id].monthly = Number(monIn.value) || 0;
        renderPriceCode();
      });
      row.appendChild(el('div', {}, [el('div', { class: 'field-label', style: 'font-size:.72rem;color:var(--text-faint);margin-bottom:4px', text: 'Per month' }), monIn]));

      row.appendChild(el('div', { style: 'font-weight:700;color:var(--ink)', text: money(state.prices[id].price) }));
      box.appendChild(row);
    });
  }

  function renderPriceCode() {
    var lines = ['pricing: {', '  products: {'];
    PRODUCTS.forEach(function (id) {
      var p = P[id] || {};
      lines.push('    ' + id + ': {');
      lines.push('      price: ' + state.prices[id].price + ',');
      lines.push('      monthly: ' + state.prices[id].monthly + (state.prices[id].monthly ? ',   // ' + (p.monthlyLabel || 'recurring') : '   // no recurring fee'));
      lines.push('      // ...keep the rest of this product as it is');
      lines.push('    },');
    });
    lines.push('  },');
    lines.push('  // order: ["' + PRODUCTS.join('", "') + '"]');
    lines.push('}');
    $('#priceCode').textContent = lines.join('\n');
  }

  $('#copyPrice').addEventListener('click', function () {
    var text = $('#priceCode').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied — paste it into site.config.js'); });
    } else {
      var ta = el('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied — paste it into site.config.js'); } catch (e) { toast('Press Ctrl+C to copy'); }
      document.body.removeChild(ta);
    }
  });

  $('#resetPrice').addEventListener('click', function () { loadPrices(); toast('Reset to the values in site.config.js'); });

  /* ---------------- setup ---------------- */
  function renderSetup() {
    var mode = (CFG.order && CFG.order.mode) || 'email';
    var note = $('#modeNote');
    note.innerHTML = '';

    var copy = {
      email: 'Pre-orders arrive in your inbox as an email. Works today with no backend. Each order is also copied into this dashboard on that device.',
      local: 'Orders are saved in the visitor\'s browser and — if you set an endpoint — POSTed to your sheet. Point "remoteUrl" below at a published Google Sheet to see every device\'s orders here.',
      formspree: 'Orders are POSTed to Formspree and land in your Formspree inbox. They are not readable from this dashboard unless you also set "remoteUrl".',
      'google-form': 'Orders are POSTed to a Google Form / Apps Script Web App. Not readable from this dashboard unless you also set "remoteUrl".',
      demo: 'Demo mode: the form validates and shows a notice but sends nothing.',
    }[mode] || '';
    note.appendChild(el('div', { html: '<strong>Current mode: <code>' + esc(mode) + '</code></strong><br>' + esc(copy) }));

    var opts = $('#modeOptions');
    opts.innerHTML = '';
    var modes = [
      ['email', 'Email — opens the visitor\'s mail app with the order filled in. No backend, zero cost.'],
      ['local', 'Local + sheet — saves the order and POSTs it to your endpoint. Best for a dashboard-driven workflow.'],
      ['formspree', 'Formspree — POSTs to a form endpoint; entries arrive by email.'],
      ['google-form', 'Google Form / Apps Script — appends a row to a Google Sheet.'],
      ['demo', 'Demo — validates only, sends nothing.'],
    ];
    modes.forEach(function (m) {
      var b = el('button', {
        class: 'btn ' + (m[0] === mode ? 'btn--primary' : 'btn--ghost') + ' btn--sm',
        type: 'button',
        text: m[0] + (m[0] === mode ? '  ✓' : ''),
        style: 'margin:0 8px 8px 0'
      });
      b.addEventListener('click', function () {
        navigator.clipboard && navigator.clipboard.writeText('    mode: "' + m[0] + '",')
          .then(function () { toast('Copied — paste it into site.config.js'); });
      });
      b.title = m[1];
      opts.appendChild(b);
    });
    opts.appendChild(el('p', { style: 'font-size:.84rem;color:var(--text-muted);margin-top:6px', text: 'Click a mode to copy the line, then paste it over the "mode:" line in site.config.js.' }));

    // checklist
    var box = $('#checklist');
    box.innerHTML = '';
    var seoClean = (state.seoFiles || []).length
      ? state.seoFiles.every(function (f) { return f.clean; })
      : null;
    var items = [
      ['Real domain', CFG.brand.url && CFG.brand.url.indexOf('tapasul.example') === -1, 'brand.url — drives the canonical link, og:url and the sitemap.', CFG.brand.url],
      ['Domain in SEO files', seoClean === null ? true : seoClean, seoClean === null
        ? 'robots.txt and sitemap.xml — checking…'
        : (seoClean ? 'robots.txt and sitemap.xml point at your real domain.' : 'robots.txt and sitemap.xml still point at tapasul.example.'), ''],
      ['Order mode chosen', mode !== 'demo', 'order.mode is set to "' + mode + '".', mode],
      ['Admin PIN changed', String(ADMIN.pin) !== '1234' && !!ADMIN.pin, 'order.admin.pin — change the default 1234 before publishing.', ADMIN.pin],
      ['Remote order sheet', !!ADMIN.remoteUrl, 'order.admin.remoteUrl — a published Google Sheet CSV so you can read orders from any device.', ADMIN.remoteUrl],
      ['Team photos added', !!(P && Object.keys(P) && (CFG.team || []).every(function (m) { return m.photo; })), 'team[].photo — both founders have a portrait in assets/team/.', ''],
      ['Acrylic artwork', !!((P.acrylic && P.acrylic.faces && P.acrylic.faces.front)), 'pricing.products.acrylic.faces.front — the standee still uses the generated design.', ''],
    ];
    items.forEach(function (it) {
      var row = el('div', { class: 'check ' + (it[1] ? 'check--done' : 'check--todo') });
      row.appendChild(el('div', { class: 'check__icon', text: it[1] ? '✓' : '!' }));
      var body = el('div', { class: 'check__body' });
      body.appendChild(el('strong', { text: it[0] }));
      body.appendChild(el('p', { html: esc(it[2]) + (it[3] ? ' <code>' + esc(it[3]) + '</code>' : '') }));
      row.appendChild(body);
      box.appendChild(row);
    });

    // storage
    var sb = $('#storageBox');
    sb.innerHTML = '';
    var local = localOrders();
    var rows = [
      ['Orders stored on this device', local.length],
      ['Storage key', KEY],
      ['Remote sheet', ADMIN.remoteUrl ? 'connected' : 'not connected'],
    ];
    rows.forEach(function (r) {
      var line = el('div', { style: 'display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid var(--line);font-size:.9rem' });
      line.appendChild(el('span', { style: 'color:var(--text-muted)', text: r[0] }));
      line.appendChild(el('strong', { style: 'color:var(--ink);word-break:break-all;text-align:right', text: String(r[1]) }));
      sb.appendChild(line);
    });
    var clear = el('button', { class: 'btn btn--danger btn--sm', type: 'button', text: 'Clear orders on this device', style: 'margin-top:14px' });
    clear.addEventListener('click', function () {
      if (!confirm('Delete every order stored in this browser? This cannot be undone.')) return;
      writeLocal([]);
      load();
      toast('Cleared');
    });
    sb.appendChild(clear);

    // details
    var grid = $('#detailGrid');
    grid.innerHTML = '';
    [
      ['Email', CFG.brand.email],
      ['Phone', CFG.brand.phone],
      ['Address', CFG.brand.address],
      ['Order inbox', CFG.order.orderEmail],
      ['Instagram', (CFG.brand.socials && CFG.brand.socials.instagram) || ''],
      ['Site URL', CFG.brand.url],
    ].forEach(function (d) {
      var cell = el('div', { style: 'padding:12px 0;border-bottom:1px solid var(--line)' });
      cell.appendChild(el('div', { style: 'font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:var(--text-faint);font-weight:700', text: d[0] }));
      cell.appendChild(el('div', { style: 'font-weight:600;color:var(--ink);word-break:break-word', text: d[1] || '—' }));
      grid.appendChild(cell);
    });
  }

  // download a verbatim copy of site.config.js (comments included) as a backup
  function downloadConfigBackup() {
    fetch('site.config.js', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('Could not read site.config.js');
        return r.text();
      })
      .then(function (text) {
        var blob = new Blob([text], { type: 'text/javascript' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'site.config.js';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        toast('Downloaded site.config.js — keep it somewhere safe.');
      })
      .catch(function (err) {
        toast(err.message || 'Could not download the config.');
      });
  }

  // check the real robots.txt / sitemap.xml for the placeholder domain
  function checkSeoFiles() {
    var files = ['robots.txt', 'sitemap.xml'];
    state.seoFiles = [];
    files.forEach(function (f) {
      state.seoFiles.push({ name: f, clean: false });
    });
    files.forEach(function (f, i) {
      fetch(f, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (txt) {
          state.seoFiles[i].clean = !!txt && txt.indexOf('tapasul.example') === -1;
          state.seoFiles[i].checked = true;
          renderSetup();
        })
        .catch(function () { state.seoFiles[i].checked = true; });
    });
  }

  /* ---------------- csv export ---------------- */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;      // stop spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
  }

  $('#csvBtn').addEventListener('click', function () {
    var list = filteredOrders();
    var head = ['id', 'submittedAt', 'name', 'email', 'product', 'productId', 'quantity', 'unitPrice', 'monthlyHosting', 'discount', 'total', 'currency', 'status', 'note', 'source'];
    var lines = [head.map(csvCell).join(',')];
    list.forEach(function (o) {
      lines.push(head.map(function (k) { return csvCell(o[k]); }).join(','));
    });
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'tapasul-orders-' + dayKey(new Date()) + '.csv' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Exported ' + list.length + ' order' + (list.length === 1 ? '' : 's'));
  });

  $('#printBtn').addEventListener('click', function () { window.print(); });

  /* ---------------- filters ---------------- */
  ['#search', '#filterStatus', '#filterProduct', '#filterRange'].forEach(function (sel) {
    $(sel).addEventListener('input', renderOrders);
    $(sel).addEventListener('change', renderOrders);
  });

  function fillFilters() {
    var st = $('#filterStatus');
    STATUSES.forEach(function (s) { st.appendChild(el('option', { value: s, text: s })); });
    var pr = $('#filterProduct');
    PRODUCTS.forEach(function (id) {
      pr.appendChild(el('option', { value: id, text: (P[id] && P[id].shortName) || id }));
    });
  }

  /* ---------------- boot ---------------- */
  function renderAll() {
    renderStats();
    renderChart();
    renderMix();
    renderRecent();
    renderOrders();
    renderDetail();
    renderSetup();
    var remote = ADMIN.remoteUrl ? '· remote sheet connected' : '· this device only';
    $('#storeNote').textContent = state.orders.length + ' order' + (state.orders.length === 1 ? '' : 's') + ' ' + remote;
  }

  fillFilters();
  loadPrices();
  checkSeoFiles();

  var backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.addEventListener('click', downloadConfigBackup);

  var unlocked = false;
  try { unlocked = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { unlocked = false; }
  if (unlocked && ADMIN.enabled !== false) {
    unlock();
  } else {
    $('#gate').style.display = '';
    setTimeout(function () { $('#pin').focus(); }, 60);
  }
})();
