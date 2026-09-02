import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { Spinner } from "../components/atoms/Spinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../constants/navigation";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ResendVerificationPage } from "../pages/auth/ResendVerificationPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { VerificationRequiredPage } from "../pages/auth/VerificationRequiredPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TicketsListPage } from "../pages/tickets/TicketsListPage";
import { TicketDetailsPage } from "../pages/tickets/TicketDetailsPage";
import { CreateTicketPage } from "../pages/tickets/CreateTicketPage";
import { EditTicketPage } from "../pages/tickets/EditTicketPage";
import { ProfilePage } from "../pages/ProfilePage";
import { UsersListPage } from "../pages/users/UsersListPage";
import { UserDetailsPage } from "../pages/users/UserDetailsPage";
import { DepartmentsListPage } from "../pages/departments/DepartmentsListPage";
import { DepartmentDetailsPage } from "../pages/departments/DepartmentDetailsPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function RootRedirect() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (status === "unauthenticated" || !user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-required" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Authenticated, but not necessarily verified */}
      <Route path="/verify-required" element={<VerificationRequiredPage />} />

      {/* Authenticated + verified */}
      <Route element={<ProtectedLayout />}>
        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
        <Route path="/tickets/:id/edit" element={<EditTicketPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Admin + super admin */}
      <Route element={<ProtectedLayout roles={["admin", "super_admin"]} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
      </Route>

      {/* Super admin only */}
      <Route element={<ProtectedLayout roles={["super_admin"]} />}>
        <Route path="/departments" element={<DepartmentsListPage />} />
        <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
