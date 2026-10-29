// Vendors Gully Chain Night (GN), the shared black design, from gully-labs/gully-ops byte for byte. Never edit the
// vendored files here: change them in gully-ops sites/_shared/gullychain-night (README.md there) and re-run this.
//   node scripts/sync-gullychain-night.mjs [<gully-ops checkout> [<commit-ish>]]
//   defaults: ../../gully-ops (sibling checkout) and origin/feat/gullychain-builder-site
// Writes src/styles/night/{tokens.css,components.css,charts.js}, public/assets/fonts/{exo2-600.woff2,exo2-800.woff2,OFL.txt}
// (tokens.css loads /assets/fonts/exo2-*.woff2) and src/styles/night/night.lock.json (source commit + SHA-256 of each
// file), which tests/night.test.ts re-checks.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ops = resolve(process.argv[2] || join(app, '..', '..', 'gully-ops'));
const ref = process.argv[3] || 'origin/feat/gullychain-builder-site';
const git = (...a) => execFileSync('git', ['-C', ops, ...a], { maxBuffer: 64 << 20 });
const commit = git('rev-parse', `${ref}^{commit}`).toString().trim();

export const NIGHT_FILES = [
  ['sites/_shared/gullychain-night/tokens.css', 'src/styles/night/tokens.css'],
  ['sites/_shared/gullychain-night/components.css', 'src/styles/night/components.css'],
  ['sites/_shared/gullychain-night/charts.js', 'src/styles/night/charts.js'],
  ['sites/_shared/brand/fonts/exo2-600.woff2', 'public/assets/fonts/exo2-600.woff2'],
  ['sites/_shared/brand/fonts/exo2-800.woff2', 'public/assets/fonts/exo2-800.woff2'],
  ['sites/_shared/brand/fonts/OFL.txt', 'public/assets/fonts/OFL.txt'],
];

const files = {};
for (const [src, dst] of NIGHT_FILES) {
  const buf = git('show', `${commit}:${src}`);
  mkdirSync(dirname(join(app, dst)), { recursive: true });
  writeFileSync(join(app, dst), buf);
  files[dst] = { source: src, sha256: createHash('sha256').update(buf).digest('hex') };
}
writeFileSync(
  join(app, 'src/styles/night/night.lock.json'),
  JSON.stringify({ repo: 'gully-labs/gully-ops', ref, commit, files }, null, 2) + '\n',
);
console.log(`Gully Chain Night vendored from gully-ops ${commit.slice(0, 8)} (${ref}): ${NIGHT_FILES.length} files`);
