// gc-nav React adapter: the SAME model as gc-nav.js turned into React elements (so the links, order and labels cannot differ
// from the static sites). No JSX, no React import: pass your React in. Usage:
//   import * as React from 'react'; import { createGcNav } from './vendor/gc-nav/gc-nav-react.js';
//   const { GcHeader, GcFooter } = createGcNav(React);
//   <GcHeader active="bridge" logo="/brand/logo/gc-icon.svg" menu={signInForPhones}>{signIn}{wallet}</GcHeader>
import { headerModel, footerModel, hydrate } from './gc-nav.js';

const RENAME = { class: 'className', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', tabindex: 'tabIndex', for: 'htmlFor' };
const props = (attrs) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [RENAME[k] || k, v]));

export function createGcNav(React) {
  const h = React.createElement;
  const build = (node, slot, menu, key) => {
    if (typeof node === 'string') return node;
    const [tag, attrs = {}, ...kids] = node;
    if (tag === 'slot') return attrs === 'menu' ? h('div', { className: 'gcn-mslot', key }, menu) : h('span', { className: 'gcn-slot', key }, slot);
    return h(tag, { ...props(attrs), key }, ...kids.map((k, n) => build(k, slot, menu, n)));
  };
  function GcHeader({ children, menu, ...opts }) {
    const ref = React.useRef(null);
    // before paint, so the fit step never moves header items after the first frame (CLS); useEffect when there is no DOM
    const useIso = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
    useIso(() => (ref.current ? hydrate(ref.current.parentNode || document) : undefined), []);
    const el = build(headerModel(opts), children, menu);
    return React.cloneElement(el, { ref });
  }
  function GcFooter(opts) {
    return build(footerModel(opts), null, null);
  }
  return { GcHeader, GcFooter };
}
