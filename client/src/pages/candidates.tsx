import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateCard } from "@/components/candidates/candidate-card";
import { UserPlus, Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Candidate, Stage } from "@shared/schema";

export default function Candidates() {
  const { user } = useAuth();
  const [filterStage, setFilterStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Fetch candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });
  
  // Fetch stages for filtering
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ["/api/stages"],
    enabled: !!user,
  });
  
  // Filter candidates based on stage and search query
  const filteredCandidates = React.useMemo(() => {
    if (!candidates) return [];
    
    return candidates.filter((candidate: Candidate) => {
      // Filter by stage if not "all"
      const stageMatch = filterStage === "all" || candidate.currentStageId === parseInt(filterStage);
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = candidate.name.toLowerCase().includes(searchLower);
      const titleMatch = candidate.currentTitle?.toLowerCase().includes(searchLower) || false;
      const skillsMatch = candidate.skills?.some(skill => 
        skill.toLowerCase().includes(searchLower)
      ) || false;
      
      return stageMatch && (nameMatch || titleMatch || skillsMatch);
    });
  }, [candidates, filterStage, searchQuery]);
  
  // Group candidates by status for tabs
  const candidatesByStatus = React.useMemo(() => {
    if (!filteredCandidates) return { active: [], hired: [], rejected: [] };
    
    return {
      active: filteredCandidates.filter((c: Candidate) => c.status === "active"),
      hired: filteredCandidates.filter((c: Candidate) => c.status === "hired"),
      rejected: filteredCandidates.filter((c: Candidate) => c.status === "rejected" || c.status === "withdrawn")
    };
  }, [filteredCandidates]);
  
  if (isLoadingCandidates || isLoadingStages) {
    return (
      <MainLayout title="Candidates">
        <div className="p-10 text-center text-slate-500">Loading candidates...</div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Candidates">
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 p-6 border-b border-slate-200">
          <CardTitle className="font-semibold text-slate-800">All Candidates</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages?.map((stage: Stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active ({candidatesByStatus.active.length})
              </TabsTrigger>
              <TabsTrigger value="hired">
                Hired ({candidatesByStatus.hired.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({candidatesByStatus.rejected.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {candidatesByStatus.active.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No active candidates match your filters
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {candidatesByStatus.active.map((candidate: Candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="hired" className="mt-4">
              {candidatesByStatus.hired.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hired candidates match your filters
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {candidatesByStatus.hired.map((candidate: Candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-4">
              {candidatesByStatus.rejected.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No rejected candidates match your filters
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {candidatesByStatus.rejected.map((candidate: Candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
