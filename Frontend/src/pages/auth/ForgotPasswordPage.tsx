import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { FormField } from "../../components/molecules/FormField";
import { Input } from "../../components/atoms/Input";
import { Button } from "../../components/atoms/Button";
import { authService } from "../../services/authService";
import { ApiError } from "../../types/api";
import { isValidEmail } from "../../utils/validation";

const RESEND_COOLDOWN_SECONDS = 180;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const sendResetEmail = async () => {
    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      toast.success(res.message);
      setSent(true);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to send the reset email.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    await sendResetEmail();
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isSubmitting) return;
    await sendResetEmail();
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="text-sm text-slate-600">
            If an account with that email exists, a password reset email has been sent.
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={secondsLeft > 0}
            isLoading={isSubmitting}
            onClick={() => void handleResend()}
          >
            {secondsLeft > 0 ? `Resend email (${formatCountdown(secondsLeft)})` : "Resend email"}
          </Button>
          <Link to="/login" className="text-sm font-medium text-slate-900 hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-5">
          <FormField label="Email" htmlFor="forgot-password-email" error={error ?? undefined} required>
            <Input
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              value={email}
              invalid={Boolean(error)}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Send reset email
          </Button>
          <p className="text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-slate-900 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
