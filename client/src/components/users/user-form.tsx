import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Extend the user schema with client-side validation
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "recruiter"]),
});

// Type for the form values
type UserFormValues = z.infer<typeof userFormSchema>;

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface UserFormProps {
  onSuccess: () => void;
  editUser: User | null;
}

export function UserForm({ onSuccess, editUser }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // If we're editing a user, we don't require a password
  const formSchema = editUser
    ? userFormSchema.omit({ password: true }).extend({
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
      })
    : userFormSchema;

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: editUser
      ? {
          username: editUser.username,
          fullName: editUser.fullName,
          email: editUser.email,
          role: editUser.role,
          password: "", // Empty password field for editing
        }
      : {
          username: "",
          password: "",
          fullName: "",
          email: "",
          role: "recruiter", // Default role
        },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values: any) => {
      // Remove password if empty
      const payload = { ...values };
      if (payload.password === "") {
        payload.password = undefined;
      }
      const res = await apiRequest("PATCH", `/api/users/${editUser?.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: UserFormValues) {
    if (editUser) {
      // If password is empty, remove it from the payload
      const payload = { ...values };
      if (payload.password === "") {
        payload.password = undefined;
      }
      // Make sure we're not sending the ID in the payload
      // @ts-ignore - id might be present in values if form has any
      if (payload.id) {
        // @ts-ignore - we know this might exist
        delete payload.id;
      }
      updateUserMutation.mutate(payload);
    } else {
      // For new users, make sure no ID field is sent
      // @ts-ignore - id might be present in values if form has any
      const { id, ...valuesWithoutId } = values as any;
      createUserMutation.mutate(valuesWithoutId);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This will be used for login
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{editUser ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
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
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This defines what permissions the user will have
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
          >
            {createUserMutation.isPending || updateUserMutation.isPending
              ? "Saving..."
              : editUser
              ? "Update User"
              : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}