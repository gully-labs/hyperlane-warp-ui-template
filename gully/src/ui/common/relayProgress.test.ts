import { describe, expect, it } from 'vitest';

import type { TransferRecord } from '../../bridge/types';
import { relayProgress } from './parts';

const base: TransferRecord = {
  id: '0x01',
  kind: 'fast',
  direction: 'deposit',
  from: 'arbitrumsepolia',
  to: 'gullychaintestnet',
  amount: '1000',
  sendSymbol: 'ETH',
  receiveSymbol: 'gETH',
  sender: '0x0000000000000000000000000000000000000001',
  recipient: '0x0000000000000000000000000000000000000001',
  originTx: `0x${'aa'.repeat(32)}`,
  messageId: `0x${'bb'.repeat(32)}`,
  createdAt: 0,
  updatedAt: 0,
  status: 'relaying',
  etaSeconds: 75,
};

describe('relay progress', () => {
  it('fast, in flight: origin confirmed (link), message id, relaying', () => {
    const p = relayProgress(base);
    expect(p.map((x) => [x.key, x.state])).toEqual([
      ['origin', 'done'],
      ['msg', 'done'],
      ['dest', 'active'],
    ]);
    expect(p[0].href).toMatch(/\/tx\/0xaaaa/);
    expect(p[1].text).toMatch(/^Message 0xbbbbbb/);
    expect(p[2].text).toBe('Relaying to GullyChain…');
    expect(p[2].href).toBeUndefined();
  });

  it('fast, delivered: the destination link points at the delivery tx on the destination explorer', () => {
    const destTx = `0x${'cc'.repeat(32)}` as const;
    const p = relayProgress({ ...base, status: 'delivered', destTx });
    const dest = p.find((x) => x.key === 'dest')!;
    expect(dest.state).toBe('done');
    expect(dest.text).toBe('Delivered on GullyChain');
    expect(dest.href).toMatch(new RegExp(`/tx/${destTx}$`));
    expect(dest.href).not.toBe(p[0].href);
  });

  it('delivered without a known delivery tx: still delivered, no link; failed: one error row', () => {
    expect(relayProgress({ ...base, status: 'delivered' }).find((x) => x.key === 'dest')!.href).toBeUndefined();
    const f = relayProgress({ ...base, status: 'failed' });
    expect(f).toHaveLength(1);
    expect(f[0].state).toBe('error');
  });
});
