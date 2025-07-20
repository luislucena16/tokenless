import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Calendar,
  Pen,
  CheckCircle,
  Coins,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  type DerivedProject,
  type DerivedTokenlessContractState,
} from "@tokenless/tokenless-api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { DialogHeader } from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import useDeployment from "@/hookes/useDeployment";
import React, { useEffect, useState } from "react";
import { calculateExpiryDate } from "@/lib/actions";
import { Textarea } from "./ui/textarea";
import { ProjectStatus } from "@tokenless/tokenless-contract";
import { Progress } from "@radix-ui/react-progress";
import { toast } from "react-hot-toast";
import { uint8arraytostring } from "../../../api/dist/utils";
import type { ChangeEvent } from "react";

// Utilidad para obtener la imagen de localStorage
function getProjectImage(projectId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`project-image-${projectId}`);
}

const ProjectBoard = React.memo(() => {
  const deploymentContext = useDeployment();
  const [projects, setProjects] = useState<DerivedProject[] | []>([]);
  const [isDonatingId, setIsDonatingId] = useState<string | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [isWithdrawingId, setIsWithdrawingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnding, setIsEnding] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState<string | null>(null);
  const [isCanceliing, setIsCanceliing] = useState<string | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);

  const deploymentProvider = deploymentContext?.tokenlessApi;

  useEffect(() => {
    if (!deploymentProvider) return;

    setIsLoading(true);
    const stateSubscription = deploymentProvider.state.subscribe(
      (state: DerivedTokenlessContractState) => {
        setProjects(state.projects ?? []);
        setIsLoading(false);
      }
    );

    return () => {
      stateSubscription.unsubscribe();
    };
  }, [deploymentProvider]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-600">
        <svg
          className="w-16 h-16 mb-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-semibold">No projects found</p>
        <p className="text-sm mt-2">Start a new project to see it here.</p>
      </div>
    );
  }

  // Handler para cambio de imagen en edición
  function handleEditImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 bg-white/80 border-gray-200 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-300 group"
        >
          <CardHeader className="pb-4">
            {getProjectImage(project.id) ? (
              <img src={getProjectImage(project.id) as string} alt="Project" className="w-full h-40 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-lg mb-3 text-gray-400">
                No image
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2 items-center">
                <Button
                  onClick={async () => {
                    setIsWithdrawingId(project.id);
                    try {
                      const txData =
                        await deploymentContext?.tokenlessApi?.withdrawProjectFunds(
                          project.id
                        );
                      setIsWithdrawingId(null);
                      if (txData?.public.status == "SucceedEntirely") {
                        toast.success("Transaction successful");
                      } else {
                        toast.error("Transaction Failed");
                      }
                    } catch (error) {
                      const errMsg =
                        error instanceof Error
                          ? error.message
                          : "Failed to withdraw";
                      toast.error(errMsg);
                      setIsWithdrawingId(null);
                    }
                  }}
                  variant="outline"
                  className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                  disabled={
                    isWithdrawingId === project.id ||
                    project.project.status == ProjectStatus.closed ||
                    project.project.status == ProjectStatus.withdrawn
                  }
                >
                  <Coins className="w-4 h-4" />
                  {isWithdrawingId === project.id ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Withdrawing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                      disabled={
                        isRefunding === project.id ||
                        project.project.status == ProjectStatus.closed ||
                        project.project.status == ProjectStatus.withdrawn
                      }
                    >
                      <Coins className="w-4 h-4" />
                      {isRefunding === project.id ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4" />
                          Refunding...
                        </>
                      ) : (
                        "Requet refund"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="bg-white/95 border-zinc-700/50 backdrop-blur-xl z-[9999] fixed inset-0 flex items-center justify-center"
                    style={{ padding: 0 }}
                  >
                    <div className="w-full max-w-md mx-auto p-6 bg-white/95 border-zinc-700/50 rounded-lg shadow-lg">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">
                          Request refund from project
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Sends back part or all of your asset deposited into
                          the project (ONLY active projects).
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setIsRefunding(project.id);
                          const formData = new FormData(e.currentTarget);
                          try {
                            const txData =
                              await deploymentContext?.tokenlessApi?.requestRefund(
                                project.id,
                                Number(formData.get("refund_amount")),
                                Number(formData.get("deposit"))
                              );
                            setIsRefunding(null);
                            if (txData?.public.status == "SucceedEntirely") {
                              toast.success("Transaction successful");
                            } else {
                              toast.error("Transaction Failed");
                            }
                          } catch (error) {
                            const errMsg =
                              error instanceof Error
                                ? error.message
                                : "Failed to Refund";
                            toast.error(errMsg);
                            setIsRefunding(null);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-gray-800">
                              Amount to refund
                            </Label>
                            <Input
                              id="refund_amount"
                              name="refund_amount"
                              placeholder="0 tDUST"
                              type="number"
                              required
                              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="description"
                              className="text-gray-800"
                            >
                              How much did you deposit
                            </Label>
                            <Input
                              id="deposit"
                              name="deposit"
                              placeholder="0 tDUST"
                              type="number"
                              required
                              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                        </div>
                        <Button
                          disabled={isRefunding === project.id}
                          type="submit"
                          className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                        >
                          {isRefunding === project.id ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4 mr-2" />
                              Requesting...
                            </>
                          ) : (
                            "Request"
                          )}
                        </Button>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {project.project.status == ProjectStatus.closed ||
              project.project.status == ProjectStatus.withdrawn ? (
                <span className="p-1 bg-red-500 rounded-full"></span>
              ) : (
                <span className="p-1 bg-green-500 rounded-full"></span>
              )}
            </div>
            <span className="p-2 rounded-3xl text-gray-900 w-max border border-gray-200 mb-4">{`0x${uint8arraytostring(project.project.owner).slice(0, 8)}...`}</span>
            <CardTitle className="line-clamp-2 text-gray-900 text-xl">
              {project.project.title}
            </CardTitle>
            <CardDescription className="line-clamp-3 text-gray-600 leading-relaxed">
              {project.project.desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-zinc-800">
                  {project.project.raised} tDUST raised
                </span>
                <span className="text-gray-500">
                  {project.project.investmentGoal} tDUST goal
                </span>
              </div>
              <Progress
                value={
                  Number(project.project.investmentGoal) === 0
                    ? 0
                    : Math.floor(
                        (Number(project.project.raised) * 100) /
                          Number(project.project.investmentGoal)
                      )
                }
                className="h-2 bg-gray-200 relative overflow-hidden rounded"
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-800 to-purple-900 transition-all duration-300"
                  style={{
                    width: `${
                      Number(project.project.investmentGoal) === 0
                        ? 0
                        : Math.floor(
                            (Number(project.project.raised) * 100) /
                              Number(project.project.investmentGoal)
                          )
                    }%`,
                  }}
                />
              </Progress>
            </div>

            <div className="flex flex-col text-sm text-gray-600">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{project.project.investors} investors</span>
                </div>
                <div className=" flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      setIsEnding(project.id + "-end");
                      try {
                        const txData =
                          await deploymentContext?.tokenlessApi?.endProject(
                            project.id
                          );
                        setIsEnding(null);
                        if (txData?.public.status == "SucceedEntirely") {
                          toast.success("Transaction successful");
                        } else {
                          toast.error("Transaction Failed");
                        }
                      } catch (error) {
                        const errMsg =
                          error instanceof Error
                            ? error.message
                            : "Failed to end project";
                        toast.error(errMsg);
                        setIsEnding(null);
                      }
                    }}
                    variant="outline"
                    className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                    disabled={
                      isEnding === project.id + "-end" ||
                      project.project.status == ProjectStatus.closed ||
                      project.project.status == ProjectStatus.withdrawn
                    }
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isEnding === project.id + "-end" ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Ending...
                      </>
                    ) : (
                      "End"
                    )}
                  </Button>

                  <Button
                    onClick={async () => {
                      setIsCanceliing(project.id + "-end");
                      try {
                        const txData =
                          await deploymentContext?.tokenlessApi?.cancelProject(
                            project.id
                          );
                        setIsCanceliing(null);
                        if (txData?.public.status == "SucceedEntirely") {
                          toast.success("Transaction successful");
                        } else {
                          toast.error("Transaction Failed");
                        }
                      } catch (error) {
                        const errMsg =
                          error instanceof Error
                            ? error.message
                            : "Failed to end project";
                        toast.error(errMsg);
                        setIsCanceliing(null);
                      }
                    }}
                    variant="outline"
                    className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                    disabled={
                      isCanceliing === project.id + "-end" ||
                      project.project.status == ProjectStatus.closed ||
                      project.project.status == ProjectStatus.withdrawn
                    }
                  >
                    {isCanceliing === project.id + "-end" ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                      </>
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {calculateExpiryDate(
                      Number(project.project.duration),
                      Number(project.project.creationDate)
                    )}
                  </span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    {(deploymentContext?.hasJoined || deploymentContext?.hasDeployed) && (
                      <Button
                        disabled={
                          project.project.status == ProjectStatus.closed ||
                          project.project.status == ProjectStatus.withdrawn
                        }
                        variant="outline"
                        className="gap-2 bg-white/80 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 backdrop-blur-sm"
                      >
                        <Pen className="w-4 h-4" />
                        Edit
                      </Button>
                    )}
                  </DialogTrigger>
                  <DialogContent
                    className="bg-white/95 border-zinc-700/50 backdrop-blur-xl z-[9999] fixed inset-0 flex items-center justify-center"
                    style={{ padding: 0 }}
                  >
                    <div className="w-full max-w-md mx-auto p-6 bg-white/95 border-zinc-700/50 rounded-lg shadow-lg">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">
                          Edit project 
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Update project goal, image and duration.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setIsEditingId(project.id);
                          const formData = new FormData(e.currentTarget);
                          try {
                            if (editImage) {
                              localStorage.setItem(`project-image-${project.id}`, editImage);
                            }
                            const txData = await deploymentContext?.tokenlessApi?.updateProject(
                              project.id,
                              formData.get("title") as string,
                              formData.get("description") as string,
                              Number(formData.get("target")),
                              Number(formData.get("duration"))
                            );
                            if (txData?.public.status == "SucceedEntirely") {
                              toast.success("Transaction successful");
                            } else {
                              toast.error("Transaction Failed");
                            }
                            setIsEditingId(null);
                          } catch (error) {
                            const errMsg =
                              error instanceof Error
                                ? error.message
                                : "Failed to Edit Project";
                            toast.error(errMsg);
                            setIsEditingId(null);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-gray-800">
                            Title
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            placeholder={project.project.title}
                            required
                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="text-gray-800"
                          >
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder={project.project.desc}
                            required
                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          />
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deadline" className="text-gray-800">
                              Duration (No. of days)
                            </Label>
                            <Input
                              id="duration"
                              name="duration"
                              type="number"
                              required
                              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-image" className="text-gray-800">
                            Image
                          </Label>
                          <Input
                            id="edit-image"
                            name="edit-image"
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageChange}
                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          />
                          {(editImage || getProjectImage(project.id)) && (
                            <img src={editImage || getProjectImage(project.id) as string} alt="Preview" className="mt-2 max-h-32 rounded-lg border" />
                          )}
                        </div>
                        <Button
                          disabled={isEditingId === project.id}
                          type="submit"
                          className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                          >
                          {isEditingId === project.id ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4 mr-2" />
                              Editing...
                            </>
                          ) : (
                            "Edit"
                          )}
                        </Button>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="pt-3 space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={
                      isDonatingId === project.id ||
                      project.project.status == ProjectStatus.closed ||
                      project.project.status == ProjectStatus.withdrawn
                    }
                    className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                  >
                    {isDonatingId === project.id ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        investing...
                      </>
                    ) : (
                      "Invest"
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white/95 border-gray-300 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">
                      Invest to {project.project.title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Enter the amount you'd like to invest to this project.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsDonatingId(project.id);
                      const formData = new FormData(e.currentTarget);
                      const amount = Number.parseFloat(
                        formData.get("amount") as string
                      );
                      try {
                        const txData =
                          await deploymentContext?.tokenlessApi?.investProject(
                            project.id,
                            amount
                          );
                        if (txData?.public.status == "SucceedEntirely") {
                          toast.success("Transaction successful");
                        } else {
                          toast.error("Transaction Failed");
                        }
                        setIsDonatingId(null);
                      } catch (error) {
                        const errMsg =
                          error instanceof Error
                            ? error.message
                            : "Failed to Invest";
                        toast.error(errMsg);
                        setIsDonatingId(null);
                      }
                      console.log(amount);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-gray-800">
                        Amount (tDUST)
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="5"
                        placeholder="5"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                      />
                    </div>
                    <Button
                      disabled={isDonatingId === project.id}
                      type="submit"
                      className="gap-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg"
                      >
                      {isDonatingId === project.id ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                          Sending funds...
                        </>
                      ) : (
                        "Invest now"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default ProjectBoard;
