import type { EscrowContractProviders, DeployedEscrowAPI } from "@escrow/escrow-api";
import type { DAppConnectorWalletAPI, ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";


export interface WalletAndProvider{
    readonly wallet: DAppConnectorWalletAPI,
    readonly uris: ServiceUriConfig,
    readonly providers: EscrowContractProviders
}

export interface WalletAPI {
  wallet: DAppConnectorWalletAPI;
  coinPublicKey: string;
  encryptionPublicKey: string;
  uris: ServiceUriConfig;
}


export interface EscrowDeployment{
  status: "inprogress" | "deployed" | "failed",
  api: DeployedEscrowAPI;
}
