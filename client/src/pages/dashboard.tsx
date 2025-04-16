import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecruitmentPipeline } from "@/components/dashboard/recruitment-pipeline";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { UpcomingInterviews } from "@/components/dashboard/upcoming-interviews";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useAuth } from "@/hooks/use-auth";
import { Stage, Candidate } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30");

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  // Fetch stages for pipeline
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ["/api/stages"],
    enabled: !!user,
  });

  // Fetch candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });

  // Fetch upcoming interviews
  const { data: upcomingInterviews, isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["/api/interviews?upcoming=true"],
    enabled: !!user,
  });

  // Group candidates by stage
  const candidatesByStage = React.useMemo(() => {
    if (!candidates || !stages) return {};
    
    const groupedCandidates: Record<number, Candidate[]> = {};
    
    stages.forEach((stage: Stage) => {
      groupedCandidates[stage.id] = candidates.filter(
        (candidate: Candidate) => candidate.currentStageId === stage.id
      );
    });
    
    return groupedCandidates;
  }, [candidates, stages]);

  // Prepare analytics data
  const analyticsData = React.useMemo(() => {
    if (!dashboardStats) {
      return {
        data: [],
        total: 0
      };
    }
    
    const stageCounts = dashboardStats.candidates.byStage;
    const total = dashboardStats.candidates.total;
    
    const colors = ["#0047AB", "#6C63FF", "#FF6B6B", "#38B2AC", "#4F46E5", "#D97706"];
    
    return {
      data: stageCounts.map((stageCount: any, index: number) => ({
        name: stageCount.stageName,
        value: stageCount.count,
        color: colors[index % colors.length]
      })),
      total
    };
  }, [dashboardStats]);

  // Mock activity data (would come from API in real implementation)
  const activities = [
    {
      id: 1,
      type: "hired" as const,
      title: "Thomas Parker accepted offer",
      description: "Data Scientist position offer accepted with start date Oct 15",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: "applied" as const,
      title: "Priya Sharma applied for Product Manager",
      description: "Candidate submitted application through careers page",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: "feedback" as const,
      title: "Interview feedback submitted",
      description: "Alex submitted feedback for James Lee's technical interview",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: "requirement" as const,
      title: "New requirement created",
      description: "Marketing team created a new requirement for Social Media Manager",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      type: "withdrawn" as const,
      title: "Candidate withdrew application",
      description: "Jason Wong withdrew application for Frontend Developer role",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Format interviews with candidate data
  const formattedInterviews = React.useMemo(() => {
    if (!upcomingInterviews || !candidates) return [];
    
    return upcomingInterviews.slice(0, 3).map((interview: any) => {
      const candidate = candidates.find((c: Candidate) => c.id === interview.candidateId);
      return {
        ...interview,
        candidate: candidate || { name: "Unknown Candidate" }
      };
    });
  }, [upcomingInterviews, candidates]);

  // Loading states
  if (isLoadingStats || isLoadingStages || isLoadingCandidates || isLoadingInterviews) {
    return (
      <MainLayout title="Dashboard" subtitle={`Welcome back, ${user?.fullName?.split(' ')[0]}`}>
        <div className="p-10 text-center text-slate-500">Loading dashboard data...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle={`Welcome back, ${user?.fullName?.split(' ')[0]}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Active Candidates"
          value={dashboardStats?.candidates.active || 0}
          trend={{ value: "+12%", positive: true }}
          subtitle={`${dashboardStats?.candidates.hired || 0} hired this month`}
          icon={
            <div className="h-12 flex items-end">
              <div className="w-2 h-4 bg-primary-200 rounded-sm mr-1"></div>
              <div className="w-2 h-6 bg-primary-300 rounded-sm mr-1"></div>
              <div className="w-2 h-8 bg-primary-400 rounded-sm mr-1"></div>
              <div className="w-2 h-12 bg-primary-500 rounded-sm"></div>
            </div>
          }
        />
        
        <StatsCard
          title="Open Positions"
          value={dashboardStats?.requirements.open || 0}
          trend={{ value: "+5%", positive: true }}
          subtitle={`${dashboardStats?.requirements.urgent || 0} urgent priority`}
          icon={
            <div className="h-12 flex items-end">
              <div className="w-2 h-5 bg-secondary-200 rounded-sm mr-1"></div>
              <div className="w-2 h-9 bg-secondary-300 rounded-sm mr-1"></div>
              <div className="w-2 h-7 bg-secondary-400 rounded-sm mr-1"></div>
              <div className="w-2 h-12 bg-secondary-500 rounded-sm"></div>
            </div>
          }
        />
        
        <StatsCard
          title="Avg. Time to Fill"
          value={<>24<span className="text-lg font-normal">days</span></>}
          trend={{ value: "+3 days", positive: false }}
          subtitle="Industry avg: 28 days"
          icon={
            <div className="flex -space-x-1">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs text-green-600 font-medium">8d</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs text-blue-600 font-medium">12d</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xs text-purple-600 font-medium">4d</span>
              </div>
            </div>
          }
        />
        
        <StatsCard
          title="Interviews This Week"
          value={dashboardStats?.interviews.upcoming || 0}
          trend={{ value: "-2%", positive: false }}
          subtitle={`${dashboardStats?.interviews.today || 0} today`}
          icon={
            <div className="flex items-center">
              <div className="flex flex-col items-center mr-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-accent-200 rounded-full"></div>
                  <div className="w-2 h-2 bg-accent-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Today</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-accent-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Tomorrow</p>
              </div>
            </div>
          }
        />
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Pipeline */}
        <RecruitmentPipeline
          stages={stages || []}
          candidatesByStage={candidatesByStage}
          filter={filter}
          onFilterChange={setFilter}
        />
        
        {/* Recruitment Analytics */}
        <AnalyticsChart
          data={analyticsData.data}
          title="Recruitment Analytics"
          total={analyticsData.total}
          period={analyticsPeriod}
          onPeriodChange={setAnalyticsPeriod}
        />
      </div>
      
      {/* Upcoming Interviews & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <UpcomingInterviews interviews={formattedInterviews} />
        <RecentActivity activities={activities} />
      </div>
    </MainLayout>
  );
}
