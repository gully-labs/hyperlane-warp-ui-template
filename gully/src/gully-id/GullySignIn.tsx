// "Sign in with Gully" for the bridge header. Off unless VITE_GULLY_ID_CLIENT_ID is set at build time.
// Identity only: it shows who you are (.gully name + avatar, rendered by the Gully ID SDK) and, when the profile has
// one, your Gully wallet address. It never connects that wallet; transfers use the Connect button as before.
import { useEffect, useRef } from 'react';

import { short } from '../bridge/format';
import { gullyIdConfig, profileWallet, walletKindLabel } from './gullyId';
import { useGullySession } from './useGullySession';
import './gully-id.css';

const CONFIG = gullyIdConfig(import.meta.env);

export function GullySignIn() {
  if (!CONFIG) return null;
  return <GullySignInInner />;
}

function GullySignInInner() {
  const { client, session } = useGullySession(CONFIG);
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!client || !el.current) return;
    try {
      return client.renderButton(el.current, {
        theme: 'dark',
        passkey: true,
        onError: (e) => console.warn('[gully-id] sign-in failed', e),
      });
    } catch (e) {
      console.warn('[gully-id] renderButton failed', e);
    }
  }, [client]);

  if (!client) return null;
  const w = profileWallet(session?.user);
  return (
    <span className="gully-id">
      {w && (
        <span className="gully-id-wallet mono" title={`Your Gully ID ${walletKindLabel(w.kind).toLowerCase()}: ${w.address}. Not connected; use Connect to bridge with any wallet.`}>
          {walletKindLabel(w.kind)} {short(w.address)}
        </span>
      )}
      <span className="gully-id-btn" ref={el} />
    </span>
  );
}
