import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";

import { formatDate } from "../helpers";
import { EmptyState } from "../common";
import RecordCard from "../RecordCard";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function GlobalSearchView({
  query,
  records,
  graph,
  onClearSearch,
  onOpenRecord,
}: {
  query: string;
  records: TypedCaseRecord[];
  graph: WorkspaceGraph;
  onClearSearch: () => void;
  onOpenRecord: (recordId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">Workspace Search</h2>
          <p className="mt-1 text-sm text-black/70">
            Searching all case records for "{query.trim()}".
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-black/15 bg-white/75 px-3 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
          onClick={onClearSearch}
        >
          Clear search
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {records.length === 0 ? (
          <EmptyState message="No case records match this workspace search." />
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-black/50">
                <span className="rounded-full border border-black/15 bg-white/75 px-2 py-0.5">
                  {RECORD_TYPE_LABELS[record.type]}
                </span>
                <span>{formatDate(record.updatedAt)}</span>
              </div>
              <RecordCard
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GlobalSearchView;
