import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../atoms/Spinner";
import { DashboardLayout } from "../templates/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types/user";

interface ProtectedLayoutProps {
  roles?: UserRole[];
}

export function ProtectedLayout({ roles }: ProtectedLayoutProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-required" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
