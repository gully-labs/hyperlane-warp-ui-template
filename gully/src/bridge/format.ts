import { formatUnits, parseUnits } from 'viem';

export function fmtAmount(v: bigint, decimals = 18, max = 6): string {
  const s = formatUnits(v, decimals);
  const [i, f = ''] = s.split('.');
  const frac = f.slice(0, max).replace(/0+$/, '');
  return frac ? `${Number(i).toLocaleString('en-US')}.${frac}` : Number(i).toLocaleString('en-US');
}

export function parseAmount(input: string, decimals = 18): bigint | null {
  const t = input.trim();
  if (!/^\d*\.?\d*$/.test(t) || t === '' || t === '.') return null;
  try {
    return parseUnits(t, decimals);
  } catch {
    return null;
  }
}

export function short(a?: string, n = 4) {
  return a ? `${a.slice(0, 2 + n)}…${a.slice(-n)}` : '';
}

export function ago(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function duration(seconds: number) {
  if (seconds < 45) return `~${Math.max(1, Math.round(seconds))} s`;
  if (seconds < 5400) return `~${Math.max(1, Math.round(seconds / 60))} min`;
  return `~${(seconds / 3600).toFixed(seconds < 36000 ? 1 : 0)} h`;
}
