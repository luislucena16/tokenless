import {
  Contract,
  Witnesses,
  TokenlessPrivateState,
  Project,
  ProjectStatus,
} from "@tokenless/tokenless-contract";

import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const TokenlessPrivateStateId = "tokenlessPrivateState";
export type TokenlessPrivateStateId = typeof TokenlessPrivateStateId;
export type TokenlessContract = Contract<
  TokenlessPrivateState,
  Witnesses<TokenlessPrivateState>
>;
export type TokenCircuitKeys = Exclude<
  keyof TokenlessContract["impureCircuits"],
  number | symbol
>;
export type TokenlessContractProviders = MidnightProviders<
  TokenCircuitKeys,
  TokenlessPrivateStateId,
  TokenlessPrivateState
>;
export type DeployedTokenlessOnchainContract =
  FoundContract<TokenlessContract>;
export type DerivedTokenlessContractState = {
  readonly protocolTVL: DerivedProtocolTotal[];
  readonly projects: DerivedProject[];
};

export type DerivedProtocolTotal = {
  id: string;
  pool_balance: {
    nonce: Uint8Array;
    color: Uint8Array;
    value: bigint;
    mt_index: bigint;
  };
};

export type DerivedProject = {
  id: string;
  project: Project;
};
