/*!
 * Gully Chain Night (GN) charts: window.GNCharts. gully-labs/gully-ops sites/_shared/gullychain-night/charts.js
 * Dependency-free SVG: spark, line (with area), bars, count. Colours come from tokens.css; motion from components.css
 * (off under prefers-reduced-motion). Honest data: fewer than two points draws the `empty` text, never a zero line.
 *   GNCharts.line(el, [1, 4, 3], { height: 160, area: true, label: 'TVL, 30 days' })
 *   GNCharts.bars(el, [{ label: 'Oct 28', value: 12 }], { height: 120, label: 'Transactions per day' })
 *   GNCharts.count(el, 2757, { decimals: 0, prefix: '#' })
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function root(host, w, h, label) {
    host.textContent = ''; host.classList.add('gn-chart');
    return el('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none', role: 'img', 'aria-label': label || 'Chart' }, host);
  }
  function clean(v) { return (v || []).map(Number).filter(function (x) { return isFinite(x); }); }
  function empty(svg, w, h, text) {
    el('line', { x1: 0, y1: h - 1, x2: w, y2: h - 1, class: 'grid' }, svg);
    if (text) { var t = el('text', { x: w / 2, y: h / 2 + 4, 'text-anchor': 'middle', class: 'empty' }, svg); t.textContent = text; }
  }
  function ys(vals, h, pad, zero) {
    var min = zero ? 0 : Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max === min) { max += 1; min = Math.max(0, min - 1); }
    return function (v) { return pad + (h - pad * 2) * (1 - (v - min) / (max - min)); };
  }
  function pts(vals, w, h, pad, zero) {
    var y = ys(vals, h, pad, zero), n = vals.length;
    return vals.map(function (v, i) { return [n === 1 ? w / 2 : i * w / (n - 1), y(v)]; });
  }
  function d(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' '); }
  function stroke(path, w) { path.style.setProperty('--gn-len', String(Math.ceil(w * 2.4))); if (!reduced) path.setAttribute('class', path.getAttribute('class') + ' draw'); }

  function spark(host, values, o) {
    o = o || {}; var w = o.width || 120, h = o.height || 32, v = clean(values), svg = root(host, w, h, o.label);
    if (v.length < 2) { empty(svg, w, h, o.empty || ''); return; }
    var p = el('path', { d: d(pts(v, w, h, 3)), class: 'ln' }, svg);
    if (o.color) p.style.stroke = o.color;
    stroke(p, w);
  }
  function line(host, values, o) {
    o = o || {}; var w = o.width || 600, h = o.height || 160, v = clean(values), svg = root(host, w, h, o.label);
    for (var g = 1; g <= 3; g++) el('line', { x1: 0, x2: w, y1: (h * g / 4).toFixed(1), y2: (h * g / 4).toFixed(1), class: 'grid' }, svg);
    if (v.length < 2) { empty(svg, w, h, o.empty || 'No data yet'); return; }
    var p = pts(v, w, h, 6, o.zero);
    if (o.area !== false) el('path', { d: d(p) + ' L' + w + ' ' + h + ' L0 ' + h + ' Z', class: 'ar' + (reduced ? '' : ' fade') }, svg);
    var ln = el('path', { d: d(p), class: 'ln' }, svg);
    if (o.color) ln.style.stroke = o.color;
    stroke(ln, w);
    var last = p[p.length - 1];
    el('circle', { cx: last[0].toFixed(1), cy: last[1].toFixed(1), r: 3.5, fill: o.color || 'var(--gn-c1)', 'vector-effect': 'non-scaling-stroke' }, svg);
  }
  function bars(host, rows, o) {
    o = o || {}; var w = o.width || 600, h = o.height || 140, svg = root(host, w, h, o.label);
    rows = (rows || []).filter(function (r) { return isFinite(Number(r.value)); });
    el('line', { x1: 0, y1: h - 0.5, x2: w, y2: h - 0.5, class: 'grid' }, svg);
    if (!rows.length) { empty(svg, w, h, o.empty || 'No data yet'); return; }
    var max = Math.max.apply(null, rows.map(function (r) { return Number(r.value); })) || 1, n = rows.length, gap = Math.min(10, w / n * 0.25), bw = (w - gap * (n - 1)) / n;
    rows.forEach(function (r, i) {
      var bh = Math.max(Number(r.value) > 0 ? 2 : 0, (h - 4) * Number(r.value) / max);
      var b = el('rect', { x: (i * (bw + gap)).toFixed(1), y: (h - bh).toFixed(1), width: bw.toFixed(1), height: bh.toFixed(1), rx: Math.min(4, bw / 3), class: 'br' + (r.hi ? ' c2' : '') + (reduced ? '' : ' grow') }, svg);
      if (!reduced) b.style.animationDelay = (i * 40) + 'ms';
      var t = el('title', {}, b); t.textContent = (r.label || '') + ': ' + (o.format ? o.format(r.value) : r.value);
    });
  }
  function count(node, to, o) {
    o = o || {}; var dec = o.decimals || 0, pre = o.prefix || '', suf = o.suffix || '';
    var f = function (x) { return pre + Number(x).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    var prev = node.getAttribute('data-v'), from = prev ? Number(prev) : 0; node.setAttribute('data-v', String(to));
    if (reduced || !isFinite(from) || from === to) { node.textContent = f(to); return; }
    var t0 = null, dur = 900;
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  window.GNCharts = { spark: spark, line: line, bars: bars, count: count };
})();
