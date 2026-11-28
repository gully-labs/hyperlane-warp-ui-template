// gc-nav: THE Gully Chain navigation, one source (owner 2026-11-28: "all Gully Chain navigation links need to be the same
// across everything on Gully Chain, including app, docs, all"). Every Gully Chain surface (gullychain.xyz, the Portal, docs,
// developer hub, explorer, bridge, faucet, stats/status pages, verify) renders its header and footer from this file and only
// marks its own item active. Edit here, bump package.json + VERSION, re-vendor byte-identical (gully-ops stack/registry/kits.json).
// Rules kept: top nav = Build, Ecosystem, Docs, Bridge, Explorer, Community (owner 2026-10-29); Gully Chain menus list only
// Gully Chain products (Sign in with Gully ID and the app entry are features); "Gully Chain" is two words; the header action
// "Start building" goes to the developer portal quickstart (gc-chrome.json); social links live in the footer (no top X bar).
// Community items = sites/_shared/community.json (the official channel list), same order.
export const VERSION = '1.0.3';

export const URLS = {
  home: 'https://gullychain.xyz/',
  app: 'https://app.gullychain.xyz/',
  dev: 'https://dev.gullychain.xyz/',
  quickstart: 'https://dev.gullychain.xyz/quickstart/',
  docs: 'https://docs.gullychain.xyz/',
  bridge: 'https://testnet-bridge.gullychain.xyz/',
  explorer: 'https://testnet.gullyscan.xyz/',
  faucet: 'https://faucet.gullychain.xyz/',
  ecosystem: 'https://gullychain.xyz/ecosystem/',
  community: 'https://docs.gullychain.xyz/community/',
};

/** Top nav, in this order. id = the key a surface passes as `active`. */
export const TOP = [
  { id: 'build', label: 'Build', href: URLS.dev, icon: 'hammer', menu: 'build' },
  { id: 'ecosystem', label: 'Ecosystem', href: URLS.ecosystem, icon: 'compass' },
  { id: 'docs', label: 'Docs', href: URLS.docs, icon: 'book' },
  { id: 'bridge', label: 'Bridge', href: URLS.bridge, icon: 'bridge' },
  { id: 'explorer', label: 'Explorer', href: URLS.explorer, icon: 'blocks' },
  { id: 'community', label: 'Community', href: URLS.community, icon: 'users', menu: 'community' },
];

export const MENUS = {
  build: [
    { label: 'Developer portal', href: URLS.dev, icon: 'code', desc: 'Quickstart, starter kit, grants' },
    { label: 'Gully Chain Portal', href: URLS.app, icon: 'grid', desc: 'Your account, wallet, apps and rewards' },
    { label: 'Quickstart', href: 'https://docs.gullychain.xyz/quickstart/', icon: 'bolt', desc: 'First contract in five steps' },
    { label: 'Gully Core', href: 'https://gullychain.xyz/gully-core/', icon: 'layers', desc: 'Launchpad, DEX, stock markets, vaults' },
    { label: 'Faucet', href: URLS.faucet, icon: 'drop', desc: 'Free testnet ETH' },
    { label: 'Offers', href: 'https://offers.kre8.fun/', icon: 'gift', desc: 'Reward users, paid per completion' },
    { label: 'Gully Multisig', href: 'https://gullymultisig.xyz/', icon: 'lock', desc: 'Multisig smart accounts' },
    { label: 'RPC & API', href: 'https://docs.gullychain.xyz/rpc-api/', icon: 'key', desc: 'Endpoints, limits, indexer' },
    { label: 'Chain API', href: 'https://docs.gullychain.xyz/chain-api/', icon: 'link', desc: 'Etherscan-style API with your RPC key' },
    { label: 'Developer hub', href: 'https://docs.gullychain.xyz/developers/', icon: 'book', desc: 'Reference for every public API' },
    { label: 'Verify a contract', href: 'https://docs.gullychain.xyz/verify/', icon: 'shield', desc: 'Source on Sourcify' },
    { label: 'Run a Sentry', href: 'https://sentry.gullychain.xyz/', icon: 'key', desc: 'Free keys, watch the chain' },
    { label: 'Status', href: 'https://status.gullylabs.xyz/', icon: 'chart', desc: 'Uptime of every service' },
  ],
  community: [
    { label: 'Gully Chain News', href: 'https://t.me/GullyChain', icon: 'chat', desc: 'Official announcements' },
    { label: 'Gully Chain Deploys', href: 'https://t.me/GullyChainDeploys', icon: 'bolt', desc: 'Every new token and contract' },
    { label: 'Gully Trending', href: 'https://t.me/GullyTrending', icon: 'chart', desc: 'What is moving right now' },
    { label: 'Gully Chain Bot', href: 'https://t.me/GullyChainBot', icon: 'swap', desc: 'Trade from Telegram (testnet)' },
    { label: 'Gully Quest Bot', href: 'https://t.me/GullyQuestBot', icon: 'star', desc: 'Track and claim quests' },
    { label: 'Gully Buy Bot', href: 'https://t.me/GullyBuyBot', icon: 'bolt', desc: 'Buys of your token in your group' },
    { label: 'Discord', href: 'https://discord.com/invite/tY2ErsNNBp', icon: 'users', desc: 'Chat with the team and builders' },
    { label: 'X (@Gully_Labs)', href: 'https://x.com/Gully_Labs', icon: 'xlogo', desc: 'Launches and live updates' },
  ],
};

