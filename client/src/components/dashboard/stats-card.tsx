import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  trend,
  subtitle,
  className,
  icon
}: StatsCardProps) {
  return (
    <Card className={cn("border border-slate-200", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-slate-500 text-sm">{title}</h3>
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded",
              trend.positive 
                ? "text-green-500 bg-green-50" 
                : "text-red-500 bg-red-50"
            )}>
              {trend.value} {trend.positive ? "↑" : "↓"}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-slate-800">{value}</p>
            {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
          </div>
          {icon && (
            <div>{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
