import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { Candidate } from "@shared/schema";
import { formatTimeAgo, stageColors, truncateString } from "@/lib/utils";
import { Clock, GripHorizontal } from "lucide-react";
import { Link } from "wouter";

interface CandidateCardProps {
  candidate: Candidate;
  draggable?: boolean;
}

export function CandidateCard({ candidate, draggable = false }: CandidateCardProps) {
  return (
    <Link href={`/candidates/${candidate.id}`}>
      <Card 
        className={`bg-white rounded border border-slate-200 p-3 shadow-sm hover:shadow transition-shadow ${draggable ? "cursor-move" : "cursor-pointer"}`}
      >
        {draggable && (
          <div className="absolute top-2 right-2 text-slate-300 hover:text-slate-400">
            <GripHorizontal className="h-4 w-4" />
          </div>
        )}
        
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-slate-800">{candidate.name}</h4>
          <Badge variant="outline" className={`text-xs bg-${getStatusColor(candidate.status)}-100 text-${getStatusColor(candidate.status)}-700`}>
            {getStatusLabel(candidate.status)}
          </Badge>
        </div>
        
        <p className="text-xs text-slate-500 mb-2">{candidate.currentTitle || "Not specified"}</p>
        
        <div className="flex items-center text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5 mr-1" />
          {formatTimeAgo(candidate.createdAt)}
        </div>
        
        <div className="flex mt-2 justify-between">
          <div className="flex -space-x-1">
            {/* In real app, fetch assignees */}
            <UserAvatar fullName="Recruiter" size="sm" className="w-5 h-5" />
          </div>
          
          {candidate.matchPercentage && (
            <div className="flex">
              <span className={`bg-${getMatchColor(candidate.matchPercentage)}-100 rounded-full h-1.5 w-1.5 mt-1.5 mr-1`}></span>
              <span className={`text-xs text-${getMatchColor(candidate.matchPercentage)}-600`}>
                {candidate.matchPercentage}% match
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    hired: "Hired",
    rejected: "Rejected",
    withdrawn: "Withdrawn"
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "blue",
    hired: "green",
    rejected: "slate",
    withdrawn: "red"
  };
  return colors[status] || "slate";
}

function getMatchColor(percentage: number): string {
  if (percentage >= 90) return "green";
  if (percentage >= 70) return "amber";
  return "red";
}
