// GullyChain product switcher for React apps: renders the <gc-switcher> custom element from gc-switcher.js.
// Canonical source: gully-labs/gully-ops sites/_shared/gc-switcher/ (spec in its README). Copy both files unchanged.
import { createElement } from 'react';
import './gc-switcher.js';

export type GullyChainProduct = 'app' | 'bridge' | 'explorer' | 'faucet' | 'safe' | 'verify' | 'sentry' | 'offers' | 'pay' | 'id' | 'docs' | 'dev' | 'status';

/** logo="off": only the product-name trigger, for headers that already show the brand-kit logo. */
export function GullyChainSwitcher({ current, safeLive, theme, logo, className }: { current: GullyChainProduct; safeLive?: boolean; theme?: 'light' | 'dark'; logo?: 'on' | 'off'; className?: string }) {
  return createElement('gc-switcher', { current, 'safe-live': safeLive ? '' : undefined, theme, logo, className });
}

export default GullyChainSwitcher;
