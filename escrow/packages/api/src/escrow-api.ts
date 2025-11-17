import { combineLatest, concat, from, map, Observable, tap } from "rxjs";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { type Logger } from "pino";
import { encodeTokenType, nativeToken } from "@midnight-ntwrk/ledger";
import { CoinInfo } from "@midnight-ntwrk/ledger";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
// Import escrow contract
import { EscrowContract as EscrowContractClass, escrowLedger, EscrowWitnesses } from "@escrow/escrow-contract";
import * as utils from "./utils.js";
import {
  EscrowContract,
  EscrowContractProviders,
  EscrowPrivateStateId,
  EscrowPrivateState,
  DeployedEscrowOnchainContract,
  DerivedEscrowContractState,
  DerivedEscrow,
} from "./common-types.js";

// Escrow contract instance - no witnesses needed
// Need to specify the generic type parameters explicitly to match EscrowContract type
const EscrowContractInstance = new EscrowContractClass<EscrowPrivateState, EscrowWitnesses<EscrowPrivateState>>({}) as EscrowContract;

export interface DeployedEscrowAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedEscrowContractState>;
  create: (
    contributor: string, // ZswapCoinPublicKey as hex string
    amount: number
  ) => Promise<FinalizedCallTxData<any, "create">>;
  release: (
    id: number
  ) => Promise<FinalizedCallTxData<any, "release">>;
  getContractState: () => Promise<any>;
  getLedgerState: () => Promise<any>;
}

export class EscrowAPI implements DeployedEscrowAPI {
  deployedContractAddress: string;
  state: Observable<DerivedEscrowContractState>;

