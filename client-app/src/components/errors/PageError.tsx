import { useNavigate } from "@tanstack/react-router";

import Button from "#/components/ui/Button";

interface PageErrorProps {
  title: string;
  message: string;
  // Renders a "Try again" button; use a query's refetch for recoverable loads.
  onRetry?: () => void;
  retryLabel?: string;
  // Renders a navigation button (e.g. "Go home" -> "/").
  actionLabel?: string;
  actionTo?: string;
  actionParams?: Record<string, string>;
}

// Reusable page-level error for resource/data-loading failures. Never touches
// the session — a failed workspace/case/etc. load stays recoverable. For
// current-user/session failures use SessionError (which logs out) instead.
// Full-screen centered glass card, no app chrome, so it drops in wherever a
// route currently early-returns an error component.
const PageError = ({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  actionLabel,
  actionTo,
  actionParams,
}: PageErrorProps) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    // `navigate` is strictly typed over the route tree; a generic `actionTo`
    // string can't be proven to match, so cast the options once here to keep
    // every call site clean.
    void navigate({
      to: actionTo,
      params: actionParams,
    } as Parameters<typeof navigate>[0]);
  };

  return (
    <div className="h-dvh w-full flex justify-center items-center px-6">
      <div className="max-w-md rounded-2xl border border-black/15 bg-white/40 p-6 text-center shadow-md backdrop-blur-sm">
        <p className="font-serif text-lg">{title}</p>
        <p className="mt-2 text-md text-black/60">{message}</p>
        {(onRetry || (actionLabel && actionTo)) && (
          <div className="mt-4 flex justify-center gap-3">
            {onRetry && (
              <Button style="secondary" text={retryLabel} onClick={onRetry} />
            )}
            {actionLabel && actionTo && (
              <Button
                style="primary"
                text={actionLabel}
                onClick={handleNavigate}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageError;
