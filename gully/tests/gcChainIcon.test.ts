// Gully Chain kit v4 (owner rule: logos pixel perfect): the chain icon the bridge shows for Gully Chain
// (src/ui/common/parts.tsx: chains/gully-chain.svg, testnet chains/gully-chain-testnet.svg) is brand-kit-v4/logo/gc-icon.svg
// byte for byte for both; the testnet indicator is the bridge's own badge, never drawn into the logo.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const app = resolve(__dirname, '..');
const sha = (p: string) => createHash('sha256').update(readFileSync(join(app, p))).digest('hex');

describe('Gully Chain kit v4 chain icon', () => {
  it('public/chains/gully-chain.svg and gully-chain-testnet.svg are gc-icon.svg byte for byte', () => {
    expect(sha('public/chains/gully-chain.svg')).toBe('4f86d2a0c2bb1afda317f21ae7c2198564ca61241f2c48cc75df1cb87033739b');
    expect(sha('public/chains/gully-chain-testnet.svg')).toBe('4f86d2a0c2bb1afda317f21ae7c2198564ca61241f2c48cc75df1cb87033739b');
  });
  it('the bridge points at those files', () => {
    const parts = readFileSync(join(app, 'src/ui/common/parts.tsx'), 'utf8');
    expect(parts).toContain("mark: 'chains/gully-chain.svg', badged: 'chains/gully-chain-testnet.svg'");
  });
});
