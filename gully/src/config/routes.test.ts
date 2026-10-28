import { describe, expect, it } from 'vitest';

import { DEFAULT_FAST_ROUTE_ID, FAST_ROUTES, LEGACY_ROUTES, routeFor } from './routes';

describe('fast routes', () => {
  it('defaults to the native ETH route (gas ETH on GullyChain)', () => {
    const d = FAST_ROUTES.find((r) => r.id === DEFAULT_FAST_ROUTE_ID)!;
    expect(d.legacy).toBeFalsy();
    expect(d.tokens.gullychaintestnet.tokenType).toBe('native');
    expect(d.tokens.arbitrumsepolia.tokenType).toBe('native');
  });

  it('keeps gETH and hypETH as redeem-only legacy routes', () => {
    expect(LEGACY_ROUTES.map((r) => r.tokens.gullychaintestnet.symbol).sort()).toEqual(['gETH', 'hypETH']);
  });

  it('never deposits into a legacy route, but redeems through it', () => {
    for (const r of LEGACY_ROUTES) {
      expect(routeFor('deposit', r.id).id).toBe(DEFAULT_FAST_ROUTE_ID);
      expect(routeFor('withdraw', r.id).id).toBe(r.id);
    }
    expect(routeFor('withdraw').id).toBe(DEFAULT_FAST_ROUTE_ID);
  });
});
