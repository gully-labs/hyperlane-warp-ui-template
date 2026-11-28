// USDC deposit (and withdrawal) through the canonical Arbitrum token bridge (the USDC gateways of gully-ops l3/usdc): pure helpers plus
// the three chain reads the quote needs. Flow: approve the L1 USDC gateway, then L1GatewayRouter.
// outboundTransferCustomRefund(...) with ETH for the retryable ticket; the ticket auto-redeems on Gully Chain and the
// L2 USDC gateway mints USDC.e to the recipient. Same call the tested gully-ops l3/usdc/deposit.mjs makes.
// Withdrawal (same as gully-ops l3/usdc/fork-test.mjs step 5): approve the L2 USDC gateway, L2GatewayRouter.outboundTransfer
// burns USDC.e and posts an L2ToL1Tx; after the rollup's challenge period Outbox.executeTransaction on Arbitrum Sepolia runs
// L1USDCGateway.finalizeInboundTransfer, which releases the escrowed USDC (the generic claim in localClient).
import { encodeAbiParameters, parseAbi, parseAbiItem, type Address, type Hex } from 'viem';

import { CANONICAL, CHILD, PARENT } from '../config/chains';
import { USDC_GATEWAY, type UsdcGateway } from '../config/gateway';
import { pub } from './clients';

export const gatewayRouterAbi = parseAbi([
  'function getGateway(address token) view returns (address)',
  'function outboundTransferCustomRefund(address token, address refundTo, address to, uint256 amount, uint256 maxGas, uint256 gasPriceBid, bytes data) payable returns (bytes)',
]);
export const usdcGatewayAbi = parseAbi([
  'function getOutboundCalldata(address token, address from, address to, uint256 amount, bytes data) view returns (bytes)',
  'function depositsPaused() view returns (bool)',
  'function counterpartGateway() view returns (address)',
]);
const inboxFeeAbi = parseAbi(['function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)']);
const nodeInterfaceTicketAbi = parseAbi([
  'function estimateRetryableTicket(address sender, uint256 deposit, address to, uint256 l2CallValue, address excessFeeRefundAddress, address callValueRefundAddress, bytes data) returns (uint256)',
]);
export const childRouterAbi = parseAbi([
  'function calculateL2TokenAddress(address l1ERC20) view returns (address)',
  'function getGateway(address token) view returns (address)',
  // withdrawal: the router finds the L2 USDC gateway, which burns USDC.e and sends ArbSys.sendTxToL1 to the L1 gateway
  'function outboundTransfer(address _l1Token, address _to, uint256 _amount, bytes _data) payable returns (bytes)',
]);
export const childUsdcGatewayAbi = parseAbi(['function withdrawalsPaused() view returns (bool)']);
/** emitted by the L2 USDC gateway on every withdrawal; `_l2ToL1Id` is the outbox leaf (the L2ToL1Tx position) */
export const withdrawalInitiatedEvent = parseAbiItem(
  'event WithdrawalInitiated(address l1Token, address indexed _from, address indexed _to, uint256 indexed _l2ToL1Id, uint256 _exitNum, uint256 _amount)',
);

/** The args of L2GatewayRouter.outboundTransfer for a USDC.e withdrawal: the token is named by its PARENT address. */
export function withdrawArgs(g: UsdcGateway, o: { to: Address; amount: bigint }) {
  return [g.parentUsdc, o.to, o.amount, '0x'] as const;
}

/** Reads: is the withdrawal path open (child router -> the USDC gateway we know, withdrawals not paused). */
export async function readWithdrawState(g: UsdcGateway): Promise<{ open: true } | { open: false; reason: string }> {
  const child = pub(CHILD);
  const [routed, paused] = await Promise.all([
    child.readContract({ address: g.childRouter, abi: childRouterAbi, functionName: 'getGateway', args: [g.parentUsdc] }),
    child.readContract({ address: g.childGateway, abi: childUsdcGatewayAbi, functionName: 'withdrawalsPaused' }),
  ]);
  if (routed.toLowerCase() !== g.childGateway.toLowerCase()) return { open: false, reason: 'USDC withdrawals are not set up on the Gully Chain router' };
  if (paused) return { open: false, reason: 'USDC withdrawals are paused right now' };
  return { open: true };
}

