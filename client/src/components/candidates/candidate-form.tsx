import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCandidateSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the candidate schema with client-side validation
const candidateFormSchema = insertCandidateSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  experience: z.number().min(0, "Experience cannot be negative").optional(),
});

// Form values type
type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  onSuccess: () => void;
  requirementId: number;
}

export function CandidateForm({ onSuccess, requirementId }: CandidateFormProps) {
  const { toast } = useToast();

  // Fetch stages for the first stage selection
  const { data: stages = [] } = useQuery({
    queryKey: ["/api/stages"],
  });

  // Get the first stage (usually "Applied") to set as default
  const firstStage = stages.length > 0 ? 
    stages.find((stage: any) => stage.isDefault) || stages[0] : 
    null;

  // Form setup
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      currentTitle: "",
      experience: 0,
      requirementId: requirementId,
      currentStageId: firstStage?.id || 0,
      skills: [],
      status: "active",
    },
  });

  // Update the currentStageId when stages are loaded
  React.useEffect(() => {
    if (firstStage) {
      form.setValue("currentStageId", firstStage.id);
    }
  }, [firstStage, form]);

  // Create candidate mutation
  const createCandidateMutation = useMutation({
    mutationFn: async (values: CandidateFormValues) => {
      // Format the skills input from comma-separated string to array if needed
      if (typeof values.skills === "string") {
        values.skills = (values.skills as string)
          .split(",")
          .map(skill => skill.trim())
          .filter(Boolean);
      }

      const res = await apiRequest("POST", "/api/candidates", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate created",
        description: "Candidate has been added successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create candidate",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: CandidateFormValues) {
    createCandidateMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Title</FormLabel>
                <FormControl>
                  <Input placeholder="Senior Developer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentStageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Stage</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString() || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id.toString()}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Initial recruitment stage for this candidate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Java, SQL, React (comma separated)" 
                  {...field} 
                  value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Enter skills separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resumeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/resume.pdf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional information about this candidate" 
                  className="min-h-24" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createCandidateMutation.isPending}
          >
            {createCandidateMutation.isPending ? "Submitting..." : "Add Candidate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}