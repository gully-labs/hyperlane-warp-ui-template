// Real-browser check of Light / Dark / System at 390 / 768 / 1440 (Playwright).
//   BASE=https://testnet-bridge.gullychain.xyz/ node tests/theme-check.mjs <outdir> [label]
//   DIR=<staged build> node tests/theme-check.mjs <outdir> [label]   (serves the folder itself, with the site CSP of
//                                                                      deploy/Caddyfile.bridge when CSP_FILE points at it)
// For each width and theme (?theme=dark|light) it opens: the bridge, the chain picker modal, the USDC tab, the USDC.e
// withdraw card and "Your transfers" (three finished fixture transfers in localStorage), and asserts:
//   theme     <html data-theme> is the theme asked for, and the page ground is dark (luminance < 0.2) or light (> 0.8)
//   contrast  every visible text has 4.5:1 on its ground (3:1 for large text); text on a gradient or a picture is skipped
//   scroll    no sideways scroll
//   console   no page error, no CSP refusal
// Then once at 1440: the header button goes Dark, Light, System, Dark; the choice is saved, survives a reload and is on
// <html> before the app script runs (no flash); System follows the device.
// Screenshots: <outdir>/<screen>-<label>-<theme>-<width>.png. Last line: THEME CHECK: ALL OK | THEME CHECK: <n> failing.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const OUT = process.argv[2] || 'shots';
const LABEL = process.argv[3] || 'after';
const THEMES = (process.env.THEMES || 'dark,light').split(',');
const WIDTHS = (process.env.WIDTHS || '390,768,1440').split(',').map(Number);
mkdirSync(OUT, { recursive: true });
let BASE = process.env.BASE;
let server;
if (!BASE) {
  const dir = process.env.DIR;
  const csp = process.env.CSP_FILE && existsSync(process.env.CSP_FILE) ? /Content-Security-Policy "([^"]+)"/.exec(readFileSync(process.env.CSP_FILE, 'utf8'))?.[1] : '';
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  server = createServer((req, res) => {
    let p = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!existsSync(p) || statSync(p).isDirectory()) p = join(dir, 'index.html');
    const headers = { 'content-type': types[extname(p)] || 'application/octet-stream' };
    if (csp && p.endsWith('.html')) headers['content-security-policy'] = csp;
    res.writeHead(200, headers);
    res.end(readFileSync(p));
  }).listen(0);
  BASE = `http://127.0.0.1:${server.address().port}/`;
  console.log(`serving ${dir}${csp ? ' with the site CSP' : ''}`);
}

// three finished transfers, so "Your transfers" draws without a wallet and nothing polls a chain for them
const A = '0x1111111111111111111111111111111111111111';
const H = (n) => '0x' + String(n).repeat(64);
const now = Date.now();
const FIXTURE = [
  { v: 2, id: 't1', kind: 'fast', direction: 'deposit', from: 'arbitrumsepolia', to: 'gullychaintestnet', amount: '25000000000000000', sendSymbol: 'ETH', receiveSymbol: 'ETH', sender: A, recipient: A, originTx: H(1), destTx: H(2), messageId: H(3), createdAt: now - 3600e3, updatedAt: now - 3500e3, status: 'delivered', etaSeconds: 75 },
  { v: 2, id: 't2', kind: 'canonical', direction: 'withdraw', from: 'gullychaintestnet', to: 'arbitrumsepolia', amount: '10000000000000000', sendSymbol: 'ETH', receiveSymbol: 'ETH', sender: A, recipient: A, originTx: H(4), claimTx: H(5), position: '2', createdAt: now - 7200e3, updatedAt: now - 3000e3, status: 'claimed', etaSeconds: 2700 },
  { v: 2, id: 't3', kind: 'fast', direction: 'withdraw', from: 'gullychaintestnet', to: 'arbitrumsepolia', amount: '5000000000000000', sendSymbol: 'ETH', receiveSymbol: 'ETH', sender: A, recipient: A, originTx: H(6), createdAt: now - 9000e3, updatedAt: now - 8000e3, status: 'failed', error: 'The transfer was not delivered.', etaSeconds: 75 },
];

