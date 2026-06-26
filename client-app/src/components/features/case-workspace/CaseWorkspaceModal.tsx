import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import useBodyScrollLock from "#/hooks/useBodyScrollLock";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace overlay shell. A centered card over a blur + tint backdrop, kept
// mounted so it can animate open and closed — mirrors RecordInspector / AppModal.
// Used by the Create and Generate modals. The last content is retained while
// closing so the card animates out instead of blanking. Children supply their
// own scroll region + footer (the create editor and generate form both do).
// ─────────────────────────────────────────────────────────────────────────────

function CaseWorkspaceModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useBodyScrollLock(open);

  const [rendered, setRendered] = useState<{
    title: string;
    children: ReactNode;
  }>({ title, children });

  useEffect(() => {
    if (open) setRendered({ title, children });
  }, [open, title, children]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-10000 flex items-start justify-center overflow-hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* blur layer */}
      <div
        className={`absolute inset-0 transition-[backdrop-filter] ${
          open
            ? "duration-200 ease-out backdrop-blur-xs"
            : "duration-300 ease-in backdrop-blur-0"
        }`}
      />

      {/* tint layer */}
      <div
        className={`absolute inset-0 bg-black/10 transition-opacity ${
          open
            ? "duration-200 ease-out opacity-100"
            : "duration-300 ease-in opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative top-12 z-20 flex h-max max-h-[calc(100vh-6rem)] w-2xl max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-black/22 bg-white/90 text-md shadow-md backdrop-blur-sm transition-all ${
          open
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/15 px-4 py-3">
          <span className="font-serif text-md">{rendered.title}</span>
          <button
            type="button"
            aria-label="Close"
            className="ml-auto rounded-lg p-1.5 text-black/65 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {rendered.children}
      </div>
    </div>
  );
}

export default CaseWorkspaceModal;
