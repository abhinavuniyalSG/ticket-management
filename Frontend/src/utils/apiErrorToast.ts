import toast from "react-hot-toast";
import { ApiError } from "../types/api";

/** Extracts a safe, user-facing message from a failed API call - for spots
 * that need the text itself (e.g. also showing it inline in a form), rather
 * than just wanting a toast. Pair with `showApiErrorToast` for the toast. */
export function getApiErrorMessage(err: unknown, fallbackMessage: string): string {
  return err instanceof ApiError ? err.message : fallbackMessage;
}

/**
 * Shows an error toast for a failed API call, except when the session has
 * already expired - AuthProvider's global handler shows its own "please sign
 * in again" toast for that, and a second one here would just stack a
 * redundant, confusing toast on top of it for the same underlying event.
 */
export function showApiErrorToast(err: unknown, fallbackMessage: string): void {
  if (err instanceof ApiError) {
    if (err.isSessionExpired) return;
    toast.error(err.message);
    return;
  }
  toast.error(fallbackMessage);
}