/* runs in the page: text whose contrast with its ground is under AA */
function contrastAudit(rootSel) {
  const parse = (s) => {
    let m = /^rgba?\(([^)]+)\)/.exec(s);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = /^color\(srgb ([^)]+)\)/.exec(s);
    if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const over = (top, under) => { const a = top[3]; return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]; };
  const lum = (c) => { const v = [c[0], c[1], c[2]].map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const groundOf = (el) => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return null; // gradient or picture: not judged
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; }
    }
    let g = [255, 255, 255, 1];
    const top = layers[layers.length - 1];
    if (!top || top[3] < 0.999) g = parse(getComputedStyle(document.documentElement).backgroundColor) || g;
    for (let i = layers.length - 1; i >= 0; i--) g = over(layers[i], g);
    return g;
  };
  const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.9) return false; } const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const root = document.querySelector(rootSel) || document.body;
  const out = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !visible(el)) continue;
    if (el.closest('.sr, [aria-hidden="true"], :disabled, [aria-disabled="true"], noscript, script, style')) continue;
    if (/\b(sr|skip)\b/.test(el.className)) continue;
    const cs = getComputedStyle(el);
    let fg = parse(cs.color);
    const bg = groundOf(el);
    if (!fg || !bg) continue;
    fg = over(fg, bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const need = px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;
    if (ratio + 0.01 < need) {
      const key = `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} ${cs.color} on ${bg.slice(0, 3).map(Math.round).join(',')}`;
      if (!out.has(key)) out.set(key, `${ratio.toFixed(2)}:1 (needs ${need}) ${key} "${n.textContent.trim().slice(0, 30)}"`);
    }
  }
  return [...out.values()];
}

const browser = await chromium.launch();
let failed = 0;
const fail = (m) => { failed++; console.log('  FAIL', m); };
const watch = (page, errs) => {
  page.on('console', (m) => m.type() === 'error' && (/Refused to|Content Security Policy/i.test(m.text()) || !/Failed to load resource|net::ERR|429|rpc|CORS|favicon/i.test(m.text())) && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
};
const url = (q) => `${BASE}${q ? '?' + q : ''}`;

for (const w of WIDTHS) for (const t of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: t === 'light' ? 'dark' : 'light' }); // the device says the opposite: the choice must win
  await ctx.addInitScript((list) => { try { localStorage.setItem('gully-bridge:transfers', JSON.stringify(list)); } catch (e) {} }, FIXTURE);
  const page = await ctx.newPage();
  const errs = [];
  watch(page, errs);
  const tag = `${w} ${t}`;
  const judge = async (screen, rootSel) => {
    const st = await page.evaluate(() => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(getComputedStyle(document.body).backgroundColor) || [0, 0, 0, 0]; return { theme: document.documentElement.getAttribute('data-theme'), lum: (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255, side: document.documentElement.scrollWidth - innerWidth }; });
    if (st.theme !== t) fail(`${tag} ${screen}: data-theme is ${st.theme}`);
    if (t === 'dark' ? st.lum > 0.2 : st.lum < 0.8) fail(`${tag} ${screen}: page ground luminance ${st.lum.toFixed(2)}`);
    if (st.side > 1) fail(`${tag} ${screen}: sideways scroll ${st.side}px`);
    const low = await page.evaluate(contrastAudit, rootSel || 'body');
    for (const l of low.slice(0, 12)) fail(`${tag} ${screen}: contrast ${l}`);
    return low.length;
  };
  const open = async (q) => { await page.goto(url(q), { waitUntil: 'load' }); await page.waitForSelector('.chain-btn', { timeout: 30000 }); await page.waitForTimeout(3500); };

  // 1. the bridge + Your transfers
  await open(`theme=${t}`);
  let low = await judge('bridge');
  if (!(await page.locator('.mine .mine-row').count())) fail(`${tag}: Your transfers did not draw the fixture`);
  await page.screenshot({ path: join(OUT, `bridge-${LABEL}-${t}-${w}.png`), fullPage: true });
  const mine = page.locator('.mine').first();
  if (await mine.count()) { await mine.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: join(OUT, `transfers-${LABEL}-${t}-${w}.png`) }); }
  // 2. the chain picker modal
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('.chain-btn').first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 8000 }).catch(() => fail(`${tag}: the chain picker did not open`));
  await page.waitForTimeout(500);
  low += await judge('chain picker', '[role="dialog"]');
  await page.screenshot({ path: join(OUT, `modal-${LABEL}-${t}-${w}.png`) });
  await page.keyboard.press('Escape');
  // 3. the USDC tab (deposit) and 4. the USDC.e withdraw card with its claim note
  await open(`theme=${t}&token=USDC`);
  low += await judge('USDC');
  await page.screenshot({ path: join(OUT, `usdc-${LABEL}-${t}-${w}.png`) });
  await open(`theme=${t}&direction=withdraw&token=USDC`);
  await page.waitForTimeout(2500);
  low += await judge('USDC withdraw');
  if (!/challenge period/i.test((await page.locator('.gateway-note').first().innerText().catch(() => '')) || '')) fail(`${tag}: the withdraw card does not name the challenge period`);
  await page.screenshot({ path: join(OUT, `withdraw-${LABEL}-${t}-${w}.png`) });
  if (errs.length) fail(`${tag}: console errors: ${[...new Set(errs)].slice(0, 3).join(' | ')}`);
  console.log(`${tag}: ${low ? low + ' low-contrast texts' : 'contrast ok'}, ${errs.length} console errors`);
  await ctx.close();
}

