import type { Address, Hash } from 'viem';

import type { ChainKey } from '../config/chains';

export type RouteKind = 'fast' | 'canonical';
export type Direction = 'deposit' | 'withdraw'; // deposit: Arbitrum Sepolia -> GullyChain

export interface QuoteRequest {
  kind: RouteKind;
  direction: Direction;
  amount: bigint;
  sender?: Address;
  recipient?: Address;
  /** Integrator address from ?ref=. The local client records it; the GullyBridgeRouter SDK pays it a fee. */
  ref?: Address;
  fastRouteId?: string;
}

export interface Fee {
  label: string;
  amount: bigint;
  symbol: string;
}

export interface StepDef {
  id: 'approve' | 'send' | 'relay' | 'deliver' | 'challenge' | 'claim';
  label: string;
  hint: string;
  chain: ChainKey;
  /** true when the user signs a transaction for this step */
  user: boolean;
}

export interface Quote {
  req: QuoteRequest;
  from: ChainKey;
  to: ChainKey;
  sendSymbol: string;
  receiveSymbol: string;
  receive: bigint;
  /** native value the origin transaction carries */
  value: bigint;
  fees: Fee[];
  etaSeconds: number;
  steps: StepDef[];
  needsApproval: boolean;
  available: boolean;
  reason?: string;
  notes: string[];
}

export type TransferStatus = 'pending' | 'sent' | 'relaying' | 'delivered' | 'challenge' | 'claimable' | 'claimed' | 'failed';

export interface TransferRecord {
  id: string;
  kind: RouteKind;
  direction: Direction;
  from: ChainKey;
  to: ChainKey;
  amount: string; // bigint as string (JSON-safe)
  sendSymbol: string;
  receiveSymbol: string;
  sender: Address;
  recipient: Address;
  ref?: Address;
  originTx: Hash;
  destTx?: Hash;
  claimTx?: Hash;
  messageId?: Hash; // fast: Hyperlane message id
  depositTxId?: Hash; // canonical deposit: the child-chain deposit tx hash
  position?: string; // canonical withdrawal: outbox leaf index
  createdAt: number;
  updatedAt: number;
  status: TransferStatus;
  error?: string;
  etaSeconds: number;
}

export interface ActivityItem {
  key: string;
  kind: RouteKind;
  direction: Direction;
  amount: bigint;
  symbol: string;
  tx: Hash;
  chain: ChainKey;
  block: bigint;
  time?: number;
  who?: Address;
}

export interface StepUpdate {
  step: StepDef['id'];
  state: 'active' | 'done' | 'error';
  tx?: Hash;
  message?: string;
}
