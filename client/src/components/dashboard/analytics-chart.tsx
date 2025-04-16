import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AnalyticsChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title: string;
  total: number;
  period: string;
  onPeriodChange: (period: string) => void;
}

export function AnalyticsChart({ data, title, total, period, onPeriodChange }: AnalyticsChartProps) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold text-slate-800">{title}</CardTitle>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-fit text-sm border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 h-auto">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} (${((value / total) * 100).toFixed(0)}%)`, ""]}
                contentStyle={{ borderRadius: "6px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
