import { useState } from "react";
import { GitBranch, Sparkles, TriangleAlert } from "lucide-react";

import { VIEW_DESCRIPTIONS, VIEW_LABELS } from "#/lib/caseRecordPresentation";

import { EmptyState } from "../common";
import { recordNeedsReview, reviewQueue } from "../helpers";
import RecordCard from "../RecordCard";
import { NeedsReviewFilter } from "../RecordFilters";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function ReviewView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  const replacementProposals = graph.proposedRecords.filter(
    (record) => record.replacesIds?.length,
  );
  const newProposals = graph.proposedRecords.filter(
    (record) => !record.replacesIds?.length,
  );
  // Flagged ACCEPTED records belong in review too — not only proposals. They sit
  // in their own section so the proposal queue stays the "decide" list.
  const flaggedAccepted = reviewQueue(graph).filter(
    (record) => graph.effectiveStatus(record) === "ACCEPTED",
  );

  // The "Needs review" toggle narrows proposals to flagged ones and keeps the
  // flagged-accepted section; off, it shows the full proposal queue.
  const visibleReplacements = needsReviewOnly
    ? replacementProposals.filter((record) => recordNeedsReview(record, graph))
    : replacementProposals;
  const visibleNew = needsReviewOnly
    ? newProposals.filter((record) => recordNeedsReview(record, graph))
    : newProposals;

  const nothingToShow =
    visibleReplacements.length === 0 &&
    visibleNew.length === 0 &&
    flaggedAccepted.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS.review}</h2>
        <p className="mt-1 text-sm text-black/70">{VIEW_DESCRIPTIONS.review}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NeedsReviewFilter
          checked={needsReviewOnly}
          onChange={setNeedsReviewOnly}
        />
      </div>

      {nothingToShow && (
        <EmptyState
          message={
            needsReviewOnly
              ? "Nothing currently needs review."
              : "No pending proposals need review."
          }
        />
      )}

      {flaggedAccepted.length > 0 && (
        <section className="flex flex-col gap-2">
          {/* <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <TriangleAlert className="h-4 w-4" />
            Accepted Records ({flaggedAccepted.length})
          </h3> */}
          <div className="grid grid-cols-1 gap-3">
            {flaggedAccepted.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </section>
      )}

      {visibleReplacements.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <GitBranch className="h-4 w-4" />
            Replacement Proposals ({visibleReplacements.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {visibleReplacements.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </section>
      )}

      {visibleNew.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <Sparkles className="h-4 w-4" />
            New proposals ({visibleNew.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {visibleNew.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ReviewView;
