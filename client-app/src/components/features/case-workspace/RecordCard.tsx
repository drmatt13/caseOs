import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_DISPLAY_STATUS_CARD_CLASSES } from "#/lib/caseRecordPresentation";

import { recordDisplayStatus } from "./helpers";
import { StatePill } from "./RecordBadges";
import {
  AcceptedRecordActions,
  ProposalActions,
  ProposalDecisionNote,
  RecordSettingsMenu,
} from "./RecordActions";
import {
  PendingReplacementNotice,
  ReplacementNotice,
} from "./RecordNotices";
import RecordLinksPanel from "./RecordLinksPanel";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

function RecordCard({
  record,
  graph,
  onOpenRecord,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = graph.effectiveStatus(record);
  // Display status splits PROPOSED into plain "Proposed" vs "Proposed
  // Replacement" (green badge, purple card); raw `status` still drives logic.
  const displayStatus = recordDisplayStatus(record, graph);
  const decision = graph.proposalDecisions[record.id];
  const pendingProposals = graph.pendingReplacementByTargetId.get(record.id);

  return (
    <article
      className={`rounded-xl border shadow-sm ${RECORD_DISPLAY_STATUS_CARD_CLASSES[displayStatus]}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="relative w-full cursor-pointer p-4 pr-12 text-left"
        onClick={() => setExpanded((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
      >
        {(status === "ACCEPTED" || status === "REJECTED") && (
          <div className="absolute right-3 top-3">
            <RecordSettingsMenu record={record} onDelete={graph.deleteRecord} />
          </div>
        )}
        <div className="min-w-0">
          {/* One resolved state pill (cascade) carries the record's standing;
              category is a quiet kicker. The full decomposition lives in the
              inspector. */}
          {record.category && (
            <p className="mb-1 text-[0.65rem] uppercase tracking-wide text-black/40">
              {record.category}
            </p>
          )}
          <div className="mb-2">
            <StatePill record={record} graph={graph} />
          </div>
          <h3 className="text-md font-semibold">{record.title}</h3>
          {record.summary && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/70">
              {record.summary}
            </p>
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-lg p-1 text-black/55">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-black/15 px-4 pb-4 pt-3">
          {record.status === "PROPOSED" && !decision && (
            <ReplacementNotice
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          )}
          {pendingProposals && (
            <PendingReplacementNotice
              proposals={pendingProposals}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          )}
          <p className="text-md leading-6 text-black/75">{record.content}</p>
          <div className="mt-4">
            <RecordLinksPanel
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          </div>
          {status === "ACCEPTED" && (
            <AcceptedRecordActions
              record={record}
              onPropose={graph.proposeRevision}
            />
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
              onClick={() => onOpenRecord(record.id)}
            >
              Open in inspector
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {record.status === "PROPOSED" && !decision && (
            <ProposalActions
              record={record}
              onDelete={graph.deleteRecord}
              onDecision={graph.decideProposal}
            />
          )}
          {decision && <ProposalDecisionNote decision={decision} />}
        </div>
      )}
    </article>
  );
}

export default RecordCard;
