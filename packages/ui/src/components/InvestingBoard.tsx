import { Button } from "@/components/ui/button";
import * as uuid from "uuid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, Plus, Link, Loader2 } from "lucide-react";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import useDeployment from "@/hookes/useDeployment";
import ProjectBoard from "./ProjectBoard";
import { useState, type FormEvent } from "react";
import type { ChangeEvent } from "react";
import { nativeToken } from "@midnight-ntwrk/ledger";
import toast from "react-hot-toast";

export default function Component() {
  const walletContext = useMidnightWallet();
  const deploymentContext = useDeployment();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinAddress, setJoinAddress] = useState("");
  const [joinError, setJoinError] = useState("");

  const createProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData(e.currentTarget);
      const id = uuid.v4();
      if (projectImage) {
        localStorage.setItem(`project-image-${id}`, projectImage);
      }
      const txData = await deploymentContext?.tokenlessApi?.createProject(
        id,
        formData.get("title") as string,
        formData.get("description") as string,
        nativeToken(),
        Number(formData.get("duration")),
        Number(formData.get("target"))
      );

      if (txData?.public.status == "SucceedEntirely") {
        toast.success("Transaction successful");
        setIsOpen(false)
      } else {
        toast.error("Transaction Failed");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-purple-900 bg-clip-text text-transparent">
            Tokenless
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {walletContext?.walletState.hasConnected && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  {(deploymentContext?.hasJoined || deploymentContext?.hasDeployed) && (
                    <Button
                    onClick={() => setIsOpen(true)}
                      variant="outline"
                      className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                      disabled={isCreating}
                    >
                      <Plus className="w-4 h-4" />
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create project"
                      )}
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white/95 border-gray-300 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">
                      Create project
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Launch a new project easily and quickly
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createProject} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-800">
                        Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter project title"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-800">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your project"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-gray-800">
                        Image
                      </Label>
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                        disabled={isCreating}
                      />
                      {projectImage && (
                        <img src={projectImage} alt="Preview" className="mt-2 max-h-32 rounded-lg border" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="target" className="text-gray-800">
                          Investment goal (tDUST)
                        </Label>
                        <Input
                          id="target"
                          name="target"
                          type="number"
                          step="0.1"
                          placeholder="10.0"
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          disabled={isCreating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-gray-800">
                          Duration (days)
                        </Label>
                        <Input
                          id="duration"
                          name="duration"
                          type="number"
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                    <Button
                      disabled={isCreating}
                      type="submit"
                      className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                      >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create project"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {walletContext?.walletState.hasConnected ? (
              <div className="flex items-center gap-3">
                <Badge className="gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  {walletContext.walletState.address?.slice(0, 6)}...
                  {walletContext.walletState.address?.slice(-4)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={walletContext.disconnect}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  disabled={walletContext.walletState.isConnecting}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={walletContext?.connectToWalletAndInitializeProviders}
                className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                disabled={walletContext?.walletState.isConnecting}
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
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!walletContext?.walletState.hasConnected ? (
          <div className="text-center py-20">
            
            <h2 className="text-3xl font-bold mb-3 text-gray-900">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Connect your Web3 wallet (Lace Beta Wallet) to start tokenizing real-world assets or investing in active tokenization projects on Midnight.
            </p>
            <Button
              onClick={walletContext?.connectToWalletAndInitializeProviders}
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
              disabled={walletContext?.walletState.isConnecting}
            >
              <Wallet className="w-5 h-5" />
              {walletContext?.walletState.isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </div>
        ) : (
          <div>
            {!deploymentContext?.hasJoined && !deploymentContext?.hasDeployed ? (
              <div className="text-center py-20">
                
                <h2 className="text-3xl font-bold mb-3 text-gray-900">
                  Start Tokenizing with Tokenless Today
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Choose to join an existing contract or deploy a new one for your tokenization project.
                </p>
                
                {/* Error display */}
                {deploymentContext?.error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{deploymentContext.error}</p>
                    <Button
                      onClick={deploymentContext.clearError}
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-400 hover:text-red-300"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {/* Join Existing Contract */}
                  <Button
                    onClick={() => setShowJoinInput((v) => !v)}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                    disabled={deploymentContext?.isJoining || deploymentContext?.isDeploying}
                  >
                    <Link className="w-5 h-5" />
                    Join Existing Contract
                  </Button>
                  {/* Deploy New Contract */}
                  <Button
                    onClick={deploymentContext?.onDeployContract}
                    size="lg"
                    variant="outline"
                    className="gap-3 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 px-8 py-3"
                    disabled={deploymentContext?.isJoining || deploymentContext?.isDeploying}
                  >
                    <Plus className="w-5 h-5" />
                    {deploymentContext?.isDeploying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deploying new contract...
                      </>
                    ) : (
                      "Deploy New Contract"
                    )}
                  </Button>
                </div>
                {showJoinInput && (
                  <div className="flex flex-col items-center gap-2 mt-6 mb-2">
                    <input
                      type="text"
                      placeholder="Enter contract address"
                      value={joinAddress}
                      onChange={e => setJoinAddress(e.target.value)}
                      className="border px-2 py-1 rounded w-80"
                    />
                    <Button
                      onClick={async () => {
                        setJoinError("");
                        if (!joinAddress || joinAddress.length < 10) {
                          setJoinError("Invalid contract address");
                          return;
                        }
                        try {
                          await deploymentContext?.onJoinContract(joinAddress);
                        } catch (err) {
                          setJoinError("Failed to join contract");
                        }
                      }}
                      size="sm"
                      className="bg-blue-700 text-white"
                      disabled={deploymentContext?.isJoining || deploymentContext?.isDeploying}
                    >
                      {deploymentContext?.isJoining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join"
                      )}
                    </Button>
                    {joinError && <span className="text-red-500 text-sm">{joinError}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Contract Info Section */}
                {(deploymentContext?.hasJoined || deploymentContext?.hasDeployed) && deploymentContext?.deployedContractAddress && (
                  <div className="mb-6 p-4 bg-white/80 border border-zinc-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {deploymentContext.hasDeployed ? "New Contract Deployed" : "Connected to Contract"}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Contract Address: {deploymentContext.deployedContractAddress}
                        </p>
                      </div>
                      <Badge className={`gap-2 px-3 py-1 ${
                        deploymentContext.hasDeployed 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          deploymentContext.hasDeployed ? "bg-emerald-400" : "bg-blue-400"
                        }`}></div>
                        {deploymentContext.hasDeployed ? "New" : "Existing"}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="mb-10">
                  <h2 className="text-4xl font-bold mb-3 text-gray-900">
                    Explore assets
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Privacy-first asset tokenization on Midnight — zk-proofs, no tokens, full security.
                  </p>
                  <ProjectBoard />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