export interface RetryableCost {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxSubmissionCost: bigint;
  /** ETH the deposit transaction carries: submission cost + gas limit * max fee */
  value: bigint;
}

/** Same sizing as gully-ops l3/usdc/lib.mjs retryableParams: gas estimate x2 (at least 300k), fee x3 of the child gas price, submission fee x3. */
export function sizeRetryable(a: { estimatedGas?: bigint; childGasPrice: bigint; submissionFee: bigint }): RetryableCost {
  const MIN_GAS = 300_000n;
  let gasLimit = a.estimatedGas === undefined ? MIN_GAS : a.estimatedGas * 2n;
  if (gasLimit < MIN_GAS) gasLimit = MIN_GAS;
  const maxFeePerGas = a.childGasPrice * 3n;
  const maxSubmissionCost = a.submissionFee * 3n;
  return { gasLimit, maxFeePerGas, maxSubmissionCost, value: maxSubmissionCost + gasLimit * maxFeePerGas };
}

/** The `_data` argument the router passes to the gateway: abi.encode(maxSubmissionCost, extraData). */
export function routerExtraData(maxSubmissionCost: bigint): Hex {
  return encodeAbiParameters([{ type: 'uint256' }, { type: 'bytes' }], [maxSubmissionCost, '0x']);
}

export function depositArgs(g: UsdcGateway, o: { refundTo: Address; to: Address; amount: bigint; cost: RetryableCost }) {
  return [g.parentUsdc, o.refundTo, o.to, o.amount, o.cost.gasLimit, o.cost.maxFeePerGas, routerExtraData(o.cost.maxSubmissionCost)] as const;
}

export function dataLength(hex: Hex): bigint {
  return BigInt((hex.length - 2) / 2);
}

/** Reads: is the path open (router -> USDC gateway, deposits not paused), and what the retryable ticket costs. */
export async function readGatewayState(
  g: UsdcGateway,
  o: { sender: Address; to: Address; amount: bigint },
): Promise<{ open: true; cost: RetryableCost } | { open: false; reason: string }> {
  const parent = pub(PARENT);
  const child = pub(CHILD);
  const [routed, paused, l2Token] = await Promise.all([
    parent.readContract({ address: g.l1Router, abi: gatewayRouterAbi, functionName: 'getGateway', args: [g.parentUsdc] }),
    parent.readContract({ address: g.l1Gateway, abi: usdcGatewayAbi, functionName: 'depositsPaused' }),
    child.readContract({ address: g.childRouter, abi: childRouterAbi, functionName: 'calculateL2TokenAddress', args: [g.parentUsdc] }),
  ]);
  if (routed.toLowerCase() !== g.l1Gateway.toLowerCase()) return { open: false, reason: 'USDC deposits are not set up on the bridge router yet' };
  if (paused) return { open: false, reason: 'USDC deposits are paused right now' };
  if (l2Token.toLowerCase() !== g.childUsdc.toLowerCase()) return { open: false, reason: 'USDC.e does not match the bridge on Gully Chain' };
  const [data, counterpart, childGasPrice, block] = await Promise.all([
    parent.readContract({ address: g.l1Gateway, abi: usdcGatewayAbi, functionName: 'getOutboundCalldata', args: [g.parentUsdc, o.sender, o.to, o.amount, '0x'] }),
    parent.readContract({ address: g.l1Gateway, abi: usdcGatewayAbi, functionName: 'counterpartGateway' }),
    child.getGasPrice(),
    parent.getBlock(),
  ]);
  const submissionFee = await parent.readContract({
    address: CANONICAL.inbox,
    abi: inboxFeeAbi,
    functionName: 'calculateRetryableSubmissionFee',
    args: [dataLength(data), block.baseFeePerGas ?? 0n],
  });
  let estimatedGas: bigint | undefined;
  try {
    estimatedGas = await child.estimateContractGas({
      address: CANONICAL.nodeInterface,
      abi: nodeInterfaceTicketAbi,
      functionName: 'estimateRetryableTicket',
      args: [g.l1Gateway, 10n ** 18n, counterpart, 0n, g.l1Gateway, g.l1Gateway, data],
      account: g.l1Gateway,
    });
  } catch {
    estimatedGas = undefined; // the sizing falls back to the 300k minimum
  }
  return { open: true, cost: sizeRetryable({ estimatedGas, childGasPrice, submissionFee }) };
}

export { USDC_GATEWAY };
