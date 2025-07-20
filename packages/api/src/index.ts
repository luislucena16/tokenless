import { combineLatest, concat, from, map, Observable, tap } from "rxjs";

import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  TokenlessPrivateState,
  CoinInfo,
  createTokenlessPrivateState,
  witnesses,
} from "@tokenless/tokenless-contract";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import { encodeTokenType, nativeToken } from "@midnight-ntwrk/ledger";
import {
  TokenlessContract,
  TokenlessContractProviders,
  TokenlessPrivateStateId,
  DeployedTokenlessOnchainContract,
  DerivedTokenlessContractState,
} from "./common-types.js";

const TokenlessContractInstance: TokenlessContract = new Contract(
  witnesses
);

export interface DeployedTokenlessAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedTokenlessContractState>;
  createProject: (
    _projectID: string,
    title: string,
    desc: string,
    coinType: string,
    duration: number,
    investmentGoal: number
  ) => Promise<FinalizedCallTxData<TokenlessContract, "createProject">>;
  withdrawProjectFunds: (
    _projectID: string
  ) => Promise<
    FinalizedCallTxData<TokenlessContract, "withdrawProjectFunds">
  >;
  investProject: (
    _projectID: string,
    amount: number
  ) => Promise<FinalizedCallTxData<TokenlessContract, "investProject">>;
  endProject: (
    _projectID: string
  ) => Promise<FinalizedCallTxData<TokenlessContract, "endProject">>;
  cancelProject: (
    _projectID: string
  ) => Promise<FinalizedCallTxData<TokenlessContract, "cancelProject">>;
  requestRefund: (
    _projectID: string,
    refund_amount: number,
    amountDeposited: number
  ) => Promise<FinalizedCallTxData<TokenlessContract, "requestRefund">>;
  updateProject: (
    _projectID: string,
    title: string,
    desc: string,
    investmentGoal: number,
    duration: number
  ) => Promise<FinalizedCallTxData<TokenlessContract, "updateProject">>;
}
/**
 * NB: Declaring a class implements a given type, means it must contain all defined properties and methods, then take on other extra properties or class
 */

export class TokenlessAPI implements DeployedTokenlessAPI {
  deployedContractAddress: string;
  state: Observable<DerivedTokenlessContractState>;

  // Within the constructor set the two properties of the API Class Object
  // Using access modifiers on parameters create a property instances for that parameter and stores it as part of the object
  /**
   * @param allReadyDeployedContract
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: TokenlessContractProviders,
    public readonly allReadyDeployedContract: DeployedTokenlessOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              })
            )
          ),
        concat(
          from(providers.privateStateProvider.get(TokenlessPrivateStateId))
        ),
      ],
      (ledgerState, privateState) => {
        return {
          protocolTVL: utils.createDeriveProtocolTVLArray(
            ledgerState.protocolTVL
          ),
          projects: utils.createDerivedProjectsArray(ledgerState.projects),
        };
      }
    );
  }

  static async deployTokenlessContract(
    providers: TokenlessContractProviders,
    logger?: Logger
  ): Promise<TokenlessAPI> {
    logger?.info("deploy contract");
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployedContract = await deployContract<TokenlessContract>(
      providers,
      {
        contract: TokenlessContractInstance,
        initialPrivateState: await TokenlessAPI.getPrivateState(providers),
        privateStateId: TokenlessPrivateStateId,
      }
    );

    logger?.trace("Deployment successfull", {
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new TokenlessAPI(providers, deployedContract, logger);
  }

  static async joinTokenlessContract(
    providers: TokenlessContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<TokenlessAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const existingContract = await findDeployedContract<TokenlessContract>(
      providers,
      {
        contract: TokenlessContractInstance,
        contractAddress: contractAddress,
        privateStateId: TokenlessPrivateStateId,
        initialPrivateState: await TokenlessAPI.getPrivateState(providers),
      }
    );

    logger?.trace("Found Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new TokenlessAPI(providers, existingContract, logger);
  }

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  async createProject(
    _projectID: string,
    title: string,
    desc: string,
    coinType: string,
    duration: number,
    investmentGoal: number
  ): Promise<FinalizedCallTxData<TokenlessContract, "createProject">> {
    this.logger?.info(`Creating project with id ${_projectID}....`);

    const txData = await this.allReadyDeployedContract.callTx.createProject(
      utils.hexStringToUint8Array(_projectID),
      BigInt(investmentGoal),
      BigInt(duration),
      encodeTokenType(coinType),
      BigInt(Date.now()),
      title,
      desc
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "createProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async investProject(
    _projectID: string,
    amount: number
  ): Promise<FinalizedCallTxData<TokenlessContract, "investProject">> {
    this.logger?.info(`investing project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.investProject(
      this.coin(amount),
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "investProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async endProject(
    _projectID: string
  ): Promise<FinalizedCallTxData<TokenlessContract, "endProject">> {
    this.logger?.info(`Ending project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.endProject(
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "endProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async cancelProject(
    _projectID: string
  ): Promise<FinalizedCallTxData<TokenlessContract, "cancelProject">> {
    this.logger?.info(`Canceling project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.cancelProject(
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "cancelProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async requestRefund(
    _projectID: string,
    refund_amount: number,
    amountDeposited: number
  ): Promise<FinalizedCallTxData<TokenlessContract, "requestRefund">> {
    this.logger?.info(
      `Refunding ${refund_amount} worth of assets deposited to project with id ${_projectID}...`
    );

    const txData = await this.allReadyDeployedContract.callTx.requestRefund(
      utils.hexStringToUint8Array(_projectID),
      BigInt(refund_amount),
      BigInt(amountDeposited)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "requestRefund",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async updateProject(
    _projectID: string,
    title: string,
    desc: string,
    investmentGoal: number,
    duration: number
  ): Promise<FinalizedCallTxData<TokenlessContract, "updateProject">> {
    this.logger?.info(`Updating project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.updateProject(
      utils.hexStringToUint8Array(_projectID),
      title,
      desc,
      BigInt(investmentGoal),
      BigInt(duration)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "updateProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async withdrawProjectFunds(
    _projectID: string
  ): Promise<
    FinalizedCallTxData<TokenlessContract, "withdrawProjectFunds">
  > {
    this.logger?.info(
      `Withdrawing funds from project with id ${_projectID}...`
    );

    const txData =
      await this.allReadyDeployedContract.callTx.withdrawProjectFunds(
        utils.hexStringToUint8Array(_projectID)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "withdrawProjectFunds",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: TokenlessContractProviders
  ): Promise<TokenlessPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      TokenlessPrivateStateId
    );
    return (
      existingPrivateState ??
      createTokenlessPrivateState(utils.randomNonceBytes(32))
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
