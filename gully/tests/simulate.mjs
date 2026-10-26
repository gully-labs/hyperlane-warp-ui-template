// Simulates every transfer the app can send, against the live contracts, from a fresh throwaway address whose
// balances are set with an eth_call state override (no key, no funds, nothing broadcast).
//   GULLY_RPC=http://127.0.0.1:18545/public/evm/485590 node tests/simulate.mjs
import { readFileSync } from 'node:fs';
import { createPublicClient, encodeFunctionData, http, pad, parseAbi, parseEther, toHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const routes = JSON.parse(readFileSync(new URL('../src/config/routes.json', import.meta.url))).routes;
const arb = createPublicClient({ transport: http(process.env.ARB_RPC || 'https://sepolia-rollup.arbitrum.io/rpc') });
const gully = createPublicClient({ transport: http(process.env.GULLY_RPC || 'https://testnet-rpc.gullychain.xyz') });
const me = privateKeyToAccount(generatePrivateKey()).address; // throwaway, never funded
const amount = parseEther('0.0002');
const abi = parseAbi([
  'function quoteTransferRemote(uint32,bytes32,uint256) view returns ((address token,uint256 amount)[])',
  'function transferRemote(uint32,bytes32,uint256) payable returns (bytes32)',
  'function depositEth() payable returns (uint256)',
  'function withdrawEth(address) payable returns (uint256)',
]);
const ZERO = '0x0000000000000000000000000000000000000000';
// synthetic balance: OpenZeppelin ERC20Upgradeable (v5, namespaced) keeps balances in a mapping at slot
// keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ERC20")) - 1)) & ~0xff; v4 layouts use slot 51.
import { keccak256, encodeAbiParameters } from 'viem';
const ozV5 = '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00';
const balSlot = (base) => keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [me, BigInt(base)]));

const results = [];
async function sim(name, client, to, data, value, overrides) {
  try {
    await client.call({ account: me, to, data, value, stateOverride: overrides });
    const gas = await client.estimateGas({ account: me, to, data, value, stateOverride: overrides }).catch(() => undefined);
    results.push([name, 'OK', gas ? `gas ${gas}` : '']);
  } catch (e) {
    results.push([name, 'REVERT', (e.shortMessage || e.message).split('\n')[0]]);
  }
}
const rich = [{ address: me, balance: parseEther('1') }];
for (const r of routes) {
  const a = r.tokens.arbitrumsepolia;
  const g = r.tokens.gullychaintestnet;
  const q1 = await arb.readContract({ address: a.address, abi, functionName: 'quoteTransferRemote', args: [485590, pad(me), amount] });
  const v1 = q1.filter((q) => q.token === ZERO).reduce((s, q) => s + q.amount, 0n);
  await sim(`fast ${r.id} deposit (value ${v1})`, arb, a.address, encodeFunctionData({ abi, functionName: 'transferRemote', args: [485590, pad(me), amount] }), v1, rich);
  const q2 = await gully.readContract({ address: g.address, abi, functionName: 'quoteTransferRemote', args: [421614, pad(me), amount] });
  const v2 = q2.filter((q) => q.token === ZERO).reduce((s, q) => s + q.amount, 0n);
  const tokenState = [ozV5, 51n, 0n].map((base) => ({ slot: balSlot(base), value: pad(toHex(parseEther('1'))) }));
  await sim(
    `fast ${r.id} withdraw ${g.symbol} (value ${v2})`,
    gully,
    g.address,
    encodeFunctionData({ abi, functionName: 'transferRemote', args: [421614, pad(me), amount] }),
    v2,
    [...rich, { address: g.address, stateDiff: tokenState }],
  );
}
await sim('canonical deposit (Inbox.depositEth)', arb, '0x7B8499f1C058c9bdE2Bc9BdFEBE40364232C52B5', encodeFunctionData({ abi, functionName: 'depositEth' }), amount, rich);
await sim('canonical withdraw (ArbSys.withdrawEth)', gully, '0x0000000000000000000000000000000000000064', encodeFunctionData({ abi, functionName: 'withdrawEth', args: [me] }), amount, rich);
console.log(`throwaway ${me}, amount 0.0002 ETH`);
for (const r of results) console.log(r.join('  |  '));
if (results.some((r) => r[1] !== 'OK')) process.exitCode = 1;
