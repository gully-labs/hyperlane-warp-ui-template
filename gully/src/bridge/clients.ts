import { createPublicClient, defineChain, http, type PublicClient } from 'viem';

import { CHAINS, type ChainKey } from '../config/chains';

export function viemChain(key: ChainKey) {
  const c = CHAINS[key];
  return defineChain({
    id: c.id,
    name: c.name,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [c.walletRpc] } },
    blockExplorers: { default: { name: 'Explorer', url: c.explorer } },
  });
}

const cache = new Map<ChainKey, PublicClient>();
export function pub(key: ChainKey): PublicClient {
  let c = cache.get(key);
  if (!c) {
    c = createPublicClient({
      chain: viemChain(key),
      transport: http(CHAINS[key].rpc, { batch: { wait: 16 }, retryCount: 2 }),
    }) as PublicClient;
    cache.set(key, c);
  }
  return c;
}
