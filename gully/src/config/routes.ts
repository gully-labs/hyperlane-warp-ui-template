import type { Address } from 'viem';

import data from './routes.json';
import type { ChainKey } from './chains';
import type { MirrorMeta } from './mirrors';

export interface WarpToken {
  address: Address;
  standard: string;
  tokenType: 'native' | 'synthetic' | 'collateral' | string;
  symbol: string;
  name: string;
  decimals: number;
  collateralAddress: Address | null;
}

export interface FastRoute {
  id: string;
  symbol: string;
  tokens: Record<ChainKey, WarpToken>;
  /** retired route (gETH, hypETH): never offered for deposits, only to redeem a GullyChain balance back to ETH */
  legacy?: boolean;
  /** a Gully Warp Mirror route (a Gully Core coin and its mirror), loaded at startup from /mirrors.json (mirrors.ts) */
  mirror?: MirrorMeta;
}

/** the static ETH routes (routes.json); stats and the activity feed read only these */
export const FAST_ROUTES = data.routes as FastRoute[];
export const DEFAULT_FAST_ROUTE_ID = data.defaultRouteId;
/** retired routes whose GullyChain token can still be redeemed (synthetic or collateral tokens a wallet can hold) */
export const LEGACY_ROUTES = FAST_ROUTES.filter((r) => r.legacy && r.tokens.gullychaintestnet.tokenType !== 'native');

/** Gully Warp Mirror routes, filled once at startup (main.tsx -> setMirrorRoutes); empty when /mirrors.json is absent. */
export const MIRROR_ROUTES: FastRoute[] = [];
export function setMirrorRoutes(routes: FastRoute[]) {
  MIRROR_ROUTES.splice(0, MIRROR_ROUTES.length, ...routes.filter((r) => r.mirror));
}

/** A route for a transfer: deposits always use the default route; legacy routes are only valid to withdraw (redeem). */
export function routeFor(direction: 'deposit' | 'withdraw', id?: string): FastRoute {
  const r = fastRoute(id);
  return r.legacy && direction === 'deposit' ? fastRoute(DEFAULT_FAST_ROUTE_ID) : r;
}

export function fastRoute(id?: string): FastRoute {
  return (
    FAST_ROUTES.find((r) => r.id === id) ||
    MIRROR_ROUTES.find((r) => r.id === id) ||
    FAST_ROUTES.find((r) => r.id === DEFAULT_FAST_ROUTE_ID)!
  );
}
