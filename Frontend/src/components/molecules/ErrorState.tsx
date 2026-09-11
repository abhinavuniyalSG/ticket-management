import { Button } from "../atoms/Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50/70 px-6 py-12 text-center shadow-sm"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-red-500">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-red-800">{title}</p>
      <p className="max-w-sm text-sm text-red-600">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
