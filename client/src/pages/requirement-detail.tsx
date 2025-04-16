import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Requirement, Candidate } from "@shared/schema";
import { priorityColors, statusColors, getInitials } from "@/lib/utils";
import { Briefcase, MapPin, Clock, Users, ArrowLeft, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { Checkbox } from "@/components/ui/checkbox"; // Added import


export default function RequirementDetail() {
  const { id } = useParams<{ id: string }>();
  const requirementId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");

  // Check permissions
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isRecruiter = user?.role === "recruiter";
  const canManageRequirement = isAdmin || isManager;

  // Fetch requirement details
  const { data: requirement, isLoading: loadingRequirement } = useQuery({
    queryKey: [`/api/requirements/${requirementId}`],
    enabled: !!requirementId && !!user,
    onError: () => {
      toast({
        title: "Error",
        description: "Requirement not found or you don't have access",
        variant: "destructive"
      });
      navigate("/requirements");
    }
  });

  // Fetch candidates for this requirement
  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: [`/api/candidates?requirementId=${requirementId}`],
    enabled: !!requirementId && !!user,
  });

  // Fetch recruiters for assignment
  const { data: recruiters = [], isLoading: loadingRecruiters } = useQuery({
    queryKey: ["/api/users?role=recruiter"],
    enabled: canManageRequirement,
  });

  // Fetch assigned recruiters
  const { data: assignedRecruiters = [], isLoading: loadingAssignedRecruiters } = useQuery({
    queryKey: [`/api/requirements/${requirementId}/recruiters`],
    enabled: !!requirementId && !!user,
  });

  // Mutation for approving/changing requirement status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/requirements/${requirementId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/requirements/${requirementId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      toast({
        title: "Requirement updated",
        description: "Requirement status was successfully updated.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error updating requirement",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for assigning recruiters
  const assignRecruiterMutation = useMutation({
    mutationFn: async (recruiterId: number) => {
      const res = await apiRequest("POST", `/api/requirements/${requirementId}/recruiters`, { 
        recruiterId 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/requirements/${requirementId}/recruiters`] });
      toast({
        title: "Recruiter assigned",
        description: "Recruiter was successfully assigned to this requirement.",
      });
      setAssignDialogOpen(false);
      setSelectedRecruiter("");
    },
    onError: (err) => {
      toast({
        title: "Error assigning recruiter",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing assigned recruiters
  const removeRecruiterMutation = useMutation({
    mutationFn: async (recruiterId: number) => {
      await apiRequest("DELETE", `/api/requirements/${requirementId}/recruiters/${recruiterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/requirements/${requirementId}/recruiters`]);
      toast({
        title: "Recruiter removed",
        description: "Recruiter was successfully removed from this requirement.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error removing recruiter",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handle assign recruiter
  const handleAssignRecruiter = () => {
    if (!selectedRecruiter) return;
    assignRecruiterMutation.mutate(parseInt(selectedRecruiter));
  };

  // Check if current recruiter is assigned to this requirement
  const isAssignedRecruiter = assignedRecruiters.some(
    (recruiter: any) => recruiter.id === user?.id
  );

  // Check if candidate can be added
  const canAddCandidate = (isAdmin || isManager || isRecruiter) && requirement?.status === "approved";

  // Group candidates by status
  const candidatesByStatus = React.useMemo(() => {
    if (!candidates) return { active: [], hired: [], rejected: [] };

    return {
      active: candidates.filter((c: Candidate) => c.status === "active"),
      hired: candidates.filter((c: Candidate) => c.status === "hired"),
      rejected: candidates.filter((c: Candidate) => 
        c.status === "rejected" || c.status === "withdrawn"
      )
    };
  }, [candidates]);

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loadingRequirement) {
    return (
      <MainLayout>
        <div className="p-10 text-center text-slate-500">Loading requirement details...</div>
      </MainLayout>
    );
  }

  if (!requirement) {
    return (
      <MainLayout>
        <div className="p-10 text-center text-slate-500">Requirement not found</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumbs / Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/requirements")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Requirements
            </Button>
          </div>

          <div className="flex space-x-2">
            {canManageRequirement && requirement.status === "approved" && (
              <>
                <Button onClick={() => setAssignDialogOpen(true)} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Recruiters
                </Button>
                {assignedRecruiters.length > 0 && (
                  <Button 
                    onClick={() => setAssignDialogOpen(true)} 
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Remove Recruiters
                  </Button>
                )}
              </>
            )}

            {canAddCandidate && (
              <Button onClick={() => setAddCandidateOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            )}

            {canManageRequirement && (
              <>
                {requirement.status === "draft" && (
                  <Button onClick={() => handleStatusChange("pending")}>
                    Submit for Approval
                  </Button>
                )}

                {requirement.status === "pending" && (
                  <>
                    <Button 
                      onClick={() => handleStatusChange("approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange("draft")}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Return to Draft
                    </Button>
                  </>
                )}

                {requirement.status === "approved" && (
                  <Button 
                    onClick={() => handleStatusChange("closed")}
                    variant="outline"
                  >
                    Close Requirement
                  </Button>
                )}

                {requirement.status === "closed" && (
                  <Button 
                    onClick={() => handleStatusChange("approved")}
                    variant="outline"
                  >
                    Reopen Requirement
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Requirement Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">{requirement.title}</CardTitle>
                <CardDescription>{requirement.department} • {requirement.location}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline" className={`bg-${priorityColors[requirement.priority]}-100 text-${priorityColors[requirement.priority]}-600`}>
                  {requirement.priority.charAt(0).toUpperCase() + requirement.priority.slice(1)} Priority
                </Badge>
                <Badge variant="outline" className={`bg-${statusColors[requirement.status]}-100 text-${statusColors[requirement.status]}-600`}>
                  {requirement.status.charAt(0).toUpperCase() + requirement.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Experience and created date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">Experience Required</div>
                  <div className="font-medium">{requirement.experience} Years</div>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">Location</div>
                  <div className="font-medium">{requirement.location}</div>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">Created On</div>
                  <div className="font-medium">{formatDate(requirement.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {requirement.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Job Description</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {requirement.description}
              </p>
            </div>

            {/* Assigned Recruiters */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Assigned Recruiters
                </CardTitle>
                <CardDescription>
                  Recruiters who are currently assigned to work on this requirement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssignedRecruiters ? (
                  <div className="text-center py-4 text-slate-500">Loading recruiters...</div>
                ) : assignedRecruiters.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No recruiters have been assigned yet</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedRecruiters.map((recruiter: any) => (
                      <div key={recruiter.id} className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-primary/10">{getInitials(recruiter.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{recruiter.fullName}</div>
                          <div className="text-sm text-slate-500">{recruiter.email}</div>
                        </div>
                        {canManageRequirement && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => {
                              removeRecruiterMutation.mutate(recruiter.id, {
                                onSuccess: () => {
                                  queryClient.invalidateQueries([`/api/requirements/${requirementId}/recruiters`]);
                                }
                              });
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Candidates Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Candidates
              </CardTitle>
              {canAddCandidate && (
                <Button size="sm" onClick={() => setAddCandidateOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loadingCandidates ? (
              <div className="text-center py-10 text-slate-500">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No candidates have been added to this requirement yet
              </div>
            ) : (
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({candidatesByStatus.active.length})
                  </TabsTrigger>
                  <TabsTrigger value="hired">
                    Hired ({candidatesByStatus.hired.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected/Withdrawn ({candidatesByStatus.rejected.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                  {candidatesByStatus.active.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      No active candidates found
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <table className="w-full divide-y">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {candidatesByStatus.active.map((candidate: Candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-slate-900">{candidate.name}</div>
                                    <div className="text-sm text-slate-500">{candidate.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                <Badge variant="outline" className="bg-blue-50 text-blue-600">
                                  In Process
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {candidate.experience} years
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/candidates/${candidate.id}`}>
                                  <Button size="sm" variant="outline">View Profile</Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hired" className="mt-4">
                  {candidatesByStatus.hired.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      No hired candidates found
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <table className="w-full divide-y">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {candidatesByStatus.hired.map((candidate: Candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-slate-900">{candidate.name}</div>
                                    <div className="text-sm text-slate-500">{candidate.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className="bg-green-100 text-green-600">Hired</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {candidate.experience} years
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/candidates/${candidate.id}`}>
                                  <Button size="sm" variant="outline">View Profile</Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="mt-4">
                  {candidatesByStatus.rejected.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      No rejected candidates found
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <table className="w-full divide-y">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {candidatesByStatus.rejected.map((candidate: Candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-slate-900">{candidate.name}</div>
                                    <div className="text-sm text-slate-500">{candidate.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className="bg-red-100 text-red-600">
                                  {candidate.status === "rejected" ? "Rejected" : "Withdrawn"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {candidate.experience} years
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/candidates/${candidate.id}`}>
                                  <Button size="sm" variant="outline">View Profile</Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Candidate Dialog */}
      <Dialog open={addCandidateOpen} onOpenChange={setAddCandidateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>
              Add a new candidate to this requirement. The candidate will enter the recruitment process at the first stage.
            </DialogDescription>
          </DialogHeader>
          <CandidateForm 
            onSuccess={() => {
              setAddCandidateOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/candidates?requirementId=${requirementId}`] });
            }}
            requirementId={requirementId}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Recruiter Dialog */}
      {canManageRequirement && (
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Recruiter</DialogTitle>
              <DialogDescription>
                Assign recruiters to work on this requirement. Assigned recruiters will be able to add and manage candidates.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {recruiters.map((recruiter: any) => {
                const isAssigned = assignedRecruiters?.some(
                  (r: any) => r.id === recruiter.id
                );
                return (
                  <div key={recruiter.id} className="flex items-center mb-2">
                    <Checkbox 
                      checked={isAssigned}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          assignRecruiterMutation.mutate(recruiter.id, {
                            onSuccess: () => {
                              queryClient.invalidateQueries([`/api/requirements/${requirementId}/recruiters`]);
                            }
                          });
                        } else {
                          removeRecruiterMutation.mutate(recruiter.id, {
                            onSuccess: () => {
                              queryClient.invalidateQueries([`/api/requirements/${requirementId}/recruiters`]);
                            }
                          });
                        }
                      }}
                    />
                    <span className="ml-2">{recruiter.fullName} ({recruiter.email})</span>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setAssignDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}