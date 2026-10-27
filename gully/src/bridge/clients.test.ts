import { describe, expect, it } from 'vitest';

import { GULLY_PUBLIC_RPCS } from '../config/rpc';
import { pub, viemChain } from './clients';

describe('GullyChain viem client', () => {
  it('reads through a fallback transport over every public RPC, in order, without ranking', () => {
    const client = pub('gullychaintestnet');
    const t = client.transport as unknown as { type: string; transports: { value?: { url?: string } }[] };
    expect(t.type).toBe('fallback');
    expect(t.transports.map((x) => x.value?.url)).toEqual([...GULLY_PUBLIC_RPCS]);
    expect(viemChain('gullychaintestnet').rpcUrls.default.http).toEqual([...GULLY_PUBLIC_RPCS]);
  });
});
