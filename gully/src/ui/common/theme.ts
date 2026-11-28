// Light / Dark / System (owner rule: one design standard). Dark is the default. public/theme-boot.js applies the choice before
// first paint (data-theme = the theme shown, data-pref = the choice); this store keeps the two attributes, the saved choice
// and the header button in step, and follows the device while the choice is System.
import { useSyncExternalStore } from 'react';

export type ThemePref = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';
export const THEME_KEY = 'gullychain-theme';
/** the order of the header button, the one gullychain.xyz uses */
export const NEXT: Record<ThemePref, ThemePref> = { dark: 'light', light: 'system', system: 'dark' };
export const LABEL: Record<ThemePref, string> = { dark: 'Dark', light: 'Light', system: 'System' };
/** page ground per theme, for <meta name="theme-color"> (the --gn-bg values) */
export const GROUND: Record<Theme, string> = { dark: '#0A0F0E', light: '#F3F6F5' };

export const asPref = (v: unknown): ThemePref => (v === 'light' || v === 'system' ? v : 'dark');
export const resolve = (pref: ThemePref, deviceLight: boolean): Theme => (pref === 'system' ? (deviceLight ? 'light' : 'dark') : pref);

const hasDom = typeof document !== 'undefined';
const media = hasDom && typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
let pref: ThemePref = hasDom ? asPref(document.documentElement.getAttribute('data-pref')) : 'dark';
const subs = new Set<() => void>();

function apply() {
  if (!hasDom) return;
  const d = document.documentElement;
  const t = resolve(pref, !!media?.matches);
  d.setAttribute('data-theme', t);
  d.setAttribute('data-pref', pref);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', GROUND[t]);
  subs.forEach((f) => f());
}
media?.addEventListener?.('change', () => pref === 'system' && apply());

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode: the choice lasts for this page */
  }
  apply();
}
export const getThemePref = () => pref;
export const getTheme = (): Theme => resolve(pref, !!media?.matches);

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};
/** [choice, theme shown]; the prerendered page is Dark, so the server snapshot is Dark and the button corrects itself after hydration */
export function useTheme(): [ThemePref, Theme] {
  const p = useSyncExternalStore(subscribe, getThemePref, () => 'dark' as ThemePref);
  const t = useSyncExternalStore(subscribe, getTheme, () => 'dark' as Theme);
  return [p, t];
}
