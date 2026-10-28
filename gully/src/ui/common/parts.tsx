import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { CHAINS, LINKS, txUrl, type ChainKey } from '../../config/chains';
import { ago, duration, fmtAmount, short } from '../../bridge/format';
import type { ActivityItem, StepDef, TransferRecord } from '../../bridge/types';
import { connect, disconnect, startDiscovery, type WalletInfo } from '../../bridge/wallet';
import type { BridgeState, StepState } from '../useBridge';
import { useWallet } from '../useBridge';
import { Icon, type IconName } from './icons';
import { Money, UsdLine } from './money';
import { ethN } from '../../bridge/usd';

/** Signature button: pill, left icon, sliding arrow, shine sweep, 0.98 pressed. */
export function Btn({
  variant = 'primary',
  icon,
  arrow = true,
  busy,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  arrow?: boolean;
  busy?: boolean;
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...rest}>
      {busy ? <Icon name="loader" className="spin" /> : icon && <Icon name={icon} />}
      <span>{children}</span>
      {arrow && <Icon name="arrowRight" className="btn-arrow" />}
    </button>
  );
}

/** Gully products are one family: links between them open in the same tab; only truly external links get a new tab. */
export const GULLY_HOST = /(^|\.)(gullychain|gullylabs|gullypay|gullyrpc|holdermaps|gullysecurity|gullystudio|gullyai)\.xyz$/;
export function isGully(href: string) {
  try {
    return GULLY_HOST.test(new URL(href).hostname);
  } catch {
    return true; // relative link
  }
}

