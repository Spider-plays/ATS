import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { formatDateDisplay } from "@/lib/utils";
import { Clock, CalendarDays, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import { Interview, Candidate } from "@shared/schema";

interface UpcomingInterviewsProps {
  interviews: (Interview & { candidate: Candidate })[];
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border border-slate-200">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold text-slate-800">Upcoming Interviews</CardTitle>
          <Link href="/interviews">
            <a className="text-sm text-primary-500 hover:text-primary-600 font-medium">View all</a>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 divide-y divide-slate-100">
        {interviews.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No upcoming interviews
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="p-4 flex items-center">
              <UserAvatar 
                fullName={interview.candidate.name}
                size="lg"
                className="mr-4 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-slate-800 truncate">{interview.candidate.name}</h4>
                  <Badge variant="outline" className={`text-xs bg-${getInterviewTypeColor(interview.type)}-100 text-${getInterviewTypeColor(interview.type)}-600 px-2 py-0.5 rounded-full`}>
                    {getInterviewTypeLabel(interview.type)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 truncate">{interview.candidate.currentTitle || "Candidate"}</p>
                <div className="flex mt-1 text-xs text-slate-500">
                  <div className="flex items-center mr-3">
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    {formatDateDisplay(interview.scheduledTime)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {interview.duration} minutes
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="ml-4 text-slate-400 hover:text-primary-500">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
      
      <CardFooter className="p-4 text-center border-t border-slate-200">
        <Link href="/interviews/schedule">
          <Button variant="link" className="text-sm text-primary-500 font-medium hover:text-primary-600">
            Schedule New Interview
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function getInterviewTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    screening: "Screening",
    technical: "Technical",
    hr: "HR",
    cultural: "Cultural",
    final: "Final"
  };
  return labels[type] || type;
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
