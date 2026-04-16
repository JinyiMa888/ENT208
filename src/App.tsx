import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import JobsPage from "./pages/JobsPage";
import MatchPage from "./pages/MatchPage";
import RewritePage from "./pages/RewritePage";
import InterviewPage from "./pages/InterviewPage";
import DashboardPage from "./pages/DashboardPage";
import Workspace from "./pages/Workspace";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/rewrite" element={<RewritePage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
