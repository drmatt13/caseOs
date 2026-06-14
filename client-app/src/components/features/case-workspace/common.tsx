import { FileText, Image as ImageIcon } from "lucide-react";

import type { CaseDocument } from "#/types/caseRecords";

import { isImageDocument } from "./helpers";

// Placeholder affordance to open the underlying file/image. Wired to nothing
// yet — the real viewer will stream the stored object.
export function DocumentViewButton({ document }: { document: CaseDocument }) {
  const image = isImageDocument(document);
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-xs text-black/70 transition-colors hover:bg-black/10"
      title={image ? "View image" : "Open document"}
      onClick={(event) => event.stopPropagation()}
    >
      {image ? (
        <ImageIcon className="h-3.5 w-3.5" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      {image ? "View image" : "Open document"}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/25 bg-white/50 p-8 text-center text-md text-black/65">
      {message}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/15 bg-white/75 p-3">
      <p className="text-xs text-black/65">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
