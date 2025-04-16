import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CandidateCard } from "@/components/candidates/candidate-card";
import { UserPlus } from "lucide-react";
import { Link } from "wouter";
import { Stage, Candidate } from "@shared/schema";

interface RecruitmentPipelineProps {
  stages: Stage[];
  candidatesByStage: Record<number, Candidate[]>;
  filter: string;
  onFilterChange: (value: string) => void;
}

export function RecruitmentPipeline({
  stages,
  candidatesByStage,
  filter,
  onFilterChange
}: RecruitmentPipelineProps) {
  return (
    <Card className="border border-slate-200 lg:col-span-2">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold text-slate-800">Recruitment Pipeline</CardTitle>
          <div className="flex space-x-2">
            <Select value={filter} onValueChange={onFilterChange}>
              <SelectTrigger className="text-sm border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 h-auto">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/candidates/new">
              <Button size="sm" className="text-sm flex items-center">
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage.id} className="w-64 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-slate-700">{stage.name}</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-medium rounded px-2 py-0.5">
                  {candidatesByStage[stage.id]?.length || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                {candidatesByStage[stage.id]?.slice(0, 2).map((candidate) => (
                  <CandidateCard 
                    key={candidate.id} 
                    candidate={candidate} 
                    draggable 
                  />
                ))}
                
                {(candidatesByStage[stage.id]?.length || 0) > 2 && (
                  <div className="text-center py-1">
                    <span className="text-xs text-slate-500">
                      + {candidatesByStage[stage.id].length - 2} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
