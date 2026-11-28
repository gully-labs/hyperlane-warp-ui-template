// Light / Dark / System: the Light set is the gullychain.xyz Light set (no new colours), AA on every text pair, dark untouched.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { asPref, GROUND, LABEL, NEXT, resolve, THEME_KEY } from '../src/ui/common/theme';

const text = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const css = text('src/styles/light.css');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

// the Light set of gullychain.xyz (gully-ops sites/_shared/chain-hybrid/h.css, [data-theme="light"])
const LIGHT_SET = ['#F3F6F5', '#FFFFFF', '#EBF0EE', '#DEE6E3', '#D5DEDB', '#B4C2BE', '#0A0F0E', '#26302E', '#52625E', '#00B36B', '#00663F', '#007A4B', '#D6F7E8', '#005B39', '#FEF3C7', '#8A4B00', '#B91C1C', '#047857', '#00A464', '#3754A0', '#B45309', '#7E22CE'];

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** the value of a role in the Light block (a literal) */
const role = (name: string) => {
  const m = new RegExp(name + ':\\s*(#[0-9A-Fa-f]{6})\\s*;').exec(rules);
  if (!m) throw new Error('no literal for ' + name);
  return m[1].toUpperCase();
};
/** color-mix(in srgb, fg p%, bg) as a hex */
const mix = (fg: string, pct: number, bg: string) =>
  '#' +
  [1, 3, 5]
    .map((i) => Math.round((parseInt(fg.slice(i, i + 2), 16) * pct + parseInt(bg.slice(i, i + 2), 16) * (100 - pct)) / 100).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

describe('light theme', () => {
  it('uses only the gullychain.xyz Light colours', () => {
    const used = [...new Set((rules.match(/#[0-9A-Fa-f]{3,8}\b/g) || []).map((h) => h.toUpperCase()))];
    expect(used.filter((h) => !LIGHT_SET.includes(h))).toEqual([]);
  });
  it('touches nothing in the dark theme: every rule is under [data-theme="light"], except the theme button', () => {
    const selectors = rules.split('}').map((r) => r.split('{')[0].trim()).filter(Boolean);
    for (const s of selectors) for (const one of s.split(',').map((x) => x.trim())) expect(one.startsWith(':root[data-theme="light"]') || one.startsWith('.theme-btn'), one).toBe(true);
    expect(text('src/styles/night/tokens.css')).toContain('color-scheme: dark');
    expect(text('src/main.tsx').trim().split(/\r?\n/).filter((l) => l.startsWith('import ')).pop()).toBe("import './styles/light.css';");
  });
  it('AA (4.5:1) for text on every ground it is written on', () => {
    const grounds = [role('--gn-bg'), role('--gn-surface'), role('--gn-surface-2'), role('--gn-surface-3')];
    const pairs: [string, string, string][] = [];
    for (const g of grounds) for (const t of ['--gn-text', '--gn-text-2', '--gn-text-3', '--gn-link', '--gn-green', '--gn-warn', '--gn-danger']) pairs.push([t, role(t), g]);
    // labels and fast-lane chips (accent), amber series text
    for (const g of [role('--gn-bg'), role('--gn-surface'), role('--gn-surface-2'), role('--gn-info-bg')]) pairs.push(['--gn-cyan', role('--gn-cyan'), g]);
    // the amber series colour is for chart marks and icons (3:1); text that used it in dark is written in --gn-warn here
    expect(ratio(role('--gn-c3'), role('--gn-surface'))).toBeGreaterThan(3);
    expect(rules).toMatch(/\.chain-mark-arb,[^{]*\.feed-canonical \{ color: var\(--gn-warn\); \}/);
    // fills: text on accent, on danger, on the tag, on the warning chip, ink on emerald, the selected chain row
    pairs.push(['on accent', role('--gn-on-cyan'), role('--gn-cyan')], ['night on accent', role('--gn-night'), role('--gn-cyan')], ['night on done step', role('--gn-night'), role('--gn-green')]);
    pairs.push(['on danger', role('--gn-on-cyan'), role('--gn-danger')], ['tag', role('--gn-badge-fg'), role('--gn-badge-bg')], ['ok', role('--gn-ok'), role('--gn-ok-bg')], ['link on tag', role('--gn-link'), role('--gn-info-bg')]);
    pairs.push(['warn chip', role('--gn-warn'), role('--gn-warn-bg')], ['ink on emerald', '#0A0F0E', '#00C878'], ['ink on primary hover', '#0A0F0E', role('--gn-btn-pri-hover')]);
    pairs.push(['selected chain mark', role('--gn-green'), mix(role('--gn-green'), 10, role('--gn-night'))], ['danger on its tint', role('--gn-danger'), mix(role('--gn-danger'), 10, role('--gn-surface'))]);
    const bad = pairs.filter(([, fg, bg]) => ratio(fg, bg) < 4.5).map(([n, fg, bg]) => `${n} ${fg} on ${bg} = ${ratio(fg, bg).toFixed(2)}`);
    expect(bad).toEqual([]);
  });
  it('the focus ring is visible (3:1) and the footer keeps the dark roles', () => {
    expect(ratio(role('--gn-link'), role('--gn-bg'))).toBeGreaterThan(3);
    expect(rules).toMatch(/:root\[data-theme="light"\] \.foot \{[^}]*--gn-text: var\(--gc-white\)/);
    expect(GROUND.light).toBe(role('--gn-bg'));
  });
});

describe('theme choice', () => {
  it('Dark is the default; the button goes Dark, Light, System', () => {
    expect(asPref(null)).toBe('dark');
    expect(asPref('nope')).toBe('dark');
    expect(asPref('light')).toBe('light');
    expect(asPref('system')).toBe('system');
    expect([NEXT.dark, NEXT.light, NEXT.system]).toEqual(['light', 'system', 'dark']);
    expect([LABEL.dark, LABEL.light, LABEL.system]).toEqual(['Dark', 'Light', 'System']);
  });
  it('System follows the device; Dark and Light do not', () => {
    expect(resolve('system', true)).toBe('light');
    expect(resolve('system', false)).toBe('dark');
    expect(resolve('dark', true)).toBe('dark');
    expect(resolve('light', false)).toBe('light');
  });
  it('the boot file applies the same choice before paint, with no inline script', () => {
    const boot = text('public/theme-boot.js');
    expect(boot).toContain("'" + THEME_KEY + "'");
    expect(boot).toContain("setAttribute('data-theme'");
    expect(boot).toContain("setAttribute('data-pref'");
    expect(boot).toContain(GROUND.light);
    const html = text('index.html');
    expect(html).toContain('<script src="/theme-boot.js"></script>');
    expect(html).not.toMatch(/<script>/);
    expect(html.indexOf('/theme-boot.js')).toBeLessThan(html.indexOf('/src/main.tsx'));
  });
  it('the header has the button and the product switcher follows the theme', () => {
    const shell = text('src/ui/common/shell.tsx');
    expect(shell).toContain('data-theme-btn');
    expect(shell).toContain('theme={theme}');
    expect(shell).toContain('setThemePref(NEXT[pref])');
  });
});