  private constructor(
    private providers: EscrowContractProviders,
    public readonly allReadyDeployedContract: DeployedEscrowOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set up state observable
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => {
              // Parse ledger state using the escrow ledger parser
              try {
                const ledgerState = escrowLedger(contractState.data);
                
                // Convert escrows map to array
                const escrowsArray: DerivedEscrow[] = Array.from(ledgerState.escrows).map(
                  ([id, escrow]) => {
                    // Map state number to string
                    let stateStr: "active" | "released" | "refunded" = "active";
                    if (escrow.state === 0) stateStr = "active";
                    else if (escrow.state === 1) stateStr = "released";
                    else if (escrow.state === 2) stateStr = "refunded";
                    
                    return {
                      id,
                      contributor: escrow.contributor.bytes,
                      state: stateStr,
                      amount: escrow.amount,
                    };
                  }
                );
                
                return {
                  lastEscrowId: ledgerState.last_escrow_id,
                  escrows: escrowsArray,
                  treasury: ledgerState.treasury,
                };
              } catch (error) {
                this.logger?.warn("Failed to parse ledger state", { error });
                return {
                  lastEscrowId: 0n,
                  escrows: [] as DerivedEscrow[],
                  treasury: {
                    nonce: new Uint8Array(32),
                    color: new Uint8Array(32),
                    value: 0n,
                    mt_index: 0n,
                  },
                };
              }
            }),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStateChanged: {
                  ledgerState,
                },
              })
            )
          ),
        concat(from(providers.privateStateProvider.get(EscrowPrivateStateId))),
      ],
      (ledgerState, privateState) => {
        return {
          lastEscrowId: ledgerState.lastEscrowId,
          escrows: ledgerState.escrows,
          treasury: ledgerState.treasury,
        };
      }
    );
  }

  static async deployEscrowContract(
    providers: EscrowContractProviders,
    logger?: Logger
  ): Promise<EscrowAPI> {
    logger?.info("Deploying escrow contract...");

    try {
      const deployedContract = await deployContract<EscrowContract>(
        providers,
        {
          contract: EscrowContractInstance,
          initialPrivateState: await EscrowAPI.getPrivateState(providers),
          privateStateId: EscrowPrivateStateId,
        }
      );

      logger?.trace("Escrow deployment successful", {
        contractDeployed: {
          finalizedDeployTxData: deployedContract.deployTxData.public,
        },
      });

      return new EscrowAPI(providers, deployedContract, logger);
    } catch (error) {
      logger?.error("Error in deployEscrowContract", {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  static async joinEscrowContract(
    providers: EscrowContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<EscrowAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const existingContract = await findDeployedContract<EscrowContract>(
      providers,
      {
        contract: EscrowContractInstance,
        contractAddress: contractAddress,
        privateStateId: EscrowPrivateStateId,
        initialPrivateState: await EscrowAPI.getPrivateState(providers),
      }
    );

    logger?.trace("Found Escrow Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new EscrowAPI(providers, existingContract, logger);
  }

  coin(amount: number): { nonce: Uint8Array, color: Uint8Array, value: bigint } {
    const nonceBytes = utils.randomNonceBytes(32);
    const colorBytes = encodeTokenType(nativeToken());
    return {
      color: colorBytes,
      nonce: nonceBytes,
      value: BigInt(amount),
    };
  }

  async create(
    contributor: string,
    amount: number
  ): Promise<FinalizedCallTxData<EscrowContract, "create">> {
    this.logger?.info(`Creating escrow for contributor ${contributor} with amount ${amount}...`);

    // Convert contributor hex string to ZswapCoinPublicKey format { bytes: Uint8Array }
    // ZswapCoinPublicKey requires exactly 32 bytes
    // Remove '0x' prefix if present and convert hex to bytes
    const hex = contributor.replace(/^0x/, '');
    
    // Convert hex to bytes
    const tempBytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      tempBytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    
    // ZswapCoinPublicKey must be exactly 32 bytes
    // If the input is longer, take the first 32 bytes
    // If it's shorter, pad with zeros at the end
    const bytes = new Uint8Array(32);
    if (tempBytes.length >= 32) {
      bytes.set(tempBytes.slice(0, 32), 0);
    } else {
      bytes.set(tempBytes, 0);
      // Remaining bytes are already zero-initialized
    }
    
    this.logger?.trace(`Converted contributor to ZswapCoinPublicKey`, {
      originalHex: contributor,
      hexLength: hex.length,
      bytesLength: bytes.length,
      bytes: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    });
    
    const contributorKey = { bytes }; // Wrap in object with bytes property
    
    const txData = await this.allReadyDeployedContract.callTx.create(
      contributorKey,
      this.coin(amount)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "create",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async release(
    id: number
  ): Promise<FinalizedCallTxData<EscrowContract, "release">> {
    this.logger?.info(`Releasing escrow with id ${id}...`);

    const txData = await this.allReadyDeployedContract.callTx.release(
      BigInt(id)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "release",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async getContractState(): Promise<any> {
    try {
      this.logger?.info("Getting escrow contract state...", { address: this.deployedContractAddress });
      
      const contractState = await this.providers.publicDataProvider.queryContractState(
        this.deployedContractAddress
      );
      
      if (contractState) {
        this.logger?.info("Contract state retrieved successfully");
        return {
          address: this.deployedContractAddress,
          data: contractState.data,
          // blockHeight and blockHash may not be directly on contractState
          blockHeight: (contractState as any).blockHeight,
          blockHash: (contractState as any).blockHash,
        };
      } else {
        this.logger?.warn("No contract state found");
        return {
          address: this.deployedContractAddress,
          data: null,
          message: "No contract state found at this address"
        };
      }
    } catch (error) {
      this.logger?.error("Failed to get contract state", { error: error instanceof Error ? error.message : error });
      return {
        address: this.deployedContractAddress,
        error: error instanceof Error ? error.message : "Failed to get contract state"
      };
    }
  }

  async getLedgerState(): Promise<any> {
    try {
      this.logger?.info("Getting escrow ledger state...", { address: this.deployedContractAddress });
      
      const contractState = await this.getContractState();
      
      if (contractState.data) {
        // Try to parse the ledger state
        try {
          const ledgerState = escrowLedger(contractState.data);
          
          // Convert escrows map to array
          const escrowsArray = Array.from(ledgerState.escrows).map(([id, escrow]) => {
            let stateStr: "active" | "released" | "refunded" = "active";
            if (escrow.state === 0) stateStr = "active";
            else if (escrow.state === 1) stateStr = "released";
            else if (escrow.state === 2) stateStr = "refunded";
            
            return {
              id: id.toString(),
              contributor: Array.from(escrow.contributor.bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
              state: stateStr,
              amount: escrow.amount.toString(),
            };
          });
          
          this.logger?.info("Ledger state parsed successfully");
          return {
            address: this.deployedContractAddress,
            ledgerState: {
              lastEscrowId: ledgerState.last_escrow_id.toString(),
              escrows: escrowsArray,
              treasury: {
                nonce: Array.from(ledgerState.treasury.nonce).map(b => b.toString(16).padStart(2, '0')).join(''),
                color: Array.from(ledgerState.treasury.color).map(b => b.toString(16).padStart(2, '0')).join(''),
                value: ledgerState.treasury.value.toString(),
                mt_index: ledgerState.treasury.mt_index.toString(),
              },
            },
            blockHeight: contractState.blockHeight,
            blockHash: contractState.blockHash,
          };
        } catch (parseError) {
          this.logger?.warn("Failed to parse ledger state", { error: parseError });
          return {
            address: this.deployedContractAddress,
            rawData: contractState.data,
            parseError: parseError instanceof Error ? parseError.message : "Failed to parse ledger state"
          };
        }
      } else {
        return contractState;
      }
    } catch (error) {
      this.logger?.error("Failed to get ledger state", { error: error instanceof Error ? error.message : error });
      return {
        address: this.deployedContractAddress,
        error: error instanceof Error ? error.message : "Failed to get ledger state"
      };
    }
  }

  private static async getPrivateState(
    providers: EscrowContractProviders
  ): Promise<Record<string, never>> {
    const existingPrivateState = await providers.privateStateProvider.get(
      EscrowPrivateStateId
    );
    return existingPrivateState ?? {};
  }
}

