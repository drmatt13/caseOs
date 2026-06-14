import { Filter, RotateCcw, Search } from "lucide-react";

import type { RecordStatus } from "#/types/caseRecords";
import { RECORD_STATUS_LABELS } from "#/lib/caseRecordPresentation";

export function WorkPanelSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
      <input
        className="w-full rounded-lg border border-black/15 bg-white/65 py-2.5 pl-9 pr-3 text-md text-black/75 outline-none transition focus:border-black/30 focus:bg-white"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export const FILTERABLE_STATUSES: RecordStatus[] = [
  "ACCEPTED",
  "PROPOSED",
  "REJECTED",
  "PENDING_REPLACEMENT",
  "REPLACED",
];

// Default view hides replaced records so the lists show only live work; the
// reset control returns to exactly this set.
export const DEFAULT_VISIBLE_STATUSES: RecordStatus[] =
  FILTERABLE_STATUSES.filter((status) => status !== "REPLACED");

export function StatusFilter({
  selectedStatuses,
  onSelectStatuses,
}: {
  selectedStatuses: RecordStatus[];
  onSelectStatuses: (statuses: RecordStatus[]) => void;
}) {
  const toggleStatus = (status: RecordStatus) => {
    onSelectStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selected) => selected !== status)
        : [...selectedStatuses, status],
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Filter className="h-4 w-4 text-black/50" />
      <button
        type="button"
        title="Reset filters (hide replaced)"
        aria-label="Reset status filters"
        className="inline-flex items-center justify-center rounded-full border p-1.5 transition-colors border-black/15 bg-white/70 text-black/50 hover:bg-black/5 hover:text-black/50"
        onClick={() => onSelectStatuses(DEFAULT_VISIBLE_STATUSES)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      {FILTERABLE_STATUSES.map((status) => {
        const selected = selectedStatuses.includes(status);

        return (
          <button
            key={status}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              selected
                ? "border-black/30 bg-black/10"
                : "border-black/15 bg-white/70 hover:bg-black/5"
            }`}
            onClick={() => toggleStatus(status)}
            type="button"
          >
            {RECORD_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
