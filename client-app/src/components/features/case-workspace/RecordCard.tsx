import { SquareArrowOutUpRight } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_DISPLAY_STATUS_CARD_CLASSES } from "#/lib/caseRecordPresentation";

import { recordDisplayStatus } from "./helpers";
import { PartyBadge, SubstatusBadge, SupportBadge } from "./RecordBadges";
import { RecordSettingsMenu } from "./RecordActions";
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
  const status = graph.effectiveStatus(record);
  // Display status splits PROPOSED into plain "Proposed" vs "Proposed
  // Replacement" (green badge, purple card); raw `status` still drives logic.
  const displayStatus = recordDisplayStatus(record, graph);
  const showMetadataPills = Boolean(
    record.supportStatus ||
      record.substatus ||
      (record.party && record.party !== "neutral"),
  );

  return (
    <article
      role="button"
      tabIndex={0}
      className={`group relative cursor-pointer rounded-xl border p-4 pr-12 text-left shadow-sm transition-colors ${RECORD_DISPLAY_STATUS_CARD_CLASSES[displayStatus]}`}
      onClick={() => onOpenRecord(record.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenRecord(record.id);
        }
      }}
      title={`Open ${record.title}`}
    >
      {(status === "ACCEPTED" || displayStatus === "REJECTED") && (
        <div className="absolute right-3 top-3">
          <RecordSettingsMenu record={record} onDelete={graph.deleteRecord} />
        </div>
      )}
      <div className="min-w-0">
        {record.category && (
          <p className="mb-1 text-[0.65rem] uppercase tracking-wide text-black/40">
            {record.category}
          </p>
        )}
        {showMetadataPills && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <SupportBadge record={record} />
            <SubstatusBadge record={record} />
            <PartyBadge
              record={record}
              clientRole={graph.demo.caseContext.representation.clientRole}
            />
          </div>
        )}
        <h3 className="text-md font-semibold">{record.title}</h3>
        {record.summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/70">
            {record.summary}
          </p>
        )}
      </div>
      <span className="absolute bottom-3 right-3 rounded-lg p-1 text-black/55 transition-colors group-hover:text-black/75">
        <SquareArrowOutUpRight className="h-4 w-4" />
      </span>
    </article>
  );
}

export default RecordCard;
