import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { roleLabels } from "@/lib/utils";
import { UserManagement } from "@/components/users/user-management";
import { Plus, ArrowUpDown, Edit } from "lucide-react";

// Form schemas
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  avatar: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const newUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["admin", "manager", "recruiter"])
});

const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  order: z.number().min(1, "Order must be at least 1"),
  isDefault: z.boolean().default(false)
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("profile");
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newStageDialogOpen, setNewStageDialogOpen] = useState(false);

  // Only admins can manage users and stages
  const isAdmin = user?.role === "admin";

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatar: user?.avatar || ""
    }
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // New user form
  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "recruiter"
    }
  });

  // New stage form
  const newStageForm = useForm<z.infer<typeof stageSchema>>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: "",
      order: 1,
      isDefault: false
    }
  });

  // Fetch users if admin
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && isAdmin,
  });

  // Fetch stages
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ["/api/stages"],
    enabled: !!user,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof newUserSchema>) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewUserDialogOpen(false);
      newUserForm.reset();
    },
    onError: (err) => {
      toast({
        title: "Error creating user",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Create stage mutation
  const createStageMutation = useMutation({
    mutationFn: async (stageData: z.infer<typeof stageSchema>) => {
      const res = await apiRequest("POST", "/api/stages", stageData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stage created",
        description: "The recruitment stage has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stages"] });
      setNewStageDialogOpen(false);
      newStageForm.reset();
    },
    onError: (err) => {
      toast({
        title: "Error creating stage",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Profile form submission
  function onProfileSubmit(data: z.infer<typeof profileSchema>) {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
    // In a real implementation, this would call an API to update the user profile
  }

  // Password form submission
  function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    passwordForm.reset();
    // In a real implementation, this would call an API to update the password
  }

  // New user form submission
  function onNewUserSubmit(data: z.infer<typeof newUserSchema>) {
    createUserMutation.mutate(data);
  }

  // New stage form submission
  function onNewStageSubmit(data: z.infer<typeof stageSchema>) {
    createStageMutation.mutate(data);
  }

  const isLoading = (isAdmin && isLoadingUsers) || isLoadingStages;

  return (
    <MainLayout title="Settings">
      <Card className="border border-slate-200">
        <CardHeader className="p-6 border-b border-slate-200">
          <CardTitle className="font-semibold text-slate-800">Account Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
              {isAdmin && <TabsTrigger value="stages">Recruitment Stages</TabsTrigger>}
            </TabsList>
            
            {/* Profile Settings */}
            <TabsContent value="profile">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to your profile image (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Save Changes</Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Password Settings */}
            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Change Password</Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* User Management */}
            {isAdmin && (
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>
            )}
            
            {/* Recruitment Stages */}
            {isAdmin && (
              <TabsContent value="stages">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">Recruitment Stages</h3>
                  <Button onClick={() => setNewStageDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stage
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-10 text-slate-500">Loading stages...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center">
                              Order
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Stage Name</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stages?.map((stage: any) => (
                          <TableRow key={stage.id}>
                            <TableCell>{stage.order}</TableCell>
                            <TableCell>{stage.name}</TableCell>
                            <TableCell>
                              {stage.isDefault ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Yes
                                </Badge>
                              ) : "No"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* New User Dialog */}
      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will be able to log in with the username and password you provide.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
              <FormField
                control={newUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4">
                <FormField
                  control={newUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Recruitment Manager</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines what permissions the user will have
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setNewUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Stage Dialog */}
      <Dialog open={newStageDialogOpen} onOpenChange={setNewStageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Recruitment Stage</DialogTitle>
            <DialogDescription>
              Create a new stage in the recruitment pipeline. Candidates will progress through these stages.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newStageForm}>
            <form onSubmit={newStageForm.handleSubmit(onNewStageSubmit)} className="space-y-4">
              <FormField
                control={newStageForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newStageForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The order in which this stage appears in the recruitment pipeline
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newStageForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-1"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Default Stage</FormLabel>
                      <FormDescription>
                        If checked, new candidates will be assigned to this stage by default
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setNewStageDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createStageMutation.isPending}
                >
                  {createStageMutation.isPending ? "Creating..." : "Create Stage"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
