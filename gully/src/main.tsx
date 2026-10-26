import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppA } from './ui/a/AppA';
import { AppB } from './ui/b/AppB';
import { AppC } from './ui/c/AppC';
import { Toaster } from './ui/common/toasts';
import { readUrl } from './ui/useBridge';
import './styles/base.css';
import './styles/a.css';
import './styles/b.css';
import './styles/c.css';

// Integrator seam: when @gullylabs/bridge-sdk ships, register it here with setBridgeClient() (src/bridge/bridgeClient.ts).

const direction = (new URLSearchParams(location.search).get('design') || import.meta.env.VITE_DIRECTION || 'c').toLowerCase();
const url = readUrl();
if (url.embed) {
  document.documentElement.classList.add('is-embed');
  window.parent?.postMessage({ type: 'gully-bridge', event: { type: 'ready', payload: { timestamp: Date.now() } } }, '*');
}
if (url.preview) document.documentElement.classList.add('is-preview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {direction === 'a' ? <AppA url={url} /> : direction === 'b' ? <AppB url={url} /> : <AppC url={url} />}
    <Toaster />
  </StrictMode>,
);
