import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterviewCard } from "@/components/interviews/interview-card";
import { ScheduleForm } from "@/components/interviews/schedule-form";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Calendar } from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

export default function Interviews() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch interviews
  const { data: interviews, isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["/api/interviews"],
    enabled: !!user,
  });

  // Fetch candidates for dropdown
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });

  // Fetch requirements for dropdown
  const { data: requirements, isLoading: isLoadingRequirements } = useQuery({
    queryKey: ["/api/requirements"],
    enabled: !!user,
  });

  // Filter interviews by search query
  const filteredInterviews = React.useMemo(() => {
    if (!interviews || !candidates) return [];

    return interviews.filter((interview: any) => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      
      // Find candidate for this interview
      const candidate = candidates.find((c: any) => c.id === interview.candidateId);
      
      // Search by candidate name, interview type, or date
      const nameMatch = candidate?.name.toLowerCase().includes(searchLower) || false;
      const typeMatch = interview.type.toLowerCase().includes(searchLower);
      const dateMatch = formatDateDisplay(interview.scheduledTime).toLowerCase().includes(searchLower);
      
      return nameMatch || typeMatch || dateMatch;
    });
  }, [interviews, candidates, searchQuery]);

  // Group interviews by status
  const interviewsByStatus = React.useMemo(() => {
    if (!filteredInterviews) return { scheduled: [], completed: [], canceled: [] };
    
    return {
      scheduled: filteredInterviews.filter((i: any) => i.status === "scheduled"),
      completed: filteredInterviews.filter((i: any) => i.status === "completed"),
      canceled: filteredInterviews.filter((i: any) => i.status === "canceled" || i.status === "no-show")
    };
  }, [filteredInterviews]);

  const isLoading = isLoadingInterviews || isLoadingCandidates || isLoadingRequirements;

  if (isLoading) {
    return (
      <MainLayout title="Interviews">
        <div className="p-10 text-center text-slate-500">Loading interviews...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Interviews">
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 p-6 border-b border-slate-200">
          <CardTitle className="font-semibold text-slate-800">Interview Schedule</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search interviews..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="scheduled">
            <TabsList>
              <TabsTrigger value="scheduled">
                Scheduled ({interviewsByStatus.scheduled.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({interviewsByStatus.completed.length})
              </TabsTrigger>
              <TabsTrigger value="canceled">
                Canceled ({interviewsByStatus.canceled.length})
              </TabsTrigger>
            </TabsList>
            
            {Object.entries(interviewsByStatus).map(([status, ints]) => (
              <TabsContent key={status} value={status} className="mt-4">
                {ints.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    No {status} interviews found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ints.map((interview: any) => (
                      <InterviewCard 
                        key={interview.id} 
                        interview={interview} 
                        candidates={candidates}
                        requirements={requirements}
                        users={[]} // Would be fetched in a real implementation
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Interview Scheduling Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule a new interview with a candidate. Make sure to select the appropriate
            interviewers and provide all necessary details.
          </DialogDescription>
          <ScheduleForm 
            candidates={candidates || []}
            requirements={requirements || []}
            users={[]} // Would be fetched in a real implementation
            onSuccess={() => {
              setDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
