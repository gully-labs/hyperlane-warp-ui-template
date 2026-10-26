// Production static build of the Gully Bridge (direction C) into a staging folder ready to copy to the box:
//   node scripts/build-staging.mjs [outDir]
// Default outDir: ./staging/testnet-bridge.gullychain.xyz  (deploy target: /srv/status/sites/testnet-bridge.gullychain.xyz)
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const out = resolve(process.argv[2] || 'staging/testnet-bridge.gullychain.xyz');
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', '.'], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'production'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DIRECTION: 'c',
    VITE_OUT_DIR: out,
    VITE_SITE_URL: 'https://testnet-bridge.gullychain.xyz/',
    VITE_GULLY_RPC: 'https://testnet-rpc.gullychain.xyz',
    VITE_ARB_RPC: 'https://sepolia-rollup.arbitrum.io/rpc',
    VITE_ROBOTS: 'index, follow',
  },
});
console.log(`staged: ${out}`);
