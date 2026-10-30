// Gully Chain Night: the vendored shared design files must be byte-identical to gully-ops at the locked commit
// (night.lock.json, written by scripts/sync-gullychain-night.mjs), and the logos/badges on the black pages must be the
// brand-kit dark-ground files, byte for byte (SHA-256 of the kit files).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const app = resolve(__dirname, '..');
const sha = (p: string) => createHash('sha256').update(readFileSync(join(app, p))).digest('hex');
const lock = JSON.parse(readFileSync(join(app, 'src/styles/night/night.lock.json'), 'utf8')) as {
  commit: string;
  files: Record<string, { source: string; sha256: string }>;
};

// brand kit v3 (GULLY LABS GRAPHICS/Gully Chain/brand-kit) and the Gully Labs kit, dark-ground variants
const KIT: Record<string, string> = {
  'public/brand/logo/gullychain-logo-transparent.png': '42cae6fbde97046bbc7a0c3c79fe1bd0aae536f66c14a64328684063ee58f7cf',
  'public/brand/logo/gullychain-wordmark-for-dark-bg.svg': '8b92c6af514c0b397a6e60b03dc8fa71aad8b73486b9a4b5bb86551e8e11fb9c',
  'public/brand/badges/gullychain-powered-by-dark.svg': '8c5943234bfe9ea8797680a8a69eef06168cc136e96b15976e9ee1ac7161ec66',
  'public/brand/badges/gullychain-powered-by-dark.png': '208c61fbe1467a14d4eafb62413259443734072e2c20e76b122ab6ea0596d29a',
  'public/brand/badges/gullychain-powered-by-dark-2x.png': 'd29aa29b1765c8a63f1cdb9716ce2bd90fc017cee4d7cbc83dc511b2e4eef836',
  'public/brand/badges/gullychain-powered-by-dark-3x.png': '1f796e51541d0eb6b0ea13772a02c2e660d0daeae70a63f1ef89f870f6a0196b',
  'public/brand/badges/powered-by-gully-labs-dark.svg': '9dbacd2deedf4ea0606a9697cd74f627589a1456d7fea9b600bd81461b57c41b',
  'public/brand/badges/powered-by-gully-labs-dark.png': '49f4b242ca6fb6016f47981a82f4858534a0485375b83cf9e0bedbd86ec73134',
  'public/brand/badges/powered-by-gully-labs-dark-2x.png': '15cee9a5612d6065ddf0feea5f5373e86dca68dbf1376b72364f6b201c8672dd',
  'public/brand/badges/powered-by-gully-labs-dark-3x.png': '78861a7b54bf7a35c1baab3328c7000aad901f9b1fa1b213f8409255e41082ce',
};

describe('Gully Chain Night (shared tokens)', () => {
  it('is locked to a gully-ops commit', () => {
    expect(lock.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(Object.keys(lock.files)).toHaveLength(6);
  });
  for (const [file, { sha256 }] of Object.entries(lock.files)) {
    it(`${file} is byte-identical to gully-ops`, () => expect(sha(file)).toBe(sha256));
  }
  it('the app loads the shared tokens first and has no Studio Light left', () => {
    const main = readFileSync(join(app, 'src/main.tsx'), 'utf8');
    expect(main.indexOf("'./styles/night/tokens.css'")).toBeGreaterThan(-1);
    expect(main.indexOf("'./styles/night/tokens.css'")).toBeLessThan(main.indexOf("'./styles/base.css'"));
    expect(main).not.toMatch(/studio-light/);
    expect(existsSync(join(app, 'src/styles/studio-light.css'))).toBe(false);
  });
  it('the night stylesheets use tokens, not colour literals (masks excepted)', () => {
    for (const f of ['night.css', 'base.css', 'c.css']) {
      const css = readFileSync(join(app, 'src/styles', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const hex = (css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter((h) => h !== '#000');
      expect(hex, f).toEqual([]);
    }
  });
});

describe('brand kit files on the black pages', () => {
  for (const [file, want] of Object.entries(KIT)) {
    it(`${file} is the kit file byte for byte`, () => expect(sha(file)).toBe(want));
  }
  it('no light-ground logo or badge is referenced', () => {
    for (const f of ['src/ui/common/parts.tsx', 'src/ui/common/shell.tsx', 'index.html']) {
      expect(readFileSync(join(app, f), 'utf8'), f).not.toMatch(/for-light-bg|-light\.(svg|png)|-light-[23]x/);
    }
  });
  it('dark theme-color and the dark product switcher', () => {
    expect(readFileSync(join(app, 'index.html'), 'utf8')).toMatch(/name="theme-color" content="#05080D"/);
    expect(readFileSync(join(app, 'src/ui/common/shell.tsx'), 'utf8')).toMatch(/theme="dark"/);
  });
});

// Design-gap audit 2026-10-29: one click from the bridge to every key Gully Chain surface.
describe('navigation reach (gc-switcher 1.7.0 + footer)', () => {
  it('ships gc-switcher 1.7.0 (hover opens the grid; Ecosystem entry) in the dark header', () => {
    const js = readFileSync(join(app, 'src/gc-switcher/gc-switcher.js'), 'utf8');
    expect(js).toMatch(/GC_SWITCHER_VERSION = '1\.7\.0'/);
    expect(js).toMatch(/id: 'ecosystem'[^}]*https:\/\/gullychain\.xyz\/ecosystem\//);
    expect(js).toMatch(/showPopover\(\)/);
    const shell = readFileSync(join(app, 'src/ui/common/shell.tsx'), 'utf8');
    expect(shell).toMatch(/<GullyChainSwitcher current="bridge" theme="dark"/);
  });
  it('footer links the dev portal, the chain ecosystem page and status', () => {
    const parts = readFileSync(join(app, 'src/ui/common/parts.tsx'), 'utf8');
    const foot = parts.slice(parts.indexOf('export function Footer'));
    for (const k of ['LINKS.dev', 'LINKS.chainEcosystem', 'LINKS.status', 'LINKS.explorer', 'LINKS.faucet', 'LINKS.docs']) expect(foot).toContain(`href={${k}}`);
    const chains = readFileSync(join(app, 'src/config/chains.ts'), 'utf8');
    expect(chains).toContain("dev: 'https://dev.gullychain.xyz/'");
    expect(chains).toContain("chainEcosystem: 'https://gullychain.xyz/ecosystem/'");
  });
});
