import { GitBranch, Sparkles } from "lucide-react";

import {
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
} from "#/lib/caseRecordPresentation";

import { EmptyState } from "../common";
import RecordCard from "../RecordCard";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function ReviewView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const replacementProposals = graph.proposedRecords.filter(
    (record) => record.replacesIds?.length,
  );
  const newProposals = graph.proposedRecords.filter(
    (record) => !record.replacesIds?.length,
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS.review}</h2>
        <p className="mt-1 text-sm text-black/70">{VIEW_DESCRIPTIONS.review}</p>
      </div>

      {graph.proposedRecords.length === 0 && (
        <EmptyState message="No pending proposals need review." />
      )}

      {replacementProposals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <GitBranch className="h-4 w-4" />
            Replacement Proposals ({replacementProposals.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {replacementProposals.map((record) => (
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

      {newProposals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <Sparkles className="h-4 w-4" />
            New proposals ({newProposals.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {newProposals.map((record) => (
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
