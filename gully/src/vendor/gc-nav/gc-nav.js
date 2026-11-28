// gc-nav: the Gully Chain header and footer, one model, two renderers (HTML string for static sites, React elements via
// gc-nav-react.js), one runtime (hydrate) and one audit (auditNav) that every consumer's guard test and the live check use.
// Isomorphic ES module, no dependencies, no inline script or style needed (CSP script-src 'self'): styles in gc-nav.css.
import { VERSION, URLS, TOP, MENUS, ACTIONS, FOOTER } from './gc-nav-data.js';

export { VERSION, URLS, TOP, MENUS, ACTIONS, FOOTER };

// 24 px stroke icons (the hybrid landing's drawn set, sites/_shared/chain-hybrid/view.mjs P), plus chevron and x-logo
const P = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5', drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', bridge: 'M3 17h18M5 17V9a7 7 0 0 1 14 0v8M9 17v-5M15 17v-5',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5l-2 5-5 2 2-5z', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a6 6 0 0 0-4-5.6',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7', gift: 'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9S10 4 7.5 4.5 7 8 12 9zm0 0s2-5 4.5-4.5S17 8 12 9z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0', hammer: 'M14 6l4 4M3 21l9-9M12 4l5-1 4 4-1 5-3 3-8-8z',
  x: 'M6 6l12 12M18 6L6 18', menu: 'M4 7h16M4 12h16M4 17h16', chev: 'M6 9l6 6 6-6',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z', monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  blocks: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z', bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  cpu: 'M7 7h10v10H7zM9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  chat: 'M4 5h16v11H8l-4 4z', key: 'M14 10a4 4 0 1 0-4 4l-7 7v-3h3v-3h3l1-1', layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3', xlogo: 'M4 4l16 16M20 4L4 20',
};
const icon = (n, cls = 'gcn-ic') => ['svg', { class: cls, viewBox: '0 0 24 24', width: '18', height: '18', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' }, ['path', { d: P[n] || P.link }]];

/** other hosts open in a new tab; gullychain.xyz and its subdomains stay in the tab */
export const isExternal = (href) => { try { const h = new URL(href).hostname; return !(h === 'gullychain.xyz' || h.endsWith('.gullychain.xyz')); } catch { return false; } };
const a = (href, attrs, ...kids) => ['a', { href, ...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}), ...attrs }, ...kids];

const THEME_LABEL = { dark: 'Dark', light: 'Light', system: 'System' };
const THEME_ICON = { dark: 'moon', light: 'sun', system: 'monitor' };

/**
 * The header as a vnode tree: [tag, attrs, ...children]; a string child is text; ['slot'] is the surface's own actions
 * (Sign in with Gully ID, wallet); ['slot', 'menu'] is what the surface shows inside the phone menu (e.g. Sign in with
 * Gully ID when its header chip is hidden on phones). opts: active (TOP id or null), logo (src of the kit gc-icon), live (Testnet pill with the
 * latest block in [data-gcn-block]), app (show "Open the app"; false on the app itself), theme (show the theme button).
 */
