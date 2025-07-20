import {
  MerkleTreePath,
  WitnessContext,
} from "@midnight-ntwrk/compact-runtime";
import { Ledger } from "./managed/tokenless/contract/index.cjs";

export type TokenlessPrivateState = {
  readonly secrete_key: Uint8Array;
};

export const createTokenlessPrivateState = (secrete_key: Uint8Array) => ({
  secrete_key,
});

export const witnesses = {
  local_secret_key: ({
    privateState,
  }: WitnessContext<Ledger, TokenlessPrivateState>): [
    TokenlessPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secrete_key],

  // Generates proof that a user is part of the investors onchain
  findInvestor: (
    context: WitnessContext<Ledger, TokenlessPrivateState>,
    item: Uint8Array
  ): [TokenlessPrivateState, MerkleTreePath<Uint8Array>] => {
    return [
      context.privateState,
      context.ledger.investors.findPathForLeaf(item)!,
    ];
  },

  // Confirms if a project has expired
  confirm_project_expiration: (
    { privateState }: WitnessContext<Ledger, TokenlessPrivateState>,
    duration: bigint,
    startDate: bigint
  ): [TokenlessPrivateState, boolean] => {
    const millisecondsPerHour = 1000 * 60 * 60 * 24;
    const durationInMilliseconds = millisecondsPerHour * Number(duration);
    const expiryDate = Number(startDate) + durationInMilliseconds;
    const currentDate = Date.now();
    
    return [privateState, expiryDate >= currentDate];
  },
};