// the header button: Dark -> Light -> System -> Dark, saved, no flash on reload, System follows the device
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', colorScheme: 'light' });
  // what <html> says when the app's module script starts: the theme must already be there
  await ctx.addInitScript(() => { document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') window.__themeAtParse = document.documentElement.getAttribute('data-theme'); }); });
  const page = await ctx.newPage();
  const errs = [];
  watch(page, errs);
  const state = () => page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), pref: document.documentElement.getAttribute('data-pref'), saved: localStorage.getItem('gullychain-theme'), atParse: window.__themeAtParse, color: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') }));
  const expectState = async (what, want) => { const s = await state(); for (const k of Object.keys(want)) if (s[k] !== want[k]) fail(`toggle ${what}: ${k} is ${s[k]}, expected ${want[k]}`); };
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('[data-theme-btn]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  await expectState('first visit (device light)', { theme: 'dark', pref: 'dark', saved: null, atParse: 'dark' });
  const btn = page.locator('.top-act [data-theme-btn]');
  const box = await btn.boundingBox();
  if (!box || box.width < 44 || box.height < 44) fail(`toggle: the button is ${box ? Math.round(box.width) + 'x' + Math.round(box.height) : 'not visible'} (44 px needed)`);
  await btn.click();
  await expectState('after one click', { theme: 'light', pref: 'light', saved: 'light', color: '#F3F6F5' });
  if (!/Theme: Light/.test((await btn.getAttribute('aria-label')) || '')) fail('toggle: the button does not name the Light choice');
  await page.screenshot({ path: join(OUT, `toggle-${LABEL}-light-1440.png`) });
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('[data-theme-btn]');
  await page.waitForTimeout(2000);
  await expectState('after a reload', { theme: 'light', pref: 'light', atParse: 'light' });
  if ((await page.locator('gc-switcher').first().getAttribute('theme')) !== 'light') fail('toggle: the product switcher did not follow the theme');
  await page.locator('.top-act [data-theme-btn]').click();
  await expectState('System on a light device', { theme: 'light', pref: 'system', saved: 'system' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(300);
  await expectState('System after the device turns dark', { theme: 'dark', pref: 'system' });
  await page.locator('.top-act [data-theme-btn]').click();
  await expectState('back to Dark', { theme: 'dark', pref: 'dark', saved: 'dark', color: '#0A0F0E' });
  if (errs.length) fail(`toggle: console errors: ${[...new Set(errs)].slice(0, 3).join(' | ')}`);
  // phones: the button is in the header too and the bar does not scroll sideways
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const pp = await ph.newPage();
  await pp.goto(BASE, { waitUntil: 'load' });
  await pp.waitForSelector('[data-theme-btn]', { timeout: 30000 });
  await pp.waitForTimeout(2500);
  const pb = await pp.locator('.top-act [data-theme-btn]').boundingBox();
  if (!pb || pb.x < 0 || pb.x + pb.width > 390.5 || pb.width < 44 || pb.height < 44) fail(`toggle 390: button box ${JSON.stringify(pb)}`);
  await pp.locator('.top-act [data-theme-btn]').click();
  if ((await pp.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== 'light') fail('toggle 390: one tap did not switch to Light');
  if ((await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 1) fail('toggle 390: sideways scroll');
  await pp.screenshot({ path: join(OUT, `toggle-${LABEL}-light-390.png`) });
  await ph.close();
  await ctx.close();
  console.log('toggle: checked');
}
await browser.close();
server?.close();
console.log(failed ? `THEME CHECK: ${failed} failing` : 'THEME CHECK: ALL OK');
process.exit(failed ? 1 : 0);
