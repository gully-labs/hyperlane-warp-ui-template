import { decodeAbiParameters } from 'viem';
import { describe, expect, it } from 'vitest';

import type { McRoute } from '../config/multichain';
import type { UsdcGateway } from '../config/gateway';
import { DEFAULT_SOURCES, pickOption, tokenOptions, type LaneSources } from './lanes';
import { dataLength, depositArgs, routerExtraData, sizeRetryable, withdrawArgs } from './usdcGateway';
import { gatewayWithdrawNotes, gatewayWithdrawSteps, humanDuration, isGatewayWithdrawReq, positionFromReceipt } from './localClient';
import { claimReadyLine } from '../ui/common/parts';
import { encodeAbiParameters, encodeEventTopics, pad } from 'viem';
import { l2ToL1TxEvent } from './abis';

const g: UsdcGateway = {
  l1Router: '0xfbd7503009AB4ee5A1f980a2fCDEE4C7BEB6b2B9',
  l1Gateway: '0xF904064BE100489a200EB754E591362C7Ced2D5b',
  parentUsdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  childUsdc: '0x65Ba03c6FA90Ed549f465D4c8f2e784D6eEB7E76',
  childRouter: '0x32C680cA4c27A3566fE5Dfd4643fE420eE1039B7',
  childGateway: '0xd9d07510ceefeeaf538bddbe4ee1b76e9f1a71b3',
  faucet: 'https://faucet.circle.com/',
};
const tok = (symbol: string, decimals: number, collateral: string | null) => ({
  address: null, standard: null, tokenType: 'collateral', symbol, name: symbol, decimals, collateralAddress: collateral,
});
const usdc = (deployed: boolean): McRoute => ({
  id: 'USDC/x', key: 'USDC', symbol: 'USDC', name: 'USD Coin', deployed,
  tokens: { arbitrumsepolia: tok('USDC', 6, g.parentUsdc), gullychaintestnet: tok('USDC', 6, g.childUsdc) },
});
const src = (deployed: boolean, gw: UsdcGateway | undefined): LaneSources => ({
  classic: [], defaultClassicId: '', multichain: [usdc(deployed)], canonicalChains: ['arbitrumsepolia'], usdcGateway: gw,
});

describe('USDC gateway option', () => {
  it('is live on Arbitrum Sepolia deposits: USDC -> USDC.e, 6 decimals', () => {
    const [o] = tokenOptions('arbitrumsepolia', 'deposit', src(false, g));
    expect(o.gateway).toBe(true);
    expect(o.live).toBe(true);
    expect(o.send.symbol).toBe('USDC');
    expect(o.send.collateralAddress).toBe(g.parentUsdc);
    expect(o.receive.symbol).toBe('USDC.e');
    expect(o.receive.address).toBe(g.childUsdc);
    expect(pickOption([o])?.gateway).toBe(true);
  });
  it('is live on withdrawals too: USDC.e on Gully Chain -> USDC on Arbitrum Sepolia', () => {
    const [o] = tokenOptions('arbitrumsepolia', 'withdraw', src(false, g));
    expect(o.gateway).toBe(true);
    expect(o.live).toBe(true);
    expect(o.direction).toBe('withdraw');
    expect(o.from).toBe('gullychaintestnet');
    expect(o.to).toBe('arbitrumsepolia');
    expect(o.send.symbol).toBe('USDC.e');
    expect(o.send.address).toBe(g.childUsdc);
    expect(o.send.tokenType).toBe('synthetic');
    expect(o.receive.symbol).toBe('USDC');
    expect(o.receive.collateralAddress).toBe(g.parentUsdc);
  });
  it('a deployed Hyperlane USDC route, or no gateway config, uses the normal route', () => {
    expect(tokenOptions('arbitrumsepolia', 'deposit', src(true, g))[0].gateway).toBeUndefined();
    expect(tokenOptions('arbitrumsepolia', 'deposit', src(false, undefined))[0].live).toBe(false);
  });
  it('the default (testnet) sources carry the gateway', () => {
    expect(DEFAULT_SOURCES.usdcGateway?.l1Gateway).toBe(g.l1Gateway);
  });
});

