import { FileText, Image as ImageIcon } from "lucide-react";

import type { CaseDocument, RecordType } from "#/types/caseRecords";
import Button from "#/components/ui/Button";

import { isImageDocument } from "./helpers";

// The Create + Generate action pair shown above every record list. Create opens
// the manual editor; Generate opens the (stub) agent draft modal. Both are bound
// to the view's record type, so the same pair drops into every record view.
export function RecordCreateActions({
  type,
  singular,
  onCreate,
  onGenerate,
}: {
  type: RecordType;
  singular: string;
  onCreate: (type: RecordType) => void;
  onGenerate: (type: RecordType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        style="secondary"
        icon="plus"
        text={`Create ${singular}`}
        onClick={() => onCreate(type)}
      />
      <Button
        style="secondary"
        icon="sparkles"
        text={`Generate ${singular}`}
        onClick={() => onGenerate(type)}
      />
    </div>
  );
}

// Placeholder affordance to open the underlying file/image. Wired to nothing
// yet — the real viewer will stream the stored object. Lives in clickable card
// rows, so it stops propagation to avoid also opening the parent record.
export function DocumentViewButton({ document }: { document: CaseDocument }) {
  const image = isImageDocument(document);
  const label = image ? "View image" : "Open document";
  return (
    <Button
      style="secondary"
      size="sm"
      icon={image ? ImageIcon : FileText}
      text={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
    />
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
