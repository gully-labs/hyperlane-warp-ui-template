// Real-browser check of the USDC.e withdraw card at 390 / 768 / 1440 (Playwright).
//   BASE=https://testnet-bridge.gullychain.xyz/ node tests/usdc-withdraw-check.mjs <outdir> [label]
//   DIR=<staged build> node tests/usdc-withdraw-check.mjs <outdir> [label]   (serves the folder itself)
// Opens ?direction=withdraw&token=USDC and asserts: the token is USDC.e, the card names the challenge period (testnet and
// mainnet), the claim on Arbitrum Sepolia, no "Coming soon", no sideways scroll, no console errors.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const OUT = process.argv[2] || 'shots';
const LABEL = process.argv[3] || 'after';
mkdirSync(OUT, { recursive: true });
let BASE = process.env.BASE;
let server;
if (!BASE) {
  const dir = process.env.DIR;
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  server = createServer((req, res) => {
    let p = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!existsSync(p) || statSync(p).isDirectory()) p = join(dir, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  }).listen(0);
  BASE = `http://127.0.0.1:${server.address().port}/`;
}

const browser = await chromium.launch();
let failed = 0;
const fail = (m) => { failed++; console.log('  FAIL', m); };
for (const w of [390, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|net::ERR|429|rpc|CORS|favicon/i.test(m.text()) && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`${BASE}?direction=withdraw&token=USDC`, { waitUntil: 'load' });
  await page.waitForSelector('.chain-btn', { timeout: 30000 });
  await page.waitForTimeout(6000);
  const text = await page.locator('body').innerText();
  const card = (await page.locator('.gateway-note').first().innerText().catch(() => '')) || '';
  if (!/USDC\.e/.test(text)) fail(`${w}: USDC.e not shown`);
  if (!/challenge period/i.test(card)) fail(`${w}: the card does not name the challenge period`);
  if (!/7 days on mainnet/.test(card)) fail(`${w}: the card does not give the mainnet wait`);
  if (!/claim/i.test(card) || !/Arbitrum Sepolia/.test(card)) fail(`${w}: the card does not explain the claim on Arbitrum Sepolia`);
  if (/coming soon/i.test(card)) fail(`${w}: card says Coming soon`);
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (sideways > 1) fail(`${w}: sideways scroll ${sideways}px`);
  const eta = /about ([0-9]+ (minutes|hours|days)) on testnet/.exec(card)?.[1];
  console.log(`${w}: card ok=${/challenge period/i.test(card)} testnet wait=${eta || '(quote not read)'}`);
  await page.screenshot({ path: join(OUT, `withdraw-${LABEL}-${w}.png`), fullPage: false });
  if (errs.length) fail(`${w}: console errors: ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
}
await browser.close();
server?.close();
console.log(failed ? `USDC WITHDRAW CHECK: ${failed} failing` : 'USDC WITHDRAW CHECK: ALL OK');
process.exit(failed ? 1 : 0);
