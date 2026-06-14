import { GitBranch, Lock } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { TONES } from "#/lib/tones";

import RecordChip from "./RecordChip";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

export function ReplacementNotice({
  record,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  const targets = (record.replacesIds ?? [])
    .map((id) => graph.recordsById.get(id))
    .filter((target): target is TypedCaseRecord => Boolean(target));

  if (targets.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-900">
      <div className="flex items-center gap-1.5 font-medium">
        <GitBranch className="h-3.5 w-3.5" />
        <span>This proposed record would replace:</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {targets.map((target) => (
          <RecordChip
            key={target.id}
            record={target}
            graph={graph}
            onOpenRecord={onOpenRecord}
            isCycle={visitedIds?.has(target.id)}
            hideProposedReplacementPill
          />
        ))}
      </div>
      <p className="mt-2 leading-5 text-green-900/80">
        Accepting it retires the records above and removes their chunks from
        retrieval.
      </p>
    </div>
  );
}

export function PendingReplacementNotice({
  proposal,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  proposal: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  // The record this sits on is itself amber (pending replacement). The lock is
  // the blocking constraint, so the container reads red; the replacement chip
  // stays visually quieter because the surrounding copy already frames it.
  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
      <div className="flex items-center gap-1.5 font-medium">
        <Lock className="h-3.5 w-3.5" />
        <span>Record locked while a replacement proposal is pending</span>
      </div>
      <div className="mt-2">
        <RecordChip
          record={proposal}
          graph={graph}
          onOpenRecord={onOpenRecord}
          isCycle={visitedIds?.has(proposal.id)}
          pairedReplacement
          hideProposedReplacementPill
        />
      </div>
      <p className="mt-2 leading-5 text-red-900/80">
        Review the proposal before editing, deleting, or rewriting this record.
      </p>
    </div>
  );
}

export function VersionHistoryNotice({
  record,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  const status = graph.effectiveStatus(record);
  const replacedBy =
    graph.acceptedReplacementByTargetId.get(record.id) ??
    (record.replacedByIds?.length
      ? graph.recordsById.get(record.replacedByIds[0])
      : undefined);
  const replaces =
    status === "PROPOSED"
      ? []
      : (record.replacesIds ?? [])
          .map((id) => graph.recordsById.get(id))
          .filter((target): target is TypedCaseRecord => Boolean(target));

  if (!replacedBy && replaces.length === 0) return null;

  const hasForwardHistory = Boolean(replacedBy);
  const surfaceClass = hasForwardHistory
    ? TONES.info.surface
    : TONES.positive.surface;

  return (
    <div
      className={`mb-3 mt-4 rounded-lg border px-3 py-2 text-sm ${surfaceClass}`}
    >
      <div className="flex items-center gap-1.5 font-medium text-black/80">
        <GitBranch className="h-3.5 w-3.5" />
        <span>Version history</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {replacedBy && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-black/65">
              <GitBranch className="h-3.5 w-3.5" />
              Replaced by
            </p>
            <RecordChip
              record={replacedBy}
              graph={graph}
              onOpenRecord={onOpenRecord}
              isCycle={visitedIds?.has(replacedBy.id)}
              allowCycleNavigation
            />
          </div>
        )}

        {replaces.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-black/65">
              <GitBranch className="h-3.5 w-3.5" />
              Replaces
            </p>
            <div className="flex flex-col gap-1.5">
              {replaces.map((target) => (
                <RecordChip
                  key={target.id}
                  record={target}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds?.has(target.id)}
                  allowCycleNavigation
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
