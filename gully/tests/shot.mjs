// Quick screenshots: node tests/shot.mjs <url> <outdir> [widths...]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://127.0.0.1:5231/', out = 'screenshots', ...ws] = process.argv.slice(2);
const widths = ws.length ? ws.map(Number) : [375, 1440];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => undefined);
  await page.waitForTimeout(Number(process.env.WAIT || 4000)); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500); await page.evaluate(() => window.scrollTo(0, 0));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const name = `${out}/${new URL(url).port}-${w}.png`;
  await page.screenshot({ path: name, fullPage: true });
  console.log(name, 'scrollWidth', sw, 'errors', errs.length, errs.slice(0, 5));
  await page.close();
}
await browser.close();
