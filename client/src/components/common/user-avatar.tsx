import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ 
  fullName, 
  avatarUrl, 
  className,
  size = "md" 
}: UserAvatarProps) {
  const initials = getInitials(fullName);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  };
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
