import { GitBranch, Lock, TriangleAlert } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { REVIEW_SEVERITY_LABELS } from "#/lib/caseRecordPresentation";
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
    <div
      className={`mb-3 rounded-lg border px-3 py-2 text-sm ${TONES.positive.surface} ${TONES.positive.ink}`}
    >
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
      <p className="mt-2 leading-5 text-emerald-900/80">
        Accepting it retires the records above and removes their chunks from
        retrieval.
      </p>
    </div>
  );
}

// On a PROPOSED record, the downstream consequences of accepting it: which
// existing records it would flag for review, with how + why. The two-way view —
// the human sees the impact before accepting, and on accept each target is
// actually flagged (see useWorkspaceGraph.applyProposalImpact).
export function ProposalImpactNotice({
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
  const impacts = (record.proposalImpact ?? []).flatMap((impact) => {
    const target = graph.recordsById.get(impact.targetRecordId);
    return target ? [{ impact, target }] : [];
  });
  if (impacts.length === 0) return null;

  return (
    <div
      className={`mb-3 rounded-lg border px-3 py-2 text-sm ${TONES.caution.surface} ${TONES.caution.ink}`}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <TriangleAlert className="h-3.5 w-3.5" />
        <span>Accepting this will flag for review:</span>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {impacts.map(({ impact, target }) => (
          <div key={target.id} className="flex flex-col gap-1">
            <RecordChip
              record={target}
              graph={graph}
              onOpenRecord={onOpenRecord}
              isCycle={visitedIds?.has(target.id)}
            />
            <p className="leading-5 text-amber-900/85">
              <span className="font-medium">{impact.effect}</span>
              {" — "}
              {impact.reason}
              <span className="text-amber-900/60">
                {" "}
                ({REVIEW_SEVERITY_LABELS[impact.severity].toLowerCase()})
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PendingReplacementNotice({
  proposals,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  proposals: TypedCaseRecord[];
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  if (proposals.length === 0) return null;

  // The record this sits on is itself amber (pending replacement). The lock is
  // the blocking constraint, so the container reads red; the replacement chip
  // stays visually quieter because the surrounding copy already frames it.
  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
      <div className="flex items-center gap-1.5 font-medium">
        <Lock className="h-3.5 w-3.5" />
        <span>
          Record locked while{" "}
          {proposals.length > 1
            ? "replacement proposals are pending"
            : "a replacement proposal is pending"}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {proposals.map((proposal) => (
          <RecordChip
            key={proposal.id}
            record={proposal}
            graph={graph}
            onOpenRecord={onOpenRecord}
            isCycle={visitedIds?.has(proposal.id)}
            pairedReplacement
            hideProposedReplacementPill
          />
        ))}
      </div>
      <p className="mt-2 leading-5 text-red-900/80">
        Review{" "}
        {proposals.length > 1 ? "the proposals" : "the proposal"} before
        editing, deleting, or rewriting this record.
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
  // Forward lineage ("replaced by") is many-valued: a 1→N split retires this
  // record in favor of several successors. Union the derived accepted
  // replacements with any stored successor ids, deduped by record id, so a
  // branch shows every successor chip rather than only the first.
  const replacedByMap = new Map<string, TypedCaseRecord>();
  for (const successor of graph.acceptedReplacementsByTargetId.get(record.id) ??
    []) {
    replacedByMap.set(successor.id, successor);
  }
  for (const id of record.replacedByIds ?? []) {
    const successor = graph.recordsById.get(id);
    if (successor) replacedByMap.set(successor.id, successor);
  }
  const replacedBy = [...replacedByMap.values()];

  // Backward lineage ("replaces"): the predecessor record(s) this one merges
  // from or revises. Hidden while still a proposal (shown in ReplacementNotice).
  const replaces =
    status === "PROPOSED"
      ? []
      : (record.replacesIds ?? [])
          .map((id) => graph.recordsById.get(id))
          .filter((target): target is TypedCaseRecord => Boolean(target));

  if (replacedBy.length === 0 && replaces.length === 0) return null;

  // const hasForwardHistory = replacedBy.length > 0;
  const surfaceClass = TONES.caution.surface;

  return (
    <div
      className={`mb-3 mt-4 rounded-lg border px-3 py-2 text-sm ${surfaceClass}`}
    >
      <div className="flex items-center gap-1.5 font-medium text-black/80">
        <GitBranch className="h-3.5 w-3.5" />
        <span>Version history</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {replacedBy.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-black/65">
              {/* <GitBranch className="h-3.5 w-3.5" /> */}
              {replacedBy.length > 1
                ? `Replaced by ${replacedBy.length} records`
                : "Replaced by"}
            </p>
            <div className="flex flex-col gap-1.5">
              {replacedBy.map((successor) => (
                <RecordChip
                  key={successor.id}
                  record={successor}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds?.has(successor.id)}
                />
              ))}
            </div>
          </div>
        )}

        {replaces.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-black/65">
              {/* <GitBranch className="h-3.5 w-3.5" /> */}
              {replaces.length > 1
                ? `Replaces ${replaces.length} records`
                : "Replaces"}
            </p>
            <div className="flex flex-col gap-1.5">
              {replaces.map((target) => (
                <RecordChip
                  key={target.id}
                  record={target}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds?.has(target.id)}
                  hidePill
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
