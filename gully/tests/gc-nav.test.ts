// Owner rule 2026-11-28: every Gully Chain surface shows the SAME header and footer (links, order, labels, icons, "Gully
// Chain" spelling). The bridge renders them from the shared kit (src/vendor/gc-nav, byte copy of gully-ops
// sites/_shared/gc-nav, checked by tests/stack-check.test.ts). This guard renders the real Header and Footer and runs the
// kit's own audit on them: it fails when a link, its order or its label differs from the kit, on an old kit version, on
// "GullyChain" or on a top X bar.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { auditNav, linksIn } from '../src/vendor/gc-nav/gc-nav.js';

const app = resolve(__dirname, '..');
const SLOW = 120_000;

describe('Gully Chain navigation = the shared gc-nav kit', () => {
  it('header + footer pass the kit audit, Bridge is the active item', async () => {
    const { Header, Footer } = await import('../src/ui/common/shell');
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(Header), createElement(Footer)));
    expect(auditNav(html)).toEqual([]);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="https:\/\/testnet-bridge\.gullychain\.xyz\/"|<a[^>]*href="https:\/\/testnet-bridge\.gullychain\.xyz\/"[^>]*aria-current="page"/);
    // every header and footer link carries an icon (owner rule 2026-10-30), except the logo and the badges
    for (const part of ['header', 'footer'] as const) {
      const block = html.match(new RegExp(`<${part}[^>]*data-gc-nav="${part}"[\\s\\S]*?</${part}>`))![0];
      for (const [, at, inner] of block.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g))
        if (!/gcn-brand|gcn-badge/.test(at)) expect(inner, at).toMatch(/<svg\b/);
    }
    const top = linksIn(html, 'header')!.map((l) => l.text).filter((t) => ['Build', 'Ecosystem', 'Docs', 'Bridge', 'Explorer', 'Community'].includes(t));
    expect(top).toEqual(['Build', 'Ecosystem', 'Docs', 'Bridge', 'Explorer', 'Community']);
  }, SLOW);

  it('the action slot holds Sign in with Gully ID and the wallet button; no top X bar, no product switcher', () => {
    const shell = readFileSync(join(app, 'src/ui/common/shell.tsx'), 'utf8');
    expect(shell).toMatch(/<GcHeader active="bridge"[\s\S]*?<GullySignIn \/>[\s\S]*?<WalletButton compact \/>[\s\S]*?<\/GcHeader>/);
    const index = readFileSync(join(app, 'index.html'), 'utf8');
    expect(index).not.toMatch(/gully-x-banner/);
  });

  it('the page never spells GullyChain (user-facing text)', () => {
    const index = readFileSync(join(app, 'index.html'), 'utf8');
    expect(index.replace(/(href|src)="[^"]*"/g, '')).not.toMatch(/GullyChain(?![A-Za-z])/);
    // the title, description and JSON-LD are filled from vite.config.ts per network
    const vite = readFileSync(join(app, 'vite.config.ts'), 'utf8');
    expect(vite.slice(vite.indexOf('const net ='), vite.indexOf('return {'))).not.toMatch(/'GullyChain/);
  });
});
