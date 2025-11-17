import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lock,
  Unlock,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  Database,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import { useState, useEffect } from "react";
import { EscrowAPI, type DeployedEscrowAPI, type EscrowContractProviders } from "@escrow/escrow-api";
import type { Logger } from "pino";
import { toast } from "react-hot-toast";

interface EscrowBoardProps {
  logger?: Logger;
}

const EscrowBoard = ({ logger }: EscrowBoardProps) => {
  const walletContext = useMidnightWallet();
  const [escrowApi, setEscrowApi] = useState<DeployedEscrowAPI | undefined>(undefined);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [joinAddress, setJoinAddress] = useState("");
  const [escrows, setEscrows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractState, setContractState] = useState<any>(null);
  const [ledgerState, setLedgerState] = useState<any>(null);

  // Form states for creating escrow
  const [contributorAddress, setContributorAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isReleasing, setIsReleasing] = useState<number | null>(null);

  useEffect(() => {
    if (!escrowApi) return;

    setIsLoading(true);
    const stateSubscription = escrowApi.state.subscribe((state) => {
      setEscrows(state.escrows ?? []);
      setIsLoading(false);
    });

    return () => {
      stateSubscription.unsubscribe();
    };
  }, [escrowApi]);

  const handleDeployContract = async () => {
    if (!walletContext?.walletState.hasConnected || !walletContext?.walletState.providers) {
      toast.error("Wallet must be connected before deploying contract");
      return;
    }

    setIsDeploying(true);
    try {
      // Cast providers to EscrowContractProviders
      // The providers are compatible but typed as TokenlessContractProviders
      const escrowProviders = walletContext.walletState.providers as any as EscrowContractProviders;
      const deployedAPI = await EscrowAPI.deployEscrowContract(
        escrowProviders,
        logger
      );
      
      setEscrowApi(deployedAPI);
      setContractAddress(deployedAPI.deployedContractAddress);
      toast.success(`Contract deployed at: ${deployedAPI.deployedContractAddress}`);
      logger?.info("Successfully deployed escrow contract", { 
        contractAddress: deployedAPI.deployedContractAddress 
      });
    } catch (error) {
      console.error("Deployment error details:", error);
      let errMsg = "Failed to deploy contract";
      if (error instanceof Error) {
        errMsg = error.message || error.toString();
      } else if (typeof error === 'string') {
        errMsg = error;
      } else if (error && typeof error === 'object') {
        errMsg = JSON.stringify(error);
      }
      toast.error(errMsg || "Unknown error occurred");
      logger?.error("Failed to deploy escrow contract", { 
        error: errMsg,
        errorDetails: error,
        errorType: typeof error,
        errorString: String(error)
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleJoinContract = async () => {
    if (!walletContext?.walletState.hasConnected || !walletContext?.walletState.providers) {
      toast.error("Wallet must be connected before joining contract");
      return;
    }

    if (!joinAddress.trim()) {
      toast.error("Contract address is required");
      return;
    }

    setIsJoining(true);
    try {
      const deployedAPI = await EscrowAPI.joinEscrowContract(
        walletContext.walletState.providers as any,
        joinAddress.trim(),
        logger
      );
      
      setEscrowApi(deployedAPI);
      setContractAddress(deployedAPI.deployedContractAddress);
      toast.success(`Successfully joined contract at: ${deployedAPI.deployedContractAddress}`);
      logger?.info("Successfully joined escrow contract", { 
        contractAddress: deployedAPI.deployedContractAddress 
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to join contract";
      toast.error(errMsg);
      logger?.error("Failed to join escrow contract", { error: errMsg });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!escrowApi) {
      toast.error("Contract not deployed or joined");
      return;
    }

    if (!contributorAddress.trim() || !amount.trim()) {
      toast.error("Contributor address and amount are required");
      return;
    }

    setIsCreating(true);
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Invalid amount");
        return;
      }

      const txData = await escrowApi.create(contributorAddress.trim(), amountNum);
      toast.success(`Escrow created! TX: ${txData.public.txHash}`);
      logger?.info("Escrow created successfully", { txHash: txData.public.txHash });
      
      // Reset form
      setContributorAddress("");
      setAmount("");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to create escrow";
      toast.error(errMsg);
      logger?.error("Failed to create escrow", { error: errMsg });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReleaseEscrow = async (id: number) => {
    if (!escrowApi) {
      toast.error("Contract not deployed or joined");
      return;
    }

    setIsReleasing(id);
    try {
      const txData = await escrowApi.release(id);
      toast.success(`Escrow released! TX: ${txData.public.txHash}`);
      logger?.info("Escrow released successfully", { txHash: txData.public.txHash, id });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to release escrow";
      toast.error(errMsg);
      logger?.error("Failed to release escrow", { error: errMsg, id });
    } finally {
      setIsReleasing(null);
    }
  };

  const handleGetContractState = async () => {
    if (!escrowApi) return;
    
    setIsLoading(true);
    try {
      const state = await escrowApi.getContractState();
      setContractState(state);
    } catch (error) {
      console.error("Failed to get contract state:", error);
      toast.error("Failed to get contract state");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLedgerState = async () => {
    if (!escrowApi) return;
    
    setIsLoading(true);
    try {
      const state = await escrowApi.getLedgerState();
      setLedgerState(state);
    } catch (error) {
      console.error("Failed to get ledger state:", error);
      toast.error("Failed to get ledger state");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Escrow Contract
          </h1>
          <p className="text-gray-600">
            Deploy or join an escrow contract and manage escrows
          </p>
        </div>

        {/* Wallet Connection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {walletContext?.walletState.hasConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    Connected: {walletContext.walletState.address?.slice(0, 6)}...
                    {walletContext.walletState.address?.slice(-4)}
                  </Badge>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <Button
                  variant="outline"
                  onClick={walletContext.disconnect}
                  disabled={walletContext.walletState.isConnecting}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="w-5 h-5" />
                    Wallet not connected
                  </div>
                  <Button
                    onClick={walletContext?.connectToWalletAndInitializeProviders}
                    disabled={walletContext?.walletState.isConnecting}
                    className="gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    {walletContext?.walletState.isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </div>
                {walletContext?.walletState.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-800 font-semibold mb-1">
                          Connection Error
                        </p>
                        <p className="text-red-700 text-sm mb-2">
                          {walletContext.walletState.error}
                        </p>
                        {(walletContext.walletState.error.includes("Could not find") || 
                          walletContext.walletState.error.includes("Extension")) && (
                          <div className="text-red-600 text-sm">
                            <p className="font-semibold mb-1">To fix this:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Install the Midnight Lace wallet extension</li>
                              <li>Enable the extension in your browser</li>
                              <li>Refresh this page and try connecting again</li>
                            </ol>
                          </div>
                        )}
                        {walletContext.walletState.error.includes("not authorized") && (
                          <div className="text-red-600 text-sm">
                            <p className="font-semibold mb-1">To fix this:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Open the Midnight Lace wallet extension</li>
                              <li>Authorize this application</li>
                              <li>Try connecting again</li>
                            </ol>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={walletContext.clearError}
                        className="text-red-600 hover:text-red-700"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Operations Section */}
        {walletContext?.walletState.hasConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Operations</CardTitle>
              <CardDescription>
                Deploy a new escrow contract or join an existing one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deploy Contract */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Deploy New Contract</h3>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleDeployContract}
                    disabled={isDeploying || !!escrowApi}
                    className="gap-2"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Deploy Contract
                      </>
                    )}
                  </Button>
                  {contractAddress && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Contract: {contractAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Contract */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Join Existing Contract</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="join-address">Contract Address</Label>
                    <Input
                      id="join-address"
                      placeholder="Enter contract address..."
                      value={joinAddress}
                      onChange={(e) => setJoinAddress(e.target.value)}
                      disabled={isJoining || !!escrowApi}
                    />
                  </div>
                  <Button
                    onClick={handleJoinContract}
                    disabled={isJoining || !!escrowApi || !joinAddress.trim()}
                    className="gap-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Contract"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Escrow Section */}
        {escrowApi && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Create Escrow
              </CardTitle>
              <CardDescription>
                Create a new escrow for a contributor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contributor">Contributor Address (ZswapCoinPublicKey)</Label>
                <Input
                  id="contributor"
                  placeholder="Enter contributor address..."
                  value={contributorAddress}
                  onChange={(e) => setContributorAddress(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <Button
                onClick={handleCreateEscrow}
                disabled={isCreating || !contributorAddress.trim() || !amount.trim()}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Escrow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Escrows List */}
        {escrowApi && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Escrows
              </CardTitle>
              <CardDescription>
                List of all escrows in the contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                </div>
              ) : escrows.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No escrows found
                </div>
              ) : (
                <div className="space-y-4">
                  {escrows.map((escrow) => (
                    <div
                      key={escrow.id.toString()}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">Escrow ID: {escrow.id.toString()}</p>
                        <p className="text-sm text-gray-600">
                          Amount: {escrow.amount.toString()}
                        </p>
                        <Badge
                          className={
                            escrow.state === "active"
                              ? "bg-blue-500"
                              : escrow.state === "released"
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }
                        >
                          {escrow.state}
                        </Badge>
                      </div>
                      {escrow.state === "active" && (
                        <Button
                          onClick={() => handleReleaseEscrow(Number(escrow.id))}
                          disabled={isReleasing === Number(escrow.id)}
                          className="gap-2"
                        >
                          {isReleasing === Number(escrow.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Releasing...
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              Release
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contract State Reading Section */}
        {escrowApi && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Contract State Reader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button
                  onClick={handleGetContractState}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Get Contract State
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGetLedgerState}
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Get Ledger State
                    </>
                  )}
                </Button>
              </div>

              {contractState && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">Contract State</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(contractState, null, 2)}
                  </pre>
                </div>
              )}

              {ledgerState && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-semibold text-green-800 mb-2">Ledger State</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(ledgerState, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscrowBoard;

