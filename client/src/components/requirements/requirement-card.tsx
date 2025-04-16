import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Requirement } from "@shared/schema";
import { priorityColors, statusColors, getInitials } from "@/lib/utils";
import { Link } from "wouter";
import { Briefcase, MapPin, Clock, MoreVertical, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface RequirementCardProps {
  requirement: Requirement;
  onStatusChange: (id: number, status: string) => void;
  userRole: string;
}

export function RequirementCard({ requirement, onStatusChange, userRole }: RequirementCardProps) {
  // Check if user can approve requirements (admin or manager)
  const canApproveRequirement = userRole === "admin" || userRole === "manager";
  
  // Format date
  const formattedDate = new Date(requirement.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Fetch assigned recruiters
  const { data: assignedRecruiters = [] } = useQuery({
    queryKey: [`/api/requirements/${requirement.id}/recruiters`],
    enabled: !!requirement.id,
  });
  
  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5 pt-5">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`bg-${priorityColors[requirement.priority]}-100 text-${priorityColors[requirement.priority]}-600`}>
            {requirement.priority.charAt(0).toUpperCase() + requirement.priority.slice(1)} Priority
          </Badge>
          <Badge variant="outline" className={`bg-${statusColors[requirement.status]}-100 text-${statusColors[requirement.status]}-600`}>
            {requirement.status.charAt(0).toUpperCase() + requirement.status.slice(1)}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg text-slate-800 mb-2">{requirement.title}</h3>
        
        <div className="text-sm text-slate-600 space-y-2 mb-4">
          <div className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
            <span>{requirement.department}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <span>{requirement.location}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-400" />
            <span>Created on {formattedDate}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-sm text-slate-700 mb-1">Required Skills:</h4>
          <div className="flex flex-wrap gap-1">
            {requirement.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-slate-100">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-3 mb-2">
          {requirement.description}
        </p>
      </CardContent>
      
      <CardFooter className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/requirements/${requirement.id}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
          
          {assignedRecruiters && assignedRecruiters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignedRecruiters.map((recruiter: any) => (
                <div key={recruiter.id} className="flex items-center bg-slate-100 rounded-full px-2 py-1">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarFallback className="text-xs">
                      {getInitials(recruiter.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm mr-1">{recruiter.fullName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
    {requirement.assignedRecruiters && requirement.assignedRecruiters.length > 0 && (
      <div className="flex -space-x-2">
        {requirement.assignedRecruiters.map((recruiter, index) => (
          <Avatar key={recruiter.id} className="border-2 border-white h-8 w-8">
            <AvatarFallback className="bg-slate-100 text-xs">
              {getInitials(recruiter.fullName)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    )}
    
    {canApproveRequirement && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {requirement.status === "draft" && (
                <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "pending")}>
                  Submit for Approval
                </DropdownMenuItem>
              )}
              
              {requirement.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "approved")}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Approve Requirement
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "draft")}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Reject & Return to Draft
                  </DropdownMenuItem>
                </>
              )}

              {requirement.status === "approved" && (
                <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "closed")}>
                  Close Requirement
                </DropdownMenuItem>
              )}

              {requirement.status === "closed" && (
                <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "approved")}>
                  Reopen Requirement
                </DropdownMenuItem>
              )}
              
              {requirement.status === "approved" && (
                <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "closed")}>
                  Close Requirement
                </DropdownMenuItem>
              )}
              
              {requirement.status === "closed" && (
                <DropdownMenuItem onClick={() => onStatusChange(requirement.id, "approved")}>
                  Reopen Requirement
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </CardFooter>
    </Card>
  );
}
