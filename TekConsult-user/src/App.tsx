import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import UserSignupForm from "@/pages/auth/UserSignupForm";
import ConsultantSignupForm from "@/pages/auth/ConsultantSignupForm";
import ConsultantRegistration from "@/pages/auth/ConsultantRegistration";
import VerifyOtp from "@/pages/auth/VerifyOtp";
import RegistrationBasicInfo from "@/pages/auth/RegistrationBasicInfo";

// Layouts
import UserLayout from "@/components/layout/UserLayout";
import ConsultantLayout from "@/components/layout/ConsultantLayout";

// User Pages
import UserHome from "@/pages/user/UserHome";
import UserExplore from "@/pages/user/UserExplore";
import UserWallet from "@/pages/user/UserWallet";
import UserSessions from "@/pages/user/UserSessions";
import UserProfile from "@/pages/user/UserProfile";
import UserEditProfilePage from "@/pages/user/UserEditProfilePage";
import UserSettings from "@/pages/user/UserSettings";
import ConsultantProfile from "@/pages/user/ConsultantProfile";
import UserChatSession from "@/pages/user/UserChatSession";

// Consultant Pages
import ConsultantDashboard from "@/pages/consultant/ConsultantDashboard";
import ConsultantEarnings from "@/pages/consultant/ConsultantEarnings";
import ConsultantSessions from "@/pages/consultant/ConsultantSessions";
import ConsultantProfilePage from "@/pages/consultant/ConsultantProfilePage";
import EditProfilePage from "@/pages/consultant/EditProfilePage";
import ConsultantReviews from "@/pages/consultant/ConsultantReviews";
import ConsultantChatSession from "@/pages/consultant/ConsultantChatSession";
import ConsultantSettings from "@/pages/consultant/ConsultantSettings";
import BankDetails from "@/pages/consultant/BankDetails";
import EditBankDetails from "@/pages/consultant/EditBankDetails";
import KYCDocuments from "@/pages/consultant/KYCDocuments";
import UploadKYC from "@/pages/consultant/UploadKYC";
import UserVoiceCallSession from "@/pages/user/UserVoiceCallSession";
import ConsultantVoiceCallSession from "@/pages/consultant/ConsultantVoiceCallSession";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/user-signup" element={<UserSignupForm />} />
            <Route path="/consultant-signup" element={<ConsultantSignupForm />} />
            <Route path="/consultant-registration" element={<ConsultantRegistration />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/registration-basic-info" element={<RegistrationBasicInfo />} />

            {/* User Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route path="home" element={<UserHome />} />
              <Route path="explore" element={<UserExplore />} />
              <Route path="wallet" element={<UserWallet />} />
              <Route path="sessions" element={<UserSessions />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="edit-profile" element={<UserEditProfilePage />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="consultant/:id" element={<ConsultantProfile />} />
              <Route path="chat/:id" element={<UserChatSession />} />
              <Route path="call/:id" element={<UserVoiceCallSession />} />
            </Route>

            {/* Consultant Routes */}
            <Route path="/consultant" element={<ConsultantLayout />}>
              <Route path="dashboard" element={<ConsultantDashboard />} />
              <Route path="sessions" element={<ConsultantSessions />} />
              <Route path="earnings" element={<ConsultantEarnings />} />
              <Route path="reviews" element={<ConsultantReviews />} />
              <Route path="profile" element={<ConsultantProfilePage />} />
              <Route path="edit-profile" element={<EditProfilePage />} />
              <Route path="settings" element={<ConsultantSettings />} />
              <Route path="bank-details" element={<BankDetails />} />
              <Route path="edit-bank-details" element={<EditBankDetails />} />
              <Route path="kyc-documents" element={<KYCDocuments />} />
              <Route path="upload-kyc" element={<UploadKYC />} />
              <Route path="chat/:id" element={<ConsultantChatSession />} />
              <Route path="call/:id" element={<ConsultantVoiceCallSession />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
