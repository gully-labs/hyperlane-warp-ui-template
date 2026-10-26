import { useEffect, useState } from 'react';

import { CHAINS, LINKS, type ChainKey } from '../../config/chains';
import type { BridgeState } from '../useBridge';
import { Icon, type IconName } from './icons';
import { ChainMark, Ext, WalletButton } from './parts';

const NAV: { label: string; icon: IconName; href: string; ext?: boolean }[] = [
  { label: 'Bridge', icon: 'bridge', href: '#bridge' },
  { label: 'Activity', icon: 'activity', href: '#activity' },
  { label: 'Explorer', icon: 'search', href: LINKS.explorer, ext: true },
  { label: 'Faucet', icon: 'droplet', href: LINKS.faucet, ext: true },
  { label: 'Docs', icon: 'book', href: LINKS.docs, ext: true },
];

export function Header({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`top ${className}`}>
      <div className="top-in">
        <a className="brand" href="./" aria-label="Gully Bridge home">
          <img src="brand/logo/gullychain-logo-transparent.png" width={1315} height={305} alt="GullyChain" />
          <span className="brand-sub">Bridge</span>
        </a>
        <nav className={`nav ${open ? 'nav-open' : ''}`} aria-label="Main">
          {NAV.map((n) =>
            n.ext ? (
              <Ext key={n.label} href={n.href} className="nav-l">
                <Icon name={n.icon} />
                {n.label}
              </Ext>
            ) : (
              <a key={n.label} href={n.href} className={`nav-l ${n.label === 'Bridge' ? 'nav-on' : ''}`} onClick={() => setOpen(false)}>
                <Icon name={n.icon} />
                {n.label}
              </a>
            ),
          )}
        </nav>
        <div className="top-act">
          <span className="net-pill">
            <span className="live-dot" />
            Testnet
          </span>
          <WalletButton compact />
          <button className="icon-btn menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function DirectionTabs({ b }: { b: BridgeState }) {
  return (
    <div className="tabs" role="tablist" aria-label="Direction">
      {(['deposit', 'withdraw'] as const).map((d) => (
        <button key={d} role="tab" aria-selected={b.direction === d} className={`tab ${b.direction === d ? 'tab-on' : ''}`} onClick={() => b.setDirection(d)}>
          <Icon name={d === 'deposit' ? 'arrowDown' : 'send'} size={16} />
          {d === 'deposit' ? 'To GullyChain' : 'To Arbitrum'}
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
