import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(fullName: string): string {
  if (!fullName) return "";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function formatDateDisplay(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, "h:mm a")}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow, ${format(dateObj, "h:mm a")}`;
  } else {
    return format(dateObj, "MMM d, yyyy");
  }
}

export function formatTimeAgo(date: Date | string): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function truncateString(str: string, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

export function calculateCompletionPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
  }
}

export const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Recruitment Manager",
  recruiter: "Recruiter"
};

export const stageColors: Record<string, string> = {
  "Applied": "blue",
  "Screening": "purple",
  "Interview": "green",
  "Offer": "blue",
  "Hired": "green",
  "Rejected": "slate"
};

export const priorityColors: Record<string, string> = {
  low: "blue",
  medium: "green",
  high: "amber",
  urgent: "red"
};

export const statusColors: Record<string, string> = {
  active: "green",
  hired: "blue",
  rejected: "slate",
  withdrawn: "red",
  draft: "slate",
  pending: "amber",
  approved: "green",
  closed: "slate",
  scheduled: "green",
  completed: "blue",
  canceled: "red",
  "no-show": "amber"
};