/** Header actions on the right, in this order. Sign in with Gully ID, the wallet and the theme button are slots a surface
 *  fills (features), between "Start building" and the menu button. */
export const ACTIONS = [
  { id: 'app', label: 'Open the app', href: URLS.app, icon: 'grid' },
  { id: 'start', label: 'Start building', href: URLS.quickstart, icon: 'code', primary: true },
];

export const FOOTER = {
  blurb: 'The Arbitrum Orbit L3 for creators and culture. Testnet, chain ID 485590. Testnet tokens have no real-world value.',
  columns: [
    { title: 'Build', links: [
      { label: 'Docs', href: URLS.docs, icon: 'book' },
      { label: 'Quickstart', href: URLS.quickstart, icon: 'bolt' },
      { label: 'Faucet', href: URLS.faucet, icon: 'drop' },
      { label: 'RPC & Chain API', href: 'https://docs.gullychain.xyz/chain-api/', icon: 'key' },
      { label: 'Developer hub', href: 'https://docs.gullychain.xyz/developers/', icon: 'code' },
      { label: 'Verify a contract', href: 'https://verify.gullychain.xyz/', icon: 'shield' },
      { label: 'Gully Core', href: 'https://gullychain.xyz/gully-core/', icon: 'layers' },
      { label: 'Gully Multisig', href: 'https://gullymultisig.xyz/', icon: 'lock' },
      { label: 'Offers', href: 'https://offers.kre8.fun/', icon: 'gift' },
    ] },
    { title: 'Network', links: [
      { label: 'Open the app', href: URLS.app, icon: 'grid' },
      { label: 'Ecosystem', href: URLS.ecosystem, icon: 'compass' },
      { label: 'Bridge', href: URLS.bridge, icon: 'bridge' },
      { label: 'Explorer', href: URLS.explorer, icon: 'blocks' },
      { label: 'Gully Core app', href: 'https://gullychain.xyz/core/', icon: 'swap' },
      { label: 'Gully ID', href: 'https://gullyid.xyz/', icon: 'user' },
      { label: 'Live stats', href: 'https://gullychain.xyz/stats/', icon: 'chart' },
      { label: 'Testnet', href: 'https://gullychain.xyz/testnet/', icon: 'cpu' },
      { label: 'Status', href: 'https://status.gullylabs.xyz/', icon: 'clock' },
    ] },
    { title: 'Community', links: [
      { label: 'Gully Chain News', href: 'https://t.me/GullyChain', icon: 'chat' },
      { label: 'Deploys', href: 'https://t.me/GullyChainDeploys', icon: 'bolt' },
      { label: 'Discord', href: 'https://discord.com/invite/tY2ErsNNBp', icon: 'users' },
      { label: 'X (@Gully_Labs)', href: 'https://x.com/Gully_Labs', icon: 'xlogo' },
      { label: 'Press', href: 'https://gullychain.xyz/press/', icon: 'star' },
    ] },
  ],
  legal: [
    { label: 'Terms', href: 'https://gullychain.xyz/terms/', icon: 'book' },
    { label: 'Privacy', href: 'https://gullychain.xyz/privacy/', icon: 'lock' },
  ],
  copy: '© 2026 Gully Labs',
  note: 'Testnet · no real value',
};
