import type { Address } from 'viem';

import data from './routes.json';
import type { ChainKey } from './chains';

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
}

export const FAST_ROUTES = data.routes as FastRoute[];
export const DEFAULT_FAST_ROUTE_ID = data.defaultRouteId;

export function fastRoute(id?: string): FastRoute {
  return FAST_ROUTES.find((r) => r.id === id) || FAST_ROUTES.find((r) => r.id === DEFAULT_FAST_ROUTE_ID)!;
}
