import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { Spinner } from "../../components/atoms/Spinner";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setState("success");
        setMessage(res.message);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof ApiError ? error.message : "Verification failed.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {state === "loading" && (
          <>
            <Spinner size="lg" />
            <p className="text-sm text-slate-600">Verifying your email address…</p>
          </>
        )}
        {state === "success" && (
          <>
            <p className="text-sm font-medium text-green-700">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Continue to sign in
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <p className="text-sm font-medium text-red-700">{message}</p>
            <div className="flex gap-2">
              <Link
                to="/resend-verification"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Resend email
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