describe('retryable sizing and deposit args', () => {
  it('sizes like gully-ops l3/usdc/lib.mjs', () => {
    const c = sizeRetryable({ estimatedGas: 200_000n, childGasPrice: 100n, submissionFee: 1000n });
    expect(c.gasLimit).toBe(400_000n);
    expect(c.maxFeePerGas).toBe(300n);
    expect(c.maxSubmissionCost).toBe(3000n);
    expect(c.value).toBe(3000n + 400_000n * 300n);
  });
  it('never goes under 300k gas, and falls back to it without an estimate', () => {
    expect(sizeRetryable({ estimatedGas: 10n, childGasPrice: 1n, submissionFee: 1n }).gasLimit).toBe(300_000n);
    expect(sizeRetryable({ childGasPrice: 1n, submissionFee: 1n }).gasLimit).toBe(300_000n);
  });
  it('encodes extra data as (maxSubmissionCost, empty bytes)', () => {
    const [cost, bytes] = decodeAbiParameters([{ type: 'uint256' }, { type: 'bytes' }], routerExtraData(12345n));
    expect(cost).toBe(12345n);
    expect(bytes).toBe('0x');
  });
  it('deposits the parent USDC to the recipient, refunding the sender', () => {
    const cost = sizeRetryable({ childGasPrice: 1n, submissionFee: 1n });
    const a = depositArgs(g, { refundTo: '0x0000000000000000000000000000000000000001', to: '0x0000000000000000000000000000000000000002', amount: 5_000_000n, cost });
    expect(a.slice(0, 6)).toEqual([g.parentUsdc, '0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', 5_000_000n, cost.gasLimit, cost.maxFeePerGas]);
  });
  it('counts bytes', () => expect(dataLength('0x0102')).toBe(2n));
});

describe('USDC.e withdrawal', () => {
  it('calls the child router with the PARENT token address, the recipient, the amount and empty data', () => {
    expect(withdrawArgs(g, { to: '0x0000000000000000000000000000000000000002', amount: 4_000_000n })).toEqual([
      g.parentUsdc,
      '0x0000000000000000000000000000000000000002',
      4_000_000n,
      '0x',
    ]);
  });
  it('applies only to the USDC route with Arbitrum Sepolia, withdraw direction', () => {
    const id = DEFAULT_SOURCES.multichain.find((r) => r.key === 'USDC' && !r.deployed && r.tokens.arbitrumsepolia)?.id;
    if (!id) return; // the manifest has a deployed USDC route: the gateway is not used
    expect(isGatewayWithdrawReq({ direction: 'withdraw', fastRouteId: id })).toBe(true);
    expect(isGatewayWithdrawReq({ direction: 'deposit', fastRouteId: id })).toBe(false);
    expect(isGatewayWithdrawReq({ direction: 'withdraw', fastRouteId: id, remote: 'sepolia' })).toBe(false);
  });
  it('shows the four steps with the wait, and says how long the challenge period is (testnet and mainnet)', () => {
    const s = gatewayWithdrawSteps(45 * 60);
    expect(s.map((x) => x.id)).toEqual(['approve', 'send', 'challenge', 'claim']);
    expect(s[2].hint).toContain('45 minutes');
    expect(s[3].chain).toBe('arbitrumsepolia');
    const n = gatewayWithdrawNotes(45 * 60).join(' ');
    expect(n).toContain('about 45 minutes on testnet');
    expect(n).toContain('about 7 days on mainnet');
    expect(n).toContain('claim on Arbitrum Sepolia');
  });
  it('words a wait plainly', () => {
    expect(humanDuration(45 * 60)).toBe('45 minutes');
    expect(humanDuration(5 * 3600)).toBe('5 hours');
    expect(humanDuration(6.4 * 86400)).toBe('6 days');
  });
  it('reads the outbox position of the L2ToL1Tx from a receipt', () => {
    const topics = encodeEventTopics({
      abi: [l2ToL1TxEvent],
      eventName: 'L2ToL1Tx',
      args: { destination: g.l1Gateway, hash: 7n, position: 42n },
    });
    const data = encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bytes' }],
      [g.childGateway, 1n, 2n, 3n, 0n, '0x1234'],
    );
    const other = { data: '0x' as const, topics: [pad('0x01')] as [`0x${string}`] };
    expect(positionFromReceipt({ logs: [other, { data, topics }] as never })).toBe('42');
    expect(positionFromReceipt({ logs: [other] as never })).toBeUndefined();
  });
  it('tells when the claim will be ready', () => {
    const now = 1_000_000_000_000;
    expect(claimReadyLine({ createdAt: now - 5 * 60_000, etaSeconds: 45 * 60 }, now)).toMatch(/Ready to claim in about/);
    expect(claimReadyLine({ createdAt: now - 50 * 60_000, etaSeconds: 45 * 60 }, now)).toMatch(/Almost ready/);
  });
});
