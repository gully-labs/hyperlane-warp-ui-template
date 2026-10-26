import { describe, expect, it } from 'vitest';

import { ethN, fmtUsd, parseCoingecko, parseRedstone, toUsd } from './usd';

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
    expect(parseCoingecko({ ethereum: { usd: 2999.5, last_updated_at: Math.floor(now / 1000) } }, now)?.usd).toBe(2999.5);
    expect(parseCoingecko({}, now)).toBeNull();
    expect(toUsd(1, null)).toBeNull();
    expect(toUsd(0.5, { usd: 3000, at: now, source: 'CoinGecko' })).toBe(1500);
  });
});
