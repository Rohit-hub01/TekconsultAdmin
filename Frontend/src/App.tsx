import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Consultants from "./pages/Consultants";
import UsersPage from "./pages/UsersPage";
import Categories from "./pages/Categories";
import LiveSessions from "./pages/LiveSessions";
import Wallets from "./pages/Wallets";
import Withdrawals from "./pages/Withdrawals";
import Disputes from "./pages/Disputes";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

import ConsultantDetails from "./pages/ConsultantDetails";

import { ProtectedRoute, PublicRoute } from "./components/auth/RouteGuards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes - only accessible when NOT logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected routes - only accessible when logged in */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/consultants" element={<AdminLayout><Consultants /></AdminLayout>} />
            <Route path="/consultants/:id" element={<AdminLayout><ConsultantDetails /></AdminLayout>} />
            <Route path="/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
            <Route path="/categories" element={<AdminLayout><Categories /></AdminLayout>} />
            <Route path="/sessions" element={<AdminLayout><LiveSessions /></AdminLayout>} />
            <Route path="/wallets" element={<AdminLayout><Wallets /></AdminLayout>} />
            <Route path="/withdrawals" element={<AdminLayout><Withdrawals /></AdminLayout>} />
            <Route path="/disputes" element={<AdminLayout><Disputes /></AdminLayout>} />
            <Route path="/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />
            <Route path="/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />
            <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
