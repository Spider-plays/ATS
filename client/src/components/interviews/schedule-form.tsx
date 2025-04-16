import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertInterviewSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Candidate, Requirement } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extend the insert schema with specific client-side validation
const scheduleFormSchema = insertInterviewSchema.omit({
  scheduledTime: true,
}).extend({
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time",
  }),
  interviewers: z.array(z.number()).min(1, "Please select at least one interviewer"),
  // Interviewers is already an array in the schema
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  candidates: Candidate[];
  requirements: Requirement[];
  users: any[]; // Would be more specific in a real implementation
  onSuccess: () => void;
}

export function ScheduleForm({
  candidates,
  requirements,
  users,
  onSuccess,
}: ScheduleFormProps) {
  const { toast } = useToast();

  // Mock interviewers for the demo
  const mockInterviewers = [
    { id: 1, fullName: "Alex Morgan", role: "Manager" },
    { id: 2, fullName: "Robin Taylor", role: "Recruiter" },
    { id: 3, fullName: "Jamie Smith", role: "Technical Lead" },
    { id: 4, fullName: "Casey Johnson", role: "Senior Developer" },
  ];

  const interviewers = users.length > 0 ? users : mockInterviewers;

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      candidateId: 0,
      requirementId: 0,
      date: undefined,
      time: "",
      duration: 60,
      interviewers: [],
      type: "screening",
      location: "",
      status: "scheduled",
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      // Combine date and time into scheduledTime
      const { date, time, ...rest } = values;
      const [hours, minutes] = time.split(":").map(Number);
      
      const scheduledTime = new Date(date);
      scheduledTime.setHours(hours, minutes);
      
      const interviewData = {
        ...rest,
        scheduledTime: scheduledTime.toISOString(),
      };
      
      const res = await apiRequest("POST", "/api/interviews", interviewData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Interview scheduled",
        description: "The interview has been scheduled successfully.",
      });
      form.reset();
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: "Error scheduling interview",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ScheduleFormValues) {
    scheduleInterviewMutation.mutate(values);
  }

  // Generate time options for the select field
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="candidateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Candidate</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id.toString()}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="requirementId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Position</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {requirements.map((req) => (
                    <SelectItem key={req.id} value={req.id.toString()}>
                      {req.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-slate-400"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {format(
                          new Date(`2000-01-01T${time}`),
                          "h:mm a"
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="cultural">Cultural Fit</SelectItem>
                    <SelectItem value="final">Final Round</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="interviewers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interviewers</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value.length && "text-slate-400"
                      )}
                    >
                      {field.value.length > 0
                        ? `${field.value.length} interviewer${field.value.length > 1 ? "s" : ""} selected`
                        : "Select interviewers"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search interviewers..." />
                    <CommandList>
                      <CommandEmpty>No interviewers found.</CommandEmpty>
                      <CommandGroup>
                        {interviewers.map((interviewer) => {
                          const isSelected = field.value.includes(interviewer.id);
                          return (
                            <CommandItem
                              key={interviewer.id}
                              value={interviewer.fullName}
                              onSelect={() => {
                                const updated = isSelected
                                  ? field.value.filter((id) => id !== interviewer.id)
                                  : [...field.value, interviewer.id];
                                field.onChange(updated);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{interviewer.fullName}</span>
                                <span className="text-xs text-slate-500">{interviewer.role}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the team members who will conduct this interview
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Conference Room A or Zoom Meeting Link" {...field} />
              </FormControl>
              <FormDescription>
                Enter the physical location or virtual meeting link
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="submit"
            disabled={scheduleInterviewMutation.isPending}
          >
            {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
