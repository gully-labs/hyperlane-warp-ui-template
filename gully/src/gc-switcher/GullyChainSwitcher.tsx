// GullyChain product switcher for React apps: renders the <gc-switcher> custom element from gc-switcher.js.
// Canonical source: gully-labs/gully-ops sites/_shared/gc-switcher/ (spec in its README). Copy both files unchanged.
import { createElement } from 'react';
import './gc-switcher.js';

export type GullyChainProduct = 'app' | 'bridge' | 'explorer' | 'faucet' | 'safe' | 'verify' | 'sentry' | 'offers' | 'pay' | 'id' | 'docs' | 'dev' | 'status';

export function GullyChainSwitcher({ current, safeLive, className }: { current: GullyChainProduct; safeLive?: boolean; className?: string }) {
  return createElement('gc-switcher', { current, 'safe-live': safeLive ? '' : undefined, className });
}

export default GullyChainSwitcher;
