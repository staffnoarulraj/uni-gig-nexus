import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AvailableJobsPage } from "@/pages/AvailableJobsPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PostJobPage from "@/pages/PostJobPage";
import ManageJobsPage from "@/pages/ManageJobsPage";
import EmployerProfilePage from "@/pages/EmployerProfilePage";
import ReviewApplicationsPage from "@/pages/ReviewApplicationsPage";
import StudentJobsPage from "@/pages/StudentJobsPage";
import StudentProfilePage from "@/pages/StudentProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/available-jobs" element={<ProtectedRoute><AvailableJobsPage /></ProtectedRoute>} />
            <Route path="/post-job" element={<ProtectedRoute><PostJobPage /></ProtectedRoute>} />
            <Route path="/manage-jobs" element={<ProtectedRoute><ManageJobsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><EmployerProfilePage /></ProtectedRoute>} />
            <Route path="/review-applications" element={<ProtectedRoute><ReviewApplicationsPage /></ProtectedRoute>} />
            <Route path="/my-jobs" element={<ProtectedRoute><StudentJobsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