export function headerModel({ active = null, logo = '/brand/logo/gc-icon.svg', live = true, app = true, theme = true } = {}) {
  const item = (t) => {
    const cur = t.id === active ? { 'aria-current': 'page' } : {};
    if (!t.menu) return a(t.href, { class: 'gcn-l', ...cur }, icon(t.icon), t.label);
    return ['div', { class: 'gcn-dd' },
      a(t.href, { class: 'gcn-l gcn-dd-t', ...cur }, icon(t.icon), t.label, icon('chev', 'gcn-ic gcn-chev')),
      ['div', { class: 'gcn-dd-m', role: 'group', 'aria-label': t.label },
        ['ul', {}, ...MENUS[t.menu].map((m) => ['li', {}, a(m.href, { class: 'gcn-mi' }, ['span', { class: 'gcn-mi-i' }, icon(m.icon)], ['span', { class: 'gcn-mi-x' }, ['b', {}, m.label], ['span', {}, m.desc]])])]]];
  };
  const acts = ACTIONS.filter((x) => x.id !== 'app' || app).map((x) => a(x.href, { class: `gcn-btn gcn-act-${x.id}${x.primary ? ' gcn-pri' : ''}` }, icon(x.icon), ['span', { class: 'gcn-btn-l' }, x.label]));
  return ['header', { class: 'gcn-top', 'data-gc-nav': 'header', 'data-gcn-version': VERSION },
    ['div', { class: 'gcn-in' },
      ['a', { class: 'gcn-brand', href: URLS.home, 'aria-label': 'Gully Chain home' }, ['img', { src: logo, width: '28', height: '28', alt: '' }], ['span', {}, 'Gully Chain']],
      ['nav', { class: 'gcn-nav', id: 'gcn-nav', 'aria-label': 'Gully Chain' }, ...TOP.map(item), ['slot', 'menu']],
      ['div', { class: 'gcn-r' },
        ...(live ? [['span', { class: 'gcn-net' }, ['span', { class: 'gcn-dot', 'aria-hidden': 'true' }], 'Testnet ', ['b', { 'data-gcn-block': '' }, '–']]] : []),
        ...acts,
        ['slot'],
        ...(theme ? [['button', { class: 'gcn-icb gcn-theme', type: 'button', 'data-gcn-theme': '', 'aria-label': 'Theme: Dark. Switch to Light', title: 'Theme: Dark' }, icon('moon'), icon('sun'), icon('monitor')]] : []),
        ['button', { class: 'gcn-icb gcn-menu', type: 'button', 'data-gcn-menu': '', 'aria-controls': 'gcn-nav', 'aria-expanded': 'false', 'aria-label': 'Menu' }, icon('menu')]]]];
}

/** opts: logo, labsBadge / labsBadgeLight (kit Powered by Gully Labs badge for each theme), coreBadge / coreBadgeLight (kit Powered by Gully Core) */
export function footerModel({ logo = '/brand/logo/gc-icon.svg', labsBadge = '/brand/gully-labs-badge/powered-by-gully-labs-dark-2x.png', labsBadgeLight = '/brand/gully-labs-badge/powered-by-gully-labs-light-2x.png', coreBadge = '/brand/gully-core-badge/gully-core-powered-by-dark.svg', coreBadgeLight = '/brand/gully-core-badge/gully-core-powered-by-light-2x.png' } = {}) {
  const col = (c) => ['div', { class: 'gcn-fc' }, ['h2', {}, c.title], ['ul', {}, ...c.links.map((l) => ['li', {}, a(l.href, {}, icon(l.icon), l.label)])]];
  return ['footer', { class: 'gcn-foot', 'data-gc-nav': 'footer', 'data-gcn-version': VERSION },
    ['div', { class: 'gcn-fi' },
      ['div', { class: 'gcn-fb' },
        ['a', { class: 'gcn-brand', href: URLS.home, 'aria-label': 'Gully Chain home' }, ['img', { src: logo, width: '28', height: '28', alt: '' }], ['span', {}, 'Gully Chain']],
        ['p', {}, FOOTER.blurb],
        ['div', { class: 'gcn-badges' },
          ['a', { class: 'gcn-badge', href: 'https://gullychain.xyz/gully-core/', 'aria-label': 'Powered by Gully Core' }, ['img', { class: 'gcn-on-dark', src: coreBadge, width: '83', height: '24', alt: 'Powered by Gully Core' }], ['img', { class: 'gcn-on-light', src: coreBadgeLight, width: '83', height: '24', alt: '' }]],
          a('https://gullylabs.xyz/', { class: 'gcn-badge', 'aria-label': 'Powered by Gully Labs (opens in a new tab)' }, ['img', { class: 'gcn-on-dark', src: labsBadge, width: '95', height: '24', alt: 'Powered by Gully Labs' }], ['img', { class: 'gcn-on-light', src: labsBadgeLight, width: '95', height: '24', alt: '' }])]],
      ...FOOTER.columns.map(col)],
    ['div', { class: 'gcn-fl' }, ['span', {}, FOOTER.copy], ...FOOTER.legal.map((l) => a(l.href, {}, icon(l.icon), l.label)), ['span', { class: 'gcn-note' }, FOOTER.note]]];
}

