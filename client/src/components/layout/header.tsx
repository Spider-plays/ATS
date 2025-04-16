import React, { useState } from "react";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { BellIcon, UserIcon, Settings, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white h-16 border-b border-slate-200 flex items-center px-6">
      <div className="flex-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent-500"></span>
            </Button>
            
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 w-80 z-10"
                onBlur={() => setShowNotifications(false)}
              >
                <div className="p-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <a href="#" className="block p-4 hover:bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-800">New candidate application</p>
                        <p className="text-xs text-slate-500 mt-1">Sarah Chen applied for Senior UX Designer</p>
                        <p className="text-xs text-slate-400 mt-1">10 minutes ago</p>
                      </div>
                    </div>
                  </a>
                  {/* Add more notifications */}
                </div>
                <div className="p-3 text-center border-t border-slate-200">
                  <Link href="/notifications">
                    <a className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                      View all notifications
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 hover:bg-slate-100 p-1.5 rounded">
                  <UserAvatar 
                    fullName={user.fullName}
                    avatarUrl={user.avatar}
                    size="sm"
                  />
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex items-center w-full cursor-pointer">
                      <UserIcon className="h-4 w-4 mr-2 text-slate-500" />
                      Profile
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex items-center w-full cursor-pointer">
                      <Settings className="h-4 w-4 mr-2 text-slate-500" />
                      Settings
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2 text-slate-500" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
