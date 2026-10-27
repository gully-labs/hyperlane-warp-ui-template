import { useEffect, useState } from 'react';

import { getGullyClient, type GullyClient, type GullyIdConfig, type GullySession } from './gullyId';

/** Loads the Gully ID SDK when `cfg` is set and tracks its session. `client` stays null while loading or on failure. */
export function useGullySession(cfg: GullyIdConfig | null) {
  const [client, setClient] = useState<GullyClient | null>(null);
  const [session, setSession] = useState<GullySession | null>(null);

  useEffect(() => {
    if (!cfg) return;
    let alive = true;
    let off: (() => void) | undefined;
    getGullyClient(cfg).then((c) => {
      if (!alive || !c) return;
      setClient(c);
      try {
        setSession(c.session());
        off = c.onChange((s) => alive && setSession(s));
      } catch (e) {
        console.warn('[gully-id] session read failed', e);
      }
    });
    return () => {
      alive = false;
      off?.();
    };
  }, [cfg?.clientId, cfg?.issuer]);

  return { client, session };
}
