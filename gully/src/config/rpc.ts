/**
 * GullyChain Testnet (485590) public RPCs, in fallback order (shared Gully RPC fallback contract, 2026-10-26):
 * 1. same-origin `/rpc`, only in the browser on a gullychain.xyz host (avoids ISP filtering of "testnet-" hostnames)
 * 2. rpc.gullychain.xyz (gully-l3 eRPC, canonical)
 * 3. rpc.gullyrpc.xyz keyless Gully RPC project (gully box, a different server)
 * 4. rpc2.gullychain.xyz (gully-l3, direct to the nodes)
 * 5. testnet-rpc.gullychain.xyz (legacy, filtered on some ISPs)
 */
export const GULLY_PUBLIC_RPCS = [
  'https://rpc.gullychain.xyz',
  'https://rpc.gullyrpc.xyz/gullychain/evm/485590',
  'https://rpc2.gullychain.xyz',
  'https://testnet-rpc.gullychain.xyz',
] as const;

/**
 * rpcUrls handed to wallets (wallet_addEthereumChain): MetaMask uses rpcUrls[0], so the canonical URL goes first.
 * TODO: add https://rpc2.gullychain.xyz once its DNS record exists.
 */
export const GULLY_WALLET_RPCS = [
  'https://rpc.gullychain.xyz',
  'https://rpc.gullyrpc.xyz/gullychain/evm/485590',
  'https://testnet-rpc.gullychain.xyz',
] as const;

/** Fallback for the ETH/USD endpoint when the page is not served from a gullychain.xyz host. */
export const GULLY_PRICE_ORIGIN = 'https://gullychain.xyz';

interface Loc {
  origin: string;
  hostname: string;
}

const browserLoc = (): Loc | undefined => (typeof location !== 'undefined' ? location : undefined);

export const isGullyHost = (hostname: string) => hostname === 'gullychain.xyz' || hostname.endsWith('.gullychain.xyz');

/**
 * Ordered RPC list for app reads: env entries first (comma-separated; relative paths such as a dev proxy become
 * absolute), then same-origin /rpc on a gullychain.xyz host, then the public list. Duplicates are dropped.
 */
export function gullyRpcList(envValue?: string, loc: Loc | undefined = browserLoc()): string[] {
  const abs = (u: string) => (u.startsWith('/') && loc ? `${loc.origin}${u}` : u);
  const fromEnv = (envValue || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
    .map(abs)
    .filter((u) => /^https?:\/\//.test(u));
  const sameOrigin = loc && isGullyHost(loc.hostname) ? [`${loc.origin}/rpc`] : [];
  return [...new Set([...fromEnv, ...sameOrigin, ...GULLY_PUBLIC_RPCS])];
}

/** ETH/USD endpoint: same-origin on a gullychain.xyz host, else gullychain.xyz. */
export function gullyPriceUrl(loc: Loc | undefined = browserLoc()): string {
  const origin = loc && isGullyHost(loc.hostname) ? loc.origin : GULLY_PRICE_ORIGIN;
  return `${origin}/price/eth`;
}
