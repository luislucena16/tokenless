import type { TokenlessContractProviders, DeployedTokenlessAPI } from "@tokenless/tokenless-api";
import type { DAppConnectorWalletAPI, ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";


export interface WalletAndProvider{
    readonly wallet: DAppConnectorWalletAPI,
    readonly uris: ServiceUriConfig,
    readonly providers: TokenlessContractProviders
}

export interface WalletAPI {
  wallet: DAppConnectorWalletAPI;
  coinPublicKey: string;
  encryptionPublicKey: string;
  uris: ServiceUriConfig;
}


export interface TokenlessDeployment{
  status: "inprogress" | "deployed" | "failed",
  api: DeployedTokenlessAPI;
}