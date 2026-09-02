import { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { Button } from "../../components/atoms/Button";
import { Spinner } from "../../components/atoms/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";
import { getDefaultRouteForRole } from "../../constants/navigation";

export function VerificationRequiredPage() {
  const { user, status } = useAuth();
  const handleLogout = useLogout();
  const [isSending, setIsSending] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isVerified) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      const res = await authService.resendVerification(user.email);
      toast.success(res.message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to resend the email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout title="Verify your email">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <p className="text-sm text-slate-600">
          We sent a verification link to <span className="font-medium text-slate-900">{user.email}</span>.
          You need to verify your email before you can access tickets, users, or departments.
        </p>
        <Button onClick={() => void handleResend()} isLoading={isSending} className="w-full">
          Resend verification email
        </Button>
        <p className="text-xs text-slate-500">
          Already clicked the link in your email? Sign out and sign back in to refresh your account
          status.
        </p>
        <Button variant="secondary" onClick={() => void handleLogout()} className="w-full">
          Log out
        </Button>
      </div>
    </AuthLayout>
  );
}
