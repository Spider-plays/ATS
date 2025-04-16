import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { formatTimeAgo } from "@/lib/utils";
import { 
  CheckCircle, 
  UserPlus, 
  MessageSquare, 
  AlertTriangle, 
  X 
} from "lucide-react";

interface Activity {
  id: number;
  type: "hired" | "applied" | "feedback" | "requirement" | "withdrawn";
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border border-slate-200">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold text-slate-800">Recent Activity</CardTitle>
          <Link href="/activity">
            <a className="text-sm text-primary-500 hover:text-primary-600 font-medium">View all</a>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="relative">
          <div className="border-l-2 border-slate-200 ml-3">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pb-5">
                <div className={`absolute -left-3.5 top-0 w-6 h-6 ${getActivityIconBackground(activity.type)} rounded-full border-2 border-white flex items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="ml-6">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-slate-800">{activity.title}</h4>
                    <span className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityIconBackground(type: string): string {
  const backgrounds: Record<string, string> = {
    hired: "bg-green-500",
    applied: "bg-purple-500",
    feedback: "bg-blue-500",
    requirement: "bg-amber-500",
    withdrawn: "bg-red-500"
  };
  return backgrounds[type] || "bg-slate-500";
}

function getActivityIcon(type: string): React.ReactNode {
  const iconProps = { className: "h-3 w-3 text-white" };
  
  switch (type) {
    case "hired":
      return <CheckCircle {...iconProps} />;
    case "applied":
      return <UserPlus {...iconProps} />;
    case "feedback":
      return <MessageSquare {...iconProps} />;
    case "requirement":
      return <AlertTriangle {...iconProps} />;
    case "withdrawn":
      return <X {...iconProps} />;
    default:
      return null;
  }
}
