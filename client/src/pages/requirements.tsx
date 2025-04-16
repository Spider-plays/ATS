import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequirementCard } from "@/components/requirements/requirement-card";
import { RequirementForm } from "@/components/requirements/requirement-form";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Requirement } from "@shared/schema";
import { Search, Plus, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Requirements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Check if user can create requirements (admin or manager)
  const canCreateRequirement = user?.role === "admin" || user?.role === "manager";

  // Fetch requirements
  const { data: requirements, isLoading } = useQuery({
    queryKey: ["/api/requirements"],
    enabled: !!user,
  });

  // Mutation for approving/changing requirement status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/requirements/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
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

  // Filter requirements
  const filteredRequirements = React.useMemo(() => {
    if (!requirements) return [];

    return requirements.filter((req: Requirement) => {
      // Filter by status if not "all"
      const statusMatch = statusFilter === "all" || req.status === statusFilter;
      
      // Filter by department if not "all"
      const departmentMatch = departmentFilter === "all" || req.department === departmentFilter;
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = req.title.toLowerCase().includes(searchLower);
      const descMatch = req.description.toLowerCase().includes(searchLower);
      const skillsMatch = req.skills.some(skill => 
        skill.toLowerCase().includes(searchLower)
      );
      
      return statusMatch && departmentMatch && (titleMatch || descMatch || skillsMatch);
    });
  }, [requirements, statusFilter, departmentFilter, searchQuery]);

  // Group requirements by status for tabs
  const requirementsByStatus = React.useMemo(() => {
    if (!filteredRequirements) return { draft: [], pending: [], approved: [], closed: [] };
    
    return {
      draft: filteredRequirements.filter((r: Requirement) => r.status === "draft"),
      pending: filteredRequirements.filter((r: Requirement) => r.status === "pending"),
      approved: filteredRequirements.filter((r: Requirement) => r.status === "approved"),
      closed: filteredRequirements.filter((r: Requirement) => r.status === "closed")
    };
  }, [filteredRequirements]);

  // Get unique departments for filter
  const departments = React.useMemo(() => {
    if (!requirements) return [];
    
    const deptSet = new Set<string>();
    requirements.forEach((req: Requirement) => {
      deptSet.add(req.department);
    });
    
    return Array.from(deptSet);
  }, [requirements]);

  // Handle approving a requirement
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <MainLayout title="Requirements">
        <div className="p-10 text-center text-slate-500">Loading requirements...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Requirements">
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 p-6 border-b border-slate-200">
          <CardTitle className="font-semibold text-slate-800">Job Requirements</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search requirements..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canCreateRequirement && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Requirement
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="approved">
            <TabsList>
              <TabsTrigger value="approved">
                Approved ({requirementsByStatus.approved.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Approval ({requirementsByStatus.pending.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({requirementsByStatus.draft.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({requirementsByStatus.closed.length})
              </TabsTrigger>
            </TabsList>
            
            {Object.entries(requirementsByStatus).map(([status, reqs]) => (
              <TabsContent key={status} value={status} className="mt-4">
                {reqs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    No {status} requirements match your filters
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {reqs.map((requirement: Requirement) => (
                      <RequirementCard 
                        key={requirement.id} 
                        requirement={requirement}
                        onStatusChange={handleStatusChange}
                        userRole={user?.role || ""}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Requirement Creation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle>Create New Requirement</DialogTitle>
          <DialogDescription>
            Define the details for this job requirement. Once created, it will need to be approved before candidates can be associated with it.
          </DialogDescription>
          <RequirementForm 
            onSuccess={() => {
              setDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
            }}
            userId={user?.id || 0}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
