import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { formatDateDisplay, formatDuration, statusColors } from "@/lib/utils";
import { Clock, Users, Briefcase, Link, MoreVertical } from "lucide-react";
import { Link as RouterLink } from "wouter";

interface InterviewCardProps {
  interview: any;
  candidates: any[];
  requirements: any[];
  users: any[];
}

export function InterviewCard({
  interview,
  candidates,
  requirements,
  users
}: InterviewCardProps) {
  // Find related candidate and requirement
  const candidate = candidates.find(c => c.id === interview.candidateId);
  const requirement = requirements.find(r => r.id === interview.requirementId);
  
  // Get interviewer data
  const interviewers = interview.interviewers.map((id: number) => {
    const user = users.find(u => u.id === id);
    return user || { id, fullName: "Unknown User" };
  });
  
  // Format interview type for display
  const formatInterviewType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5 pt-5">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className={`bg-${getInterviewTypeColor(interview.type)}-100 text-${getInterviewTypeColor(interview.type)}-600`}>
            {formatInterviewType(interview.type)}
          </Badge>
          <Badge variant="outline" className={`bg-${statusColors[interview.status]}-100 text-${statusColors[interview.status]}-600`}>
            {formatStatusLabel(interview.status)}
          </Badge>
        </div>
        
        <div className="flex items-center mb-4">
          <UserAvatar 
            fullName={candidate?.name || "Unknown Candidate"}
            size="md"
            className="mr-3"
          />
          <div>
            <h3 className="font-semibold text-slate-800">{candidate?.name || "Unknown Candidate"}</h3>
            <p className="text-sm text-slate-500">{candidate?.currentTitle || "Candidate"}</p>
          </div>
        </div>
        
        <div className="text-sm text-slate-600 space-y-2 mb-4">
          <div className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
            <span>{requirement?.title || "Unknown Position"}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-400" />
            <span>{formatDateDisplay(interview.scheduledTime)}</span>
          </div>
          <div className="flex items-center">
            <Link className="w-4 h-4 mr-2 text-slate-400" />
            <span>{formatDuration(interview.duration)}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-slate-400" />
            <span>
              {interviewers.length > 0 
                ? `${interviewers.length} interviewer${interviewers.length > 1 ? 's' : ''}`
                : "No interviewers assigned"}
            </span>
          </div>
        </div>
        
        {interview.location && (
          <div className="p-2 bg-slate-50 rounded text-sm text-slate-600 mb-2">
            <p>{interview.location}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-5 py-3 border-t border-slate-100 flex justify-between">
        <RouterLink href={`/interviews/${interview.id}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </RouterLink>
        
        {interview.status === "scheduled" && (
          <div className="flex space-x-2">
            <RouterLink href={`/interviews/${interview.id}/feedback`}>
              <Button size="sm">Add Feedback</Button>
            </RouterLink>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function getInterviewTypeColor(type: string): string {
  const colors: Record<string, string> = {
    screening: "purple",
    technical: "green",
    hr: "blue",
    cultural: "amber",
    final: "blue"
  };
  return colors[type] || "slate";
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    canceled: "Canceled",
    "no-show": "No Show"
  };
  return labels[status] || status;
}
