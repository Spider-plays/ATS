import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Candidates from "@/pages/candidates";
import Requirements from "@/pages/requirements";
import RequirementDetail from "@/pages/requirement-detail";
import Interviews from "@/pages/interviews";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/candidates" component={Candidates} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/requirements/:id" component={RequirementDetail} />
      <Route path="/interviews" component={Interviews} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
