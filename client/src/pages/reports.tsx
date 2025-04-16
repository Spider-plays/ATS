import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function Reports() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState("30"); // 30, 90, 365 days
  const [reportType, setReportType] = useState("overview");

  // Fetch candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: !!user,
  });

  // Fetch requirements
  const { data: requirements, isLoading: isLoadingRequirements } = useQuery({
    queryKey: ["/api/requirements"],
    enabled: !!user,
  });

  // Fetch stages
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ["/api/stages"],
    enabled: !!user,
  });

  // Fetch dashboard stats for overview metrics
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  // Mock time-based data that would come from the API in a real implementation
  const generateTimeData = () => {
    const days = parseInt(timePeriod);
    const data = [];
    const now = new Date();
    
    // Generate daily data points for the selected period
    for (let i = days; i >= 0; i -= Math.ceil(days / 10)) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        applications: Math.floor(Math.random() * 20) + 5,
        interviews: Math.floor(Math.random() * 10) + 1,
        hires: Math.floor(Math.random() * 3)
      });
    }
    
    return data;
  };

  // Generate data based on stages using real candidates data
  const generateStageData = () => {
    if (!candidates || !stages) return [];
    
    return stages.map(stage => {
      const count = candidates.filter((c: any) => c.currentStageId === stage.id).length;
      return {
        name: stage.name,
        value: count,
        fill: getStageColor(stage.name)
      };
    });
  };

  // Generate data for time to fill by department
  const generateTimeToFillData = () => {
    if (!requirements) return [];
    
    const departments = [...new Set(requirements.map((r: any) => r.department))];
    
    return departments.map(dept => {
      // In a real implementation, this would be calculated from actual hires
      return {
        name: dept,
        avgDays: Math.floor(Math.random() * 25) + 10
      };
    });
  };

  // Calculate conversion rates between stages
  const generateConversionData = () => {
    if (!stages) return [];
    
    const conversions = [];
    
    for (let i = 0; i < stages.length - 1; i++) {
      if (stages[i].name === "Rejected") continue;
      
      conversions.push({
        name: `${stages[i].name} → ${stages[i+1].name}`,
        rate: Math.floor(Math.random() * 40) + 20
      });
    }
    
    return conversions;
  };

  // Loading state
  const isLoading = isLoadingCandidates || isLoadingRequirements || isLoadingStages || isLoadingStats;

  if (isLoading) {
    return (
      <MainLayout title="Reports">
        <div className="p-10 text-center text-slate-500">Loading report data...</div>
      </MainLayout>
    );
  }

  const timeData = generateTimeData();
  const stageData = generateStageData();
  const timeToFillData = generateTimeToFillData();
  const conversionData = generateConversionData();

  return (
    <MainLayout title="Reports">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <Tabs value={reportType} onValueChange={setReportType} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Reports */}
      {reportType === "overview" && (
        <div className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader className="p-6 border-b border-slate-200">
              <CardTitle className="font-semibold text-slate-800">Recruitment Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#0047AB" strokeWidth={2} />
                    <Line type="monotone" dataKey="interviews" stroke="#6C63FF" strokeWidth={2} />
                    <Line type="monotone" dataKey="hires" stroke="#FF6B6B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Candidates by Stage</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Average Time to Fill by Department</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeToFillData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="avgDays" fill="#0047AB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pipeline Analysis */}
      {reportType === "pipeline" && (
        <div className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader className="p-6 border-b border-slate-200">
              <CardTitle className="font-semibold text-slate-800">Stage Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 120,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                    <Bar dataKey="rate" fill="#6C63FF">
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate > 50 ? '#4CAF50' : entry.rate > 30 ? '#FF9800' : '#F44336'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Time Spent in Each Stage</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stages.map((stage: any) => ({
                        name: stage.name,
                        days: Math.floor(Math.random() * 8) + 2
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="days" fill="#0047AB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Drop-off Reasons</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Skills Mismatch', value: 40, fill: '#F44336' },
                          { name: 'Salary Expectations', value: 25, fill: '#FF9800' },
                          { name: 'Cultural Fit', value: 15, fill: '#2196F3' },
                          { name: 'Better Offer', value: 10, fill: '#9C27B0' },
                          { name: 'Location', value: 10, fill: '#4CAF50' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Efficiency Metrics */}
      {reportType === "efficiency" && (
        <div className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader className="p-6 border-b border-slate-200">
              <CardTitle className="font-semibold text-slate-800">Recruitment Efficiency Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeData.map(item => ({
                      ...item,
                      costPerHire: Math.floor(Math.random() * 2000) + 1000,
                      timeToFill: Math.floor(Math.random() * 10) + 20
                    }))}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="costPerHire" name="Cost per Hire ($)" stroke="#FF6B6B" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="timeToFill" name="Time to Fill (days)" stroke="#0047AB" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Interviews per Hire</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Engineering', interviews: 6.2 },
                        { name: 'Marketing', interviews: 4.8 },
                        { name: 'Design', interviews: 5.5 },
                        { name: 'Sales', interviews: 3.7 },
                        { name: 'HR', interviews: 4.1 }
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="interviews" fill="#6C63FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader className="p-6 border-b border-slate-200">
                <CardTitle className="font-semibold text-slate-800">Application to Offer Ratio</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Engineering', ratio: 15.3 },
                        { name: 'Marketing', ratio: 12.7 },
                        { name: 'Design', ratio: 18.2 },
                        { name: 'Sales', ratio: 10.4 },
                        { name: 'HR', ratio: 8.9 }
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}:1`, 'Applications per Offer']} />
                      <Bar dataKey="ratio" fill="#0047AB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// Helper function to get consistent colors for stages
function getStageColor(stageName: string): string {
  const colorMap: Record<string, string> = {
    "Applied": "#0047AB",
    "Screening": "#6C63FF",
    "Interview": "#38B2AC",
    "Offer": "#F59E0B",
    "Hired": "#10B981",
    "Rejected": "#6B7280"
  };

  return colorMap[stageName] || "#6B7280";
}
