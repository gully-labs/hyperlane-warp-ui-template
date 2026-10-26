import { describe, expect, it } from 'vitest';

import { pickRoute } from './selectRoute';

const e = (n: number) => BigInt(Math.round(n * 1e6)) * 10n ** 12n;

describe('pickRoute', () => {
  it('prefers fast for deposits', () => {
    expect(pickRoute({ direction: 'deposit', amount: e(0.1), fastAvailable: true }).kind).toBe('fast');
  });
  it('falls back to canonical when fast is down', () => {
    expect(pickRoute({ direction: 'deposit', amount: e(0.1), fastAvailable: false }).kind).toBe('canonical');
  });
  it('falls back to canonical above fast liquidity', () => {
    expect(pickRoute({ direction: 'deposit', amount: e(2), fastAvailable: true, fastLiquidity: e(1) }).kind).toBe(
      'canonical',
    );
  });
  it('withdraws fast when the user holds the fast token', () => {
    expect(
      pickRoute({ direction: 'withdraw', amount: e(0.1), fastAvailable: true, fastTokenBalance: e(0.5), childEthBalance: 0n })
        .kind,
    ).toBe('fast');
  });
  it('withdraws canonical when the user only holds gas ETH', () => {
    expect(
      pickRoute({ direction: 'withdraw', amount: e(0.1), fastAvailable: true, fastTokenBalance: 0n, childEthBalance: e(1) })
        .kind,
    ).toBe('canonical');
  });
  it('defaults to fast when no wallet is connected', () => {
    expect(pickRoute({ direction: 'withdraw', amount: null, fastAvailable: true }).kind).toBe('fast');
  });
});