// Gully hosts open in the same tab (product navigation), except with `newTab` (explorer tx links: a transfer in
// progress must stay on screen) and inside the embed, where a same-tab link would navigate the integrator's iframe.
export function Ext({ href, children, className, newTab }: { href: string; children: ReactNode; className?: string; newTab?: boolean }) {
  const embedded = typeof document !== 'undefined' && document.documentElement.classList.contains('is-embed');
  if (isGully(href) && !newTab && !embedded)
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function ChainMark({ chain, size = 28 }: { chain: ChainKey; size?: number }) {
  if (chain === 'gullychaintestnet')
    return (
      <img
        className="chain-mark"
        src="brand/icon/gullychain-icon-transparent-512.png"
        width={size}
        height={size}
        alt=""
      />
    );
  return (
    <span className="chain-mark chain-mark-arb" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      ARB
    </span>
  );
}

export function Sparkline({ values, w = 96, h = 28, label }: { values: number[]; w?: number; h?: number; label: string }) {
  const v = values.length > 1 ? values : [0, 0];
  const max = Math.max(1, ...v);
  const pts = v.map((y, i) => `${(i / (v.length - 1)) * w},${h - 2 - (y / max) * (h - 4)}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} className="spark-fill" />
      <polyline points={pts} className="spark-line" />
      <circle cx={w} cy={h - 2 - (v[v.length - 1] / max) * (h - 4)} r="2.5" className="spark-dot" />
    </svg>
  );
}

/** Stepper with live states. */
export function Stepper({ defs, state, compact }: { defs: StepDef[]; state: StepState; compact?: boolean }) {
  return (
    <ol className={`stepper ${compact ? 'stepper-compact' : ''}`} aria-label="Transfer steps">
      {defs.map((d, i) => {
        const s = state[d.id]?.state || 'idle';
        return (
          <li key={d.id} className={`step step-${s}`} aria-current={s === 'active' ? 'step' : undefined}>
            <span className="step-dot">
              {s === 'done' ? <Icon name="check" size={14} /> : s === 'error' ? <Icon name="x" size={14} /> : s === 'active' ? <Icon name="loader" size={14} className="spin" /> : i + 1}
            </span>
            <span className="step-txt">
              <b>{d.label}</b>
              <small>{state[d.id]?.message || d.hint}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Steps of a stored transfer derived from its status. */
export function recordSteps(t: TransferRecord): StepState {
  const done = { state: 'done' as const };
  const act = { state: 'active' as const };
  if (t.kind === 'fast')
    return {
      approve: done,
      send: { ...done, tx: t.originTx },
      relay: t.status === 'delivered' ? done : act,
      deliver: t.status === 'delivered' ? done : { state: 'idle' },
    };
  if (t.direction === 'deposit')
    return { send: done, relay: t.status === 'delivered' ? done : act, deliver: t.status === 'delivered' ? done : { state: 'idle' } };
  return {
    send: done,
    challenge: t.status === 'challenge' ? { state: 'active', message: 'Waiting for a confirmed rollup assertion' } : done,
    claim: t.status === 'claimed' ? done : t.status === 'claimable' ? { state: 'idle', message: 'Ready: sign the claim' } : { state: 'idle' },
  };
}

export function WalletButton({ compact }: { compact?: boolean }) {
  const w = useWallet();
  const [open, setOpen] = useState(false);
  useEffect(() => startDiscovery(), []);
  if (w.address)
    return (
      <button className="wallet-pill" onClick={() => disconnect()} title="Disconnect">
        <span className="wallet-dot" />
        {short(w.address)}
        {!compact && w.chainId && <small>{CHAINS[w.chainId === 485590 ? 'gullychaintestnet' : 'arbitrumsepolia']?.short}</small>}
      </button>
    );
  return (
    <>
      <Btn variant="secondary" icon="wallet" arrow={false} onClick={() => setOpen(true)} className="btn-sm">
        Connect
      </Btn>
      {open && <WalletModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function WalletModal({ onClose }: { onClose: () => void }) {
  const w = useWallet();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const pick = async (x: WalletInfo) => {
    try {
      await connect(x);
      onClose();
    } catch {
      /* error shown from store */
    }
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wm-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="wm-title">Connect a wallet</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {w.wallets.length ? (
          <ul className="wallet-list">
            {w.wallets.map((x) => (
              <li key={x.uuid}>
                <button onClick={() => pick(x)} disabled={w.connecting}>
                  {x.icon ? <img src={x.icon} width={28} height={28} alt="" /> : <Icon name="wallet" size={28} />}
                  <span>{x.name}</span>
                  <Icon name="arrowRight" className="btn-arrow" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <Icon name="wallet" size={28} />
            <p>No browser wallet found. Install a wallet extension such as MetaMask or Rabby, then reload.</p>
          </div>
        )}
        {w.error && <p className="err">{w.error}</p>}
        <p className="fine">GullyChain Testnet is added to your wallet automatically when you bridge.</p>
      </div>
    </div>
  );
}

export function AmountField({ b, big }: { b: BridgeState; big?: boolean }) {
  const sym = b.quote?.sendSymbol || (b.direction === 'withdraw' && b.kind === 'fast' ? b.route.tokens.gullychaintestnet.symbol : 'ETH');
  return (
    <div className={`amount ${big ? 'amount-big' : ''} ${amountSize(b.amountText)}`}>
      <label htmlFor="amount">You send</label>
      <div className="amount-row">
        <input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.0"
          value={b.amountText}
          onChange={(e) => b.setAmountText(e.target.value.replace(',', '.'))}
          aria-describedby="amount-bal"
        />
        <span className="token-chip">
          <ChainMark chain={b.from} size={20} />
          {sym}
        </span>
      </div>
      <div className="amount-meta" id="amount-bal">
        <UsdLine v={b.amount && b.amount > 0n ? b.amount : null} />
        {b.wallet.address && b.balanceFrom !== undefined ? (
          <>
            <span>
              Balance {ethN(Number(fmtAmount(b.balanceFrom, 18, 18).replaceAll(',', '')))} {sym}
            </span>
            <button className="link-btn" onClick={() => b.setAmountText(fmtAmount(b.balanceFrom!, 18, 18).replaceAll(',', ''))}>
              Max
            </button>
          </>
        ) : (
          <span className="amount-on">on {CHAINS[b.from].name}</span>
        )}
      </div>
    </div>
  );
}

export function RouteOptions({ b }: { b: BridgeState }) {
  const opts = (['fast', 'canonical'] as const).map((k) => {
    const q = b.quotes[k];
    const eta = q ? duration(q.etaSeconds) : k === 'fast' ? '~1 min' : b.direction === 'deposit' ? '~1 min' : '~45 min';
    return { k, q, eta };
  });
  return (
    <div className="routes" role="radiogroup" aria-label="Route">
      {opts.map(({ k, q, eta }) => {
        const selected = b.kind === k;
        const rec = b.pick.kind === k;
        const unavailable = q && !q.available;
        return (
          <button
            key={k}
            role="radio"
            aria-checked={selected}
            className={`route ${selected ? 'route-on' : ''} ${unavailable ? 'route-off' : ''}`}
            onClick={() => b.setKind(k === b.pick.kind ? undefined : k)}
          >
            <span className="route-ic">
              <Icon name={k === 'fast' ? 'zap' : 'shield'} />
            </span>
            <span className="route-main">
              <b>
                {k === 'fast' ? 'Fast' : 'Canonical'}
                {rec && <em className="badge-rec">Best</em>}
              </b>
              <small>
                {k === 'fast'
                  ? `Minutes both ways · receive ${q?.receiveSymbol || (b.direction === 'deposit' ? b.route.tokens.gullychaintestnet.symbol : 'ETH')}`
                  : b.direction === 'deposit'
                    ? 'Rollup bridge · native gas ETH'
                    : 'Rollup bridge · challenge period, then claim'}
              </small>
            </span>
            <span className="route-eta">
              <Icon name="clock" size={14} />
              {eta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function QuoteDetails({ b }: { b: BridgeState }) {
  const q = b.quote;
  if (b.quoteError) return <p className="err" role="alert">{b.quoteError}</p>;
  if (!q) return <div className="quote quote-loading" aria-busy="true"><span className="shimmer" /><span className="shimmer" /></div>;
  const amt = b.amount && b.amount > 0n;
  return (
    <dl className="quote">
      <div>
        <dt>You receive</dt>
        <dd>
          {amt ? <Money v={q.receive} symbol={q.receiveSymbol} inline /> : '–'} <small>on {CHAINS[q.to].short}</small>
        </dd>
      </div>
      {q.fees.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.amount === 0n ? 'Free' : <Money v={f.amount} symbol={f.symbol} inline />}</dd>
        </div>
      ))}
      <div>
        <dt>Time</dt>
        <dd>{duration(q.etaSeconds)}</dd>
      </div>
      {b.url.ref && (
        <div>
          <dt>Integrator</dt>
          <dd className="mono">{short(b.url.ref)}</dd>
        </div>
      )}
      {q.notes.map((n) => (
        <p key={n} className="note">
          <Icon name="info" size={14} />
          {n}
        </p>
      ))}
    </dl>
  );
}

export function ActionButton({ b }: { b: BridgeState }) {
  const [open, setOpen] = useState(false);
  if (!b.wallet.address)
    return (
      <>
        <Btn icon="wallet" className="btn-block" onClick={() => setOpen(true)}>
          Connect wallet
        </Btn>
        {open && <WalletModal onClose={() => setOpen(false)} />}
      </>
    );
  const wrongChain = b.wallet.chainId !== CHAINS[b.from].id;
  return (
    <Btn
      icon={b.kind === 'fast' ? 'zap' : 'shield'}
      className="btn-block"
      disabled={!!b.blocker || b.busy}
      busy={b.busy}
      onClick={b.send}
    >
      {b.busy ? 'Confirm in your wallet' : b.blocker || `${wrongChain ? `Switch to ${CHAINS[b.from].short} and ` : ''}${b.kind === 'fast' ? 'Bridge fast' : b.direction === 'deposit' ? 'Deposit' : 'Start withdrawal'}`}
    </Btn>
  );
}

export function ActivityList({ items, error, limit = 8, preview }: { items?: ActivityItem[]; error?: string; limit?: number; preview?: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);
  if (error && !items)
    return (
      <div className="empty">
        <Icon name="alert" size={24} />
        <p>Live transfers are unavailable: the chains did not answer. Retrying.</p>
      </div>
    );
  if (!items)
    return (
      <ul className="feed" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="feed-row">
            <span className="shimmer" />
          </li>
        ))}
      </ul>
    );
  if (!items.length)
    return (
      <div className="empty">
        <Icon name="activity" size={24} />
        <p>No transfers in the last two days yet. Be the first.</p>
      </div>
    );
  return (
    <ul className="feed">
      {items.slice(0, limit).map((i) => (
        <li key={i.key} className="feed-row feed-in">
          <span className={`feed-kind feed-${i.kind}`}>
            <Icon name={i.kind === 'fast' ? 'zap' : 'shield'} size={14} />
            {i.kind === 'fast' ? 'Fast' : 'Canonical'}
          </span>
          <span className="feed-dir">
            <ChainMark chain={i.direction === 'deposit' ? 'arbitrumsepolia' : 'gullychaintestnet'} size={16} />
            <Icon name="arrowRight" size={12} />
            <ChainMark chain={i.direction === 'deposit' ? 'gullychaintestnet' : 'arbitrumsepolia'} size={16} />
          </span>
          <span className="feed-amt">
            <Money v={i.amount} symbol={i.symbol} />
          </span>
          <span className="feed-time">{i.time ? ago(i.time) : ''}</span>
          {preview ? (
            <span className="feed-link" />
          ) : (
            <Ext href={txUrl(i.chain, i.tx)} className="feed-link" newTab>
              <Icon name="external" size={14} />
              <span className="sr">View transaction</span>
            </Ext>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MyTransfers({ b }: { b: BridgeState }) {
  const list = b.transfers.filter((t) => !b.wallet.address || t.sender.toLowerCase() === b.wallet.address.toLowerCase() || t.recipient.toLowerCase() === b.wallet.address.toLowerCase());
  if (!list.length) return null;
  return (
    <section className="mine" aria-label="Your transfers">
      <h3 className="label">Your transfers</h3>
      <ul>
        {list.slice(0, 5).map((t) => (
          <li key={t.id} className={`mine-row mine-${t.status}`}>
            <div className="mine-top">
              <span className={`feed-kind feed-${t.kind}`}>
                <Icon name={t.kind === 'fast' ? 'zap' : 'shield'} size={14} />
                {t.kind === 'fast' ? 'Fast' : 'Canonical'}
              </span>
              <b>
                <Money v={BigInt(t.amount)} symbol={t.sendSymbol} inline />
              </b>
              <span className="mine-status">{statusLabel(t)}</span>
              <Ext href={txUrl(t.from, t.originTx)} className="feed-link" newTab>
                <Icon name="external" size={14} />
                <span className="sr">View origin transaction</span>
              </Ext>
            </div>
            <Stepper defs={stepDefsOf(t)} state={recordSteps(t)} compact />
            <RelayProgress t={t} />
            {t.status === 'claimable' && (
              <Btn icon="key" onClick={() => b.claim(t)} busy={b.busy} disabled={b.busy} className="btn-sm">
                Claim on Arbitrum Sepolia
              </Btn>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Where a transfer is, with explorer links: origin tx confirmed -> (fast) Hyperlane message id, relaying -> delivered
 * on the destination (the delivery tx, found from the destination Mailbox by the message id). Pure on the record.
 */
export function relayProgress(t: TransferRecord): { key: string; text: string; href?: string; state: 'done' | 'active' | 'error' }[] {
  const from = CHAINS[t.from].short;
  const to = CHAINS[t.to].short;
  const out: { key: string; text: string; href?: string; state: 'done' | 'active' | 'error' }[] = [];
  if (t.status === 'failed') return [{ key: 'origin', text: `Reverted on ${from}`, href: txUrl(t.from, t.originTx), state: 'error' }];
  out.push({ key: 'origin', text: `Confirmed on ${from}`, href: txUrl(t.from, t.originTx), state: 'done' });
  if (t.kind === 'fast' && t.messageId) out.push({ key: 'msg', text: `Message ${short(t.messageId, 6)}`, state: 'done' });
  if (t.status === 'delivered') {
    out.push({ key: 'dest', text: `Delivered on ${to}`, href: t.destTx ? txUrl(t.to, t.destTx) : undefined, state: 'done' });
  } else if (t.status === 'relaying' || t.status === 'sent') {
    out.push({ key: 'dest', text: t.kind === 'fast' ? `Relaying to ${to}…` : `Waiting for ${to}…`, state: 'active' });
  }
  return out;
}

function RelayProgress({ t }: { t: TransferRecord }) {
  if (t.kind === 'canonical' && t.direction === 'withdraw') return null;
  const items = relayProgress(t);
  return (
    <ul className="mine-links" aria-live="polite" aria-label="Transfer progress">
      {items.map((i) => (
        <li key={i.key} className={`mine-link mine-link-${i.state}`}>
          <Icon name={i.state === 'done' ? 'check' : i.state === 'error' ? 'x' : 'loader'} size={12} className={i.state === 'active' ? 'spin' : undefined} />
          {i.href ? (
            <Ext href={i.href} newTab>
              {i.text}
              <Icon name="external" size={12} />
            </Ext>
          ) : (
            <span className={i.key === 'msg' ? 'mono' : undefined} title={i.key === 'msg' ? t.messageId : undefined}>
              {i.text}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function statusLabel(t: TransferRecord) {
  switch (t.status) {
    case 'relaying':
      return 'In flight';
    case 'delivered':
      return 'Delivered';
    case 'challenge':
      return `Challenge period · ${duration(t.etaSeconds)}`;
    case 'claimable':
      return 'Ready to claim';
    case 'claimed':
      return 'Claimed';
    case 'failed':
      return 'Failed';
    default:
      return 'Sent';
  }
}

function stepDefsOf(t: TransferRecord): StepDef[] {
  if (t.kind === 'fast')
    return [
      { id: 'send', label: 'Send', hint: CHAINS[t.from].short, chain: t.from, user: true },
      { id: 'relay', label: 'Relay', hint: 'Relayer delivering', chain: t.to, user: false },
      { id: 'deliver', label: 'Delivered', hint: CHAINS[t.to].short, chain: t.to, user: false },
    ];
  if (t.direction === 'deposit')
    return [
      { id: 'send', label: 'Send', hint: CHAINS[t.from].short, chain: t.from, user: true },
      { id: 'relay', label: 'Sequenced', hint: 'GullyChain reads it', chain: t.to, user: false },
      { id: 'deliver', label: 'Delivered', hint: CHAINS[t.to].short, chain: t.to, user: false },
    ];
  return [
    { id: 'send', label: 'Send', hint: CHAINS[t.from].short, chain: t.from, user: true },
    { id: 'challenge', label: 'Challenge', hint: duration(t.etaSeconds), chain: t.to, user: false },
    { id: 'claim', label: 'Claim', hint: CHAINS[t.to].short, chain: t.to, user: true },
  ];
}

export function Footer({ minimal }: { minimal?: boolean }) {
  return (
    <footer className="foot">
      <div className="foot-in">
        {!minimal && (
          <nav className="foot-links" aria-label="Footer">
            <Ext href={LINKS.chain}>GullyChain</Ext>
            <Ext href={LINKS.explorer}>Explorer</Ext>
            <Ext href={LINKS.faucet}>Faucet</Ext>
            <Ext href={LINKS.docs}>Docs</Ext>
            <Ext href={LINKS.telegram}>Telegram</Ext>
            <Ext href={LINKS.discord}>Discord</Ext>
            <Ext href={LINKS.x}>X</Ext>
          </nav>
        )}
        <div className="foot-badges">
          <Ext href={LINKS.gullyLabs} className="badge-link" newTab>
            <img
              src="brand/badges/powered-by-gully-labs-dark.svg"
              srcSet="brand/badges/powered-by-gully-labs-dark.png 1x, brand/badges/powered-by-gully-labs-dark-2x.png 2x, brand/badges/powered-by-gully-labs-dark-3x.png 3x"
              width={190}
              height={48}
              alt="Powered by Gully Labs"
            />
          </Ext>
          <p className="credit">
            Fast lane secured by <Ext href={LINKS.hyperlane}>Hyperlane</Ext>. Canonical lane: the GullyChain Arbitrum Nitro
            rollup bridge. Testnet: no real value.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Font step for the amount input: long numbers get smaller instead of overflowing the card. */
export function amountSize(text: string) {
  const n = text.length;
  return n > 16 ? 'amount-xs' : n > 12 ? 'amount-sm' : n > 9 ? 'amount-md' : '';
}
