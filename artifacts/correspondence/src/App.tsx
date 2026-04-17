import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

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

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/add" component={AddCorrespondence} />
        <Route path="/archive" component={Archive} />
        <Route path="/reports" component={Reports} />
        <Route path="/departments" component={Departments} />
        <Route path="/employees" component={Employees} />
        <Route path="/correspondences/:id" component={CorrespondenceDetail} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
