import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  CalendarDays, 
  TrendingUp, 
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { 
      path: "/dashboard", 
      label: "Dashboard", 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      path: "/candidates", 
      label: "Candidates", 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: "/requirements", 
      label: "Requirements", 
      icon: <Briefcase className="h-5 w-5" /> 
    },
    { 
      path: "/interviews", 
      label: "Interviews", 
      icon: <CalendarDays className="h-5 w-5" /> 
    },
    { 
      path: "/reports", 
      label: "Reports", 
      icon: <TrendingUp className="h-5 w-5" /> 
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  return (
    <aside className={cn(
      "bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
        <div className={cn(
          "flex items-center space-x-2",
          collapsed && "justify-center w-full"
        )}>
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          {!collapsed && <h1 className="font-bold text-lg">TalentViz</h1>}
        </div>
        <button 
          className="text-slate-500 hover:text-primary-500"
          onClick={onToggle}
        >
          <ChevronLeft className={cn(
            "h-5 w-5 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>
      
      <div className="py-4 flex flex-col h-[calc(100vh-64px)] justify-between">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center px-2 py-2 rounded-md font-medium",
                location === item.path 
                  ? "text-primary-500 bg-primary-50" 
                  : "text-slate-600 hover:bg-primary-50 hover:text-primary-500",
                collapsed ? "justify-center" : ""
              )}>
                {item.icon}
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </a>
            </Link>
          ))}
        </nav>
        
        {!collapsed && user && (
          <div className="px-4 mt-6">
            <div className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center mb-3">
                <UserAvatar 
                  fullName={user.fullName}
                  avatarUrl={user.avatar}
                  size="sm"
                />
                <div className="ml-3">
                  <h4 className="font-medium text-sm">{user.fullName}</h4>
                  <span className="text-xs text-slate-500">
                    {user.role === "admin" ? "Administrator" : 
                     user.role === "manager" ? "Recruitment Manager" : 
                     "Recruiter"}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full py-1.5 text-sm"
                onClick={logout}
              >
                Log out
              </Button>
            </div>
          </div>
        )}
        
        {collapsed && user && (
          <div className="px-2 mt-6 flex justify-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="text-slate-500 hover:text-primary-500"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
