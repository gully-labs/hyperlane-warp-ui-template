import * as React from 'react';
import { useEffect, useState } from 'react';

import { CHAINS, IS_TESTNET, type ChainKey } from '../../config/chains';
import { GullySignIn } from '../../gully-id/GullySignIn';
import type { BridgeState } from '../useBridge';
import { Icon } from './icons';
import { ChainMark, TestnetTag, WalletButton } from './parts';
import { addGullyChainUsdc, USDCE } from './addUsdc';
import { toast } from './toasts';
import { createGcNav } from '../../vendor/gc-nav/gc-nav-react.js';

// The one Gully Chain header and footer (gully-ops sites/_shared/gc-nav, vendored byte-identical in src/vendor/gc-nav;
// owner 2026-11-28: the same links in the same order on every Gully Chain surface). The bridge marks Bridge active and fills
// the action slot with Sign in with Gully ID and the wallet button; the theme button is the kit's (key gullychain-theme).
const { GcHeader, GcFooter } = createGcNav(React);
export const NAV_LOGO = '/brand/logo/gc-icon.svg';

export function Header() {
  return (
    <GcHeader active="bridge" logo={NAV_LOGO} live={IS_TESTNET} menu={<GullySignIn place="menu" />}>
      <GullySignIn />
      <WalletButton compact />
    </GcHeader>
  );
}

export function Footer() {
  return (
    <GcFooter
      logo={NAV_LOGO}
      coreBadge="/brand/badges/gully-core-powered-by-dark.svg"
      coreBadgeLight="/brand/badges/gully-core-powered-by-light-2x.png"
      labsBadge="/brand/gully-labs-badge/powered-by-gully-labs-dark-2x.png"
      labsBadgeLight="/brand/gully-labs-badge/powered-by-gully-labs-light-2x.png"
    />
  );
}

export function DirectionTabs({ b }: { b: BridgeState }) {
  return (
    <div className="tabs" role="tablist" aria-label="Direction">
      {(['deposit', 'withdraw'] as const).map((d) => (
        <button key={d} role="tab" aria-selected={b.direction === d} className={`tab ${b.direction === d ? 'tab-on' : ''}`} onClick={() => b.setDirection(d)}>
          <Icon name={d === 'deposit' ? 'arrowDown' : 'send'} size={16} />
          {d === 'deposit' ? 'To Gully Chain' : 'To Arbitrum'}
        </button>
      ))}
    </div>
  );
}

export function ChainPair({ b }: { b: BridgeState }) {
  return (
    <div className="pair">
      <ChainBox chain={b.from} label="From" />
      <button className="flip" aria-label="Switch direction" onClick={b.flip}>
        <Icon name="swap" size={18} />
      </button>
      <ChainBox chain={b.to} label="To" />
    </div>
  );
}

function ChainBox({ chain, label }: { chain: ChainKey; label: string }) {
  return (
    <div className="chain-box">
      <small>{label}</small>
      <span>
        <ChainMark chain={chain} size={24} />
        {CHAINS[chain].short}
        <TestnetTag />
      </span>
    </div>
  );
}

/** count-up number for stat tiles */
export function CountUp({ value }: { value?: number }) {
  const [shown, setShown] = useState(value ?? 0);
  useEffect(() => {
    if (value === undefined) return;
    const start = shown;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      setShown(Math.round(start + (value - start) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{value === undefined ? '–' : shown.toLocaleString('en-US')}</>;
}

// Add Gully Chain + USDC.e to a browser wallet in one click; the address stays as a small fallback (copy).
export function AddUsdcRow() {
  const [busy, setBusy] = useState(false);
  // USDC.e is the testnet token (485590); the mainnet build shows no add-token row until mainnet USDC exists
  if (!IS_TESTNET) return null;
  const go = () => {
    setBusy(true);
    void addGullyChainUsdc((window as unknown as { ethereum?: Parameters<typeof addGullyChainUsdc>[0] }).ethereum, (kind, title, body) => toast({ kind: kind === 'ok' ? 'success' : 'error', title, body })).finally(() => setBusy(false));
  };
  return (
    <p className="add-usdc">
      <button type="button" className="add-usdc-b" disabled={busy} onClick={go}>
        <Icon name="wallet" size={16} />
        Add Gully Chain + USDC.e
      </button>
      <button type="button" className="add-usdc-c" onClick={() => { void navigator.clipboard?.writeText(USDCE).then(() => toast({ kind: 'success', title: 'USDC.e address copied', body: USDCE })); }}>
        Copy address
      </button>
    </p>
  );
}
