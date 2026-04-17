import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inbox from "@/pages/Inbox";
import AddCorrespondence from "@/pages/AddCorrespondence";
import Archive from "@/pages/Archive";
import Reports from "@/pages/Reports";
import Departments from "@/pages/Departments";
import Employees from "@/pages/Employees";
import CorrespondenceDetail from "@/pages/CorrespondenceDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Redirect to="/" />;
  return <>{children}</>;
}

function Router() {
  return (
    <AuthGate>
      <Switch>
        {/* Public */}
        <Route path="/login">
          <PublicRoute>
            <Login />
          </PublicRoute>
        </Route>

        {/* Protected — all authenticated users */}
        <Route path="/">
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/inbox">
          <ProtectedRoute>
            <AppLayout><Inbox /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/add">
          <ProtectedRoute>
            <AppLayout><AddCorrespondence /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/correspondences/:id">
          <ProtectedRoute>
            <AppLayout><CorrespondenceDetail /></AppLayout>
          </ProtectedRoute>
        </Route>

        {/* Protected — admin & supervisor only */}
        <Route path="/archive">
          <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
            <AppLayout><Archive /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/reports">
          <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        </Route>

        {/* Protected — admin only */}
        <Route path="/departments">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout><Departments /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/employees">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout><Employees /></AppLayout>
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AuthGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