// ---------------------------------------------------------------- HTML renderer
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const VOID = new Set(['img', 'path']);
export function toHTML(node, slotHTML = '', menuHTML = '') {
  if (typeof node === 'string') return esc(node);
  const [tag, attrs = {}, ...kids] = node;
  if (tag === 'slot') return attrs === 'menu' ? `<div class="gcn-mslot">${menuHTML}</div>` : `<span class="gcn-slot">${slotHTML}</span>`;
  const at = Object.entries(attrs).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');
  if (VOID.has(tag)) return tag === 'path' ? `<path${at}/>` : `<img${at}>`;
  return `<${tag}${at}>${kids.map((k) => toHTML(k, slotHTML, menuHTML)).join('')}</${tag}>`;
}
export const headerHTML = (opts = {}) => toHTML(headerModel(opts), opts.slotHTML || '', opts.menuHTML || '');
export const footerHTML = (opts = {}) => toHTML(footerModel(opts));

// ---------------------------------------------------------------- audit (guard tests + live checks)
const norm = (href) => { try { const u = new URL(href, URLS.home); return u.href; } catch { return href; } };
const linkText = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
/** [{ href, text }] of every link inside the element marked data-gc-nav="<part>" in a page's HTML (first one). */
export function linksIn(html, part) {
  const m = html.match(new RegExp(`<(header|footer)[^>]*data-gc-nav="${part}"[\\s\\S]*?</\\1>`));
  if (!m) return null;
  return [...m[0].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, at, inner]) => ({ href: norm((at.match(/href="([^"]*)"/) || [])[1] || ''), text: linkText(inner) || ((at.match(/aria-label="([^"]*)"/) || [])[1] || '') }));
}
/** What a part must contain, in order (the kit itself is the reference). */
export function expectedLinks(part, opts = {}) {
  return linksIn(part === 'header' ? headerHTML(opts) : footerHTML(opts), part);
}
/** Problems with a page's Gully Chain header and footer: [] = same links, same order, same labels as the kit. */
export function auditNav(html, { header = true, footer = true, app = true } = {}) {
  const out = [];
  for (const [part, on] of [['header', header], ['footer', footer]]) {
    if (!on) continue;
    const got = linksIn(html, part);
    if (!got) { out.push(`no ${part} with data-gc-nav="${part}"`); continue; }
    const ver = (html.match(new RegExp(`data-gc-nav="${part}"[^>]*data-gcn-version="([^"]+)"`)) || [])[1];
    if (ver !== VERSION) out.push(`${part}: gc-nav ${ver || '?'} on the page, kit is ${VERSION}`);
    const want = expectedLinks(part, { app });
    const key = (l) => `${l.text} -> ${l.href}`;
    const g = got.map(key), w = want.map(key);
    for (let n = 0; n < Math.max(g.length, w.length); n++) if (g[n] !== w[n]) { out.push(`${part} link ${n + 1}: page "${g[n] || '(none)'}", kit "${w[n] || '(none)'}"`); break; }
  }
  if (/Gully ?Chain/.test(html) && /GullyChain(?![A-Za-z]*\.(?:svg|png|js|json))/.test(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/(href|src|content)="[^"]*"/g, ''))) out.push('spells "GullyChain" (write "Gully Chain")');
  if (/id="gxb"|gully-x-banner\.js/.test(html)) out.push('carries the top X banner (social links live in the footer)');
  return out;
}

// ---------------------------------------------------------------- browser runtime
const KEY = 'gullychain-theme';
const NEXT = { dark: 'light', light: 'system', system: 'dark' };
// the choice shown now: <html data-pref> (theme boot scripts set it, ?theme= included), else the saved one
const readPref = () => { let p = document.documentElement.getAttribute('data-pref'); if (!p) try { p = localStorage.getItem(KEY); } catch { /* private mode */ } return p === 'light' || p === 'system' ? p : 'dark'; };
const resolve = (p) => (p === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : p);
/** Apply a theme choice (saved on this device, same key as every Gully Chain site). Fires 'gcn:theme' on window. */
export function setTheme(pref) {
  const d = document.documentElement;
  try { localStorage.setItem(KEY, pref); } catch { /* private mode */ }
  d.setAttribute('data-theme', resolve(pref)); d.setAttribute('data-pref', pref);
  syncThemeButtons(pref);
  window.dispatchEvent(new CustomEvent('gcn:theme', { detail: { pref, theme: resolve(pref) } }));
}
function syncThemeButtons(pref) {
  for (const b of document.querySelectorAll('[data-gcn-theme]')) {
    b.setAttribute('data-pref', pref);
    b.setAttribute('aria-label', `Theme: ${THEME_LABEL[pref]}. Switch to ${THEME_LABEL[NEXT[pref]]}`);
    b.title = `Theme: ${THEME_LABEL[pref]}`;
  }
}
/** Wire menus, the theme button and Esc. Idempotent; returns a cleanup function. */
export function hydrate(root = document) {
  const top = root.querySelector?.('[data-gc-nav="header"]') || (root.matches?.('[data-gc-nav="header"]') ? root : null);
  if (!top || top.__gcn) return () => {};
  top.__gcn = true;
  const nav = top.querySelector('.gcn-nav'), btn = top.querySelector('[data-gcn-menu]'), th = top.querySelector('[data-gcn-theme]');
  const setOpen = (o) => { top.classList.toggle('gcn-open', o); btn?.setAttribute('aria-expanded', String(o)); btn?.setAttribute('aria-label', o ? 'Close menu' : 'Menu'); };
  const onMenu = () => setOpen(!top.classList.contains('gcn-open'));
  const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); if (document.activeElement && top.contains(document.activeElement)) document.activeElement.blur?.(); } };
  const onNav = (e) => { if (e.target.closest?.('a')) setOpen(false); };
  const onTheme = () => setTheme(NEXT[readPref()]);
  const mq = window.matchMedia?.('(prefers-color-scheme: light)'); const onMq = () => { if (readPref() === 'system') setTheme('system'); };
  btn?.addEventListener('click', onMenu); nav?.addEventListener('click', onNav); th?.addEventListener('click', onTheme);
  document.addEventListener('keydown', onKey); mq?.addEventListener?.('change', onMq);
  syncThemeButtons(readPref());
  const refit = () => fit(top);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(refit) : null;
  ro?.observe(top); const slot = top.querySelector('.gcn-r'); if (slot) ro?.observe(slot);
  window.addEventListener('resize', refit); refit();
  return () => { top.__gcn = false; ro?.disconnect(); window.removeEventListener('resize', refit); btn?.removeEventListener('click', onMenu); nav?.removeEventListener('click', onNav); th?.removeEventListener('click', onTheme); document.removeEventListener('keydown', onKey); mq?.removeEventListener?.('change', onMq); };
}
const FIT = ['gcn-f1', 'gcn-f2', 'gcn-f3', 'gcn-f4', 'gcn-f5'];
/** Drop the least important header parts one step at a time until the row fits its bar (no sideways scroll at any width,
 *  whatever the surface puts in the slot). Called by hydrate on resize and when the slot changes size. */
export function fit(top) {
  const row = top.querySelector('.gcn-in'); if (!row) return;
  top.classList.remove(...FIT);
  const over = () => row.scrollWidth > row.clientWidth + 1; // every item is flex: none, so a row that does not fit overflows
  for (const c of FIT) { if (!over()) break; top.classList.add(c); }
}

/** Show the latest Gully Chain block in the Testnet pill. */
export function setBlock(n) { for (const b of document.querySelectorAll('[data-gcn-block]')) b.textContent = n == null ? '–' : `#${Number(n).toLocaleString('en-US')}`; }
