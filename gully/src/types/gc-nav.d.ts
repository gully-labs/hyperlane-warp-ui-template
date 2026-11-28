// Types for the vendored gc-nav kit (plain JS, byte-identical copy of gully-ops sites/_shared/gc-nav).
declare module '*/vendor/gc-nav/gc-nav-react.js' {
  import type { ComponentType, ReactNode } from 'react';
  type HeaderProps = { active?: string | null; logo?: string; live?: boolean; app?: boolean; theme?: boolean; menu?: ReactNode; children?: ReactNode };
  type FooterProps = { logo?: string; labsBadge?: string; labsBadgeLight?: string; coreBadge?: string; coreBadgeLight?: string };
  export function createGcNav(react: unknown): { GcHeader: ComponentType<HeaderProps>; GcFooter: ComponentType<FooterProps> };
}
declare module '*/vendor/gc-nav/gc-nav.js' {
  export const VERSION: string;
  export function auditNav(html: string, opts?: { header?: boolean; footer?: boolean; app?: boolean }): string[];
  export function linksIn(html: string, part: 'header' | 'footer'): { href: string; text: string }[] | null;
  export function setBlock(n: number | bigint | null | undefined): void;
  export function setTheme(pref: 'dark' | 'light' | 'system'): void;
  export function hydrate(root?: ParentNode): () => void;
}
