import {
  EscrowContract as EscrowContractType,
  EscrowWitnesses,
  EscrowLedger,
} from "@escrow/escrow-contract";

import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

// Escrow types
export const EscrowPrivateStateId = "escrowPrivateState";
export type EscrowPrivateStateId = typeof EscrowPrivateStateId;
export type EscrowPrivateState = Record<string, never>; // Empty private state for escrow

export type EscrowContract = EscrowContractType<
  EscrowPrivateState,
  EscrowWitnesses<EscrowPrivateState>
>;

export type EscrowCircuitKeys = Exclude<
  keyof EscrowContract["impureCircuits"],
  number | symbol
>;

export type EscrowContractProviders = MidnightProviders<
  EscrowCircuitKeys,
  EscrowPrivateStateId,
  EscrowPrivateState
>;

export type DeployedEscrowOnchainContract = FoundContract<EscrowContract>;

export type DerivedEscrowContractState = {
  readonly lastEscrowId: bigint;
  readonly escrows: DerivedEscrow[];
  readonly treasury: {
    nonce: Uint8Array;
    color: Uint8Array;
    value: bigint;
    mt_index: bigint;
  };
};

export type DerivedEscrow = {
  id: bigint;
  contributor: Uint8Array; // ZswapCoinPublicKey bytes
  state: "active" | "released" | "refunded";
  amount: bigint;
};

