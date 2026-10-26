// Builds src/config/routes.json from a Hyperlane registry overlay (gully-ops l3/hyperlane/registry).
// Every deployments/warp_routes/<SYMBOL>/<chains>-config.yaml that connects arbitrumsepolia and gullychaintestnet
// becomes a Fast route. The default route is gETH ("Gully Bridged ETH") when its config exists, else the first one.
//   node scripts/sync-routes.mjs [registry-dir]
// Default registry dir: ../../gully-ops/l3/hyperlane/registry next to this repo, or GULLY_REGISTRY.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const reg = resolve(process.argv[2] || process.env.GULLY_REGISTRY || '../../gully-ops/l3/hyperlane/registry');
const dir = join(reg, 'deployments/warp_routes');
if (!existsSync(dir)) throw new Error(`no warp_routes in ${reg}`);
const CHAINS = ['arbitrumsepolia', 'gullychaintestnet'];
const PREFERRED = ['gETH'];
const routes = [];
for (const sym of readdirSync(dir)) {
  for (const f of readdirSync(join(dir, sym)).filter((f) => f.endsWith('-config.yaml'))) {
    const cfg = parse(readFileSync(join(dir, sym, f), 'utf8'));
    const tokens = Object.fromEntries((cfg.tokens || []).filter((t) => CHAINS.includes(t.chainName)).map((t) => [t.chainName, {
      address: t.addressOrDenom, standard: t.standard, tokenType: t.tokenType, symbol: t.symbol, name: t.name,
      decimals: t.decimals, collateralAddress: t.collateralAddressOrDenom || null,
    }]));
    if (!CHAINS.every((c) => tokens[c])) continue;
    routes.push({ id: `${sym}/${f.replace(/-config\.yaml$/, '')}`, symbol: sym, tokens });
  }
}
if (!routes.length) throw new Error('no arbitrumsepolia <-> gullychaintestnet warp route found');
const pref = (r) => (PREFERRED.includes(r.tokens.gullychaintestnet.symbol) ? 1 : 0);
routes.sort((a, b) => pref(b) - pref(a));
const out = { generatedFrom: 'gully-ops l3/hyperlane/registry/deployments/warp_routes', defaultRouteId: routes[0].id, routes };
writeFileSync(new URL('../src/config/routes.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`routes.json: ${routes.map((r) => r.id).join(', ')} (default ${out.defaultRouteId})`);
