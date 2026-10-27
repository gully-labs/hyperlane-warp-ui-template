import { afterEach, describe, expect, it, vi } from 'vitest';

import { REDSTONE_PRICE_URL, ethN, fetchEthUsd, fmtUsd, parseGullyPrice, parseRedstone, toUsd } from './usd';

describe('USD display', () => {
  it('formats compact USD like the explorer', () => {
    expect(fmtUsd(50_000)).toBe('$50K');
    expect(fmtUsd(1_234_567)).toBe('$1.2M');
    expect(fmtUsd(1234)).toBe('$1,234');
    expect(fmtUsd(12.4)).toBe('$12.40');
    expect(fmtUsd(0.078)).toBe('$0.078');
    expect(fmtUsd(0.5)).toBe('$0.50');
    expect(fmtUsd(0)).toBe('$0');
  });

  it('keeps tiny ETH amounts short (the 0.000000334824 case)', () => {
    expect(ethN(0.000000334824)).toBe('0.0₆335');
    expect(ethN(0.0123)).toBe('0.0123');
    expect(ethN(1.23456789)).toBe('1.2346');
    expect(ethN(12345.6)).toBe('12,346');
    expect(ethN(0)).toBe('0');
  });

  it('never makes up a price', () => {
    const now = Date.now();
    expect(parseRedstone({ ETH: { value: 3000, timestamp: now } }, now)?.usd).toBe(3000);
    expect(parseRedstone({ ETH: { value: 3000, timestamp: now - 60 * 60_000 } }, now)).toBeNull();
    expect(parseRedstone({ ETH: { value: -1, timestamp: now } }, now)).toBeNull();
    expect(parseGullyPrice({ symbol: 'ETH', usd: 2324.62, source: 'coingecko', ts: Math.floor(now / 1000) }, now)?.usd).toBe(2324.62);
    expect(parseGullyPrice({ symbol: 'ETH', usd: 2324.62, ts: Math.floor(now / 1000) - 3600 }, now)).toBeNull();
    expect(parseGullyPrice({ symbol: 'BTC', usd: 2324.62, ts: Math.floor(now / 1000) }, now)).toBeNull();
    expect(parseGullyPrice({}, now)).toBeNull();
    expect(toUsd(1, null)).toBeNull();
    expect(toUsd(0.5, { usd: 3000, at: now, source: 'Gully price API' })).toBe(1500);
  });
});

describe('ETH/USD source order', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks gullychain.xyz/price/eth first, then RedStone, and never CoinGecko', async () => {
    const now = Date.now();
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url === REDSTONE_PRICE_URL) return new Response(JSON.stringify({ ETH: { value: 3100, timestamp: now } }));
        return new Response('<!doctype html>', { status: 200 }); // SPA fallback: not JSON
      }),
    );
    const p = await fetchEthUsd();
    expect(calls).toEqual(['https://gullychain.xyz/price/eth', REDSTONE_PRICE_URL]);
    expect(p).toMatchObject({ usd: 3100, source: 'RedStone API' });
  });

  it('stops at the Gully endpoint when it answers', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        return new Response(JSON.stringify({ symbol: 'ETH', usd: 2324.62, source: 'coingecko', ts: Math.floor(Date.now() / 1000) }));
      }),
    );
    expect(await fetchEthUsd()).toMatchObject({ usd: 2324.62, source: 'Gully price API' });
    expect(calls).toHaveLength(1);
  });
});
