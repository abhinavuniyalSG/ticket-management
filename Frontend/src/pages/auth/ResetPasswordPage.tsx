import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { PasswordField } from "../../components/molecules/PasswordField";
import { Button } from "../../components/atoms/Button";
import { authService } from "../../services/authService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ApiError } from "../../types/api";
import { isPasswordValid } from "../../utils/validation";

type PageState = "form" | "success" | "error";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<PageState>(!token || !email ? "error" : "form");
  const [message, setMessage] = useState(
    !token || !email ? "This password reset link is invalid." : "",
  );

  // Debounced so "Passwords do not match" doesn't flash on every keystroke
  // while the user is still typing the confirmation - it only appears once
  // they've paused for a moment, or immediately if they blur away sooner.
  const debouncedConfirmPassword = useDebouncedValue(confirmPassword, 500);
  const [confirmBlurred, setConfirmBlurred] = useState(false);

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmBlurred(false);
    setConfirmPassword(value);
  };

  // Live (not submit-gated) password checks - see RegisterPage for why.
  // Unlike a login form, both fields being required here means an empty
  // form should also keep the button disabled, not just an invalid one.
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = isPasswordValid(newPassword) && confirmTouched && passwordsMatch;
  const confirmHasSettled = debouncedConfirmPassword === confirmPassword;
  const confirmPasswordError =
    confirmTouched && !passwordsMatch && (confirmBlurred || confirmHasSettled)
      ? "Passwords do not match"
      : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !email || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword({ token, email, newPassword });
      setState("success");
      setMessage(res.message);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to reset your password.";
      setState("error");
      setMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset password">
      {state === "form" && (
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-5">
          <PasswordField
            label="New password"
            id="reset-new-password"
            autoComplete="new-password"
            placeholder="Create a new password"
            value={newPassword}
            showRequirements
            required
            onChange={setNewPassword}
            disabled={isSubmitting}
            isVisible={showPassword}
          />
          <PasswordField
            label="Confirm password"
            id="reset-confirm-password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            error={confirmPasswordError}
            required
            onChange={handleConfirmPasswordChange}
            onBlur={() => setConfirmBlurred(true)}
            disabled={isSubmitting}
            isVisible={showPassword}
          />
          <label
            htmlFor="reset-show-password"
            className="-mt-3 inline-flex select-none items-center gap-2 text-xs text-slate-600"
          >
            <input
              id="reset-show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              disabled={isSubmitting}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            Show passwords
          </label>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!canSubmit}
            title={
              canSubmit
                ? undefined
                : "Enter a matching new password that meets all the requirements above."
            }
            className="w-full"
          >
            Reset password
          </Button>
        </form>
      )}
      {state === "success" && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="text-sm font-medium text-green-700">{message}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98]"
          >
            Continue to sign in
          </Link>
        </div>
      )}
      {state === "error" && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="text-sm font-medium text-red-700">{message}</p>
          <div className="flex gap-2">
            <Link
              to="/changepassword/email"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Request a new link
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
