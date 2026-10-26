import type { Direction, RouteKind } from './types';

export interface RouteContext {
  direction: Direction;
  amount: bigint | null;
  /** balance of the fast-route token on GullyChain (gETH / hypETH); undefined when no wallet */
  fastTokenBalance?: bigint;
  /** native ETH the user holds on GullyChain */
  childEthBalance?: bigint;
  fastAvailable: boolean;
  /** max the fast route can deliver (native destination routers pay out what they hold); undefined = unlimited */
  fastLiquidity?: bigint;
}

export interface RoutePick {
  kind: RouteKind;
  reason: string;
}

/**
 * Picks the recommended lane. Pure: unit-tested in selectRoute.test.ts.
 * - Fast is preferred whenever it can carry the amount: minutes in both directions.
 * - Deposits fall back to Canonical when the fast destination lacks liquidity.
 * - Withdrawals use Fast when the user holds enough of the fast token; ETH held as gas on GullyChain can only
 *   leave through the Canonical lane (challenge period, then a claim on Arbitrum Sepolia).
 */
export function pickRoute(c: RouteContext): RoutePick {
  if (!c.fastAvailable) return { kind: 'canonical', reason: 'Fast lane unavailable right now' };
  const amt = c.amount ?? 0n;
  if (c.fastLiquidity !== undefined && amt > c.fastLiquidity)
    return { kind: 'canonical', reason: 'Amount exceeds Fast lane liquidity' };
  if (c.direction === 'deposit') return { kind: 'fast', reason: 'Arrives in about a minute' };
  if (c.fastTokenBalance === undefined) return { kind: 'fast', reason: 'Exits in minutes' };
  if (amt > 0n && c.fastTokenBalance >= amt) return { kind: 'fast', reason: 'Exits in minutes' };
  if (amt > 0n && (c.childEthBalance ?? 0n) >= amt)
    return { kind: 'canonical', reason: 'Your GullyChain ETH exits through the canonical bridge' };
  return c.fastTokenBalance > 0n
    ? { kind: 'fast', reason: 'Exits in minutes' }
    : { kind: 'canonical', reason: 'Your GullyChain ETH exits through the canonical bridge' };
}
