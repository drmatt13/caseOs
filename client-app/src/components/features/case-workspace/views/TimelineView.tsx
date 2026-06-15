import { CalendarDays } from "lucide-react";

import type { RecordStatus, TimelineEventRecord } from "#/types/caseRecords";
import {
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";

import { formatEventDate, recordMatchesSearch } from "../helpers";
import { EmptyState } from "../common";
import { StatusFilter, WorkPanelSearch } from "../RecordFilters";
import RecordCard from "../RecordCard";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function TimelineView({
  graph,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: RecordStatus[];
  setSelectedStatuses: (statuses: RecordStatus[]) => void;
  onOpenRecord: (recordId: string) => void;
}) {
  const events = graph.records
    .filter((record): record is TimelineEventRecord => {
      if (record.type !== "TIMELINE_EVENT") return false;
      const status = graph.effectiveStatus(record);
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(status);
      return (
        matchesStatus &&
        recordMatchesSearch(
          record,
          panelSearch,
          graph.demo.caseContext.representation.clientRole,
        )
      );
    })
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS.timeline}</h2>
        <p className="mt-1 text-sm text-black/70">
          {VIEW_DESCRIPTIONS.timeline}
        </p>
      </div>

      <div className="flex justify-end">
        <Button style="secondary" text="Create timeline event" icon="plus" />
      </div>

      <WorkPanelSearch
        value={panelSearch}
        onChange={setPanelSearch}
        placeholder="Search timeline events"
      />

      <StatusFilter
        selectedStatuses={selectedStatuses}
        onSelectStatuses={setSelectedStatuses}
      />

      <div className="relative flex flex-col gap-2 pl-5">
        <div className="absolute left-[.55rem] top-2 bottom-2 w-px bg-black/20" />
        {events.length === 0 ? (
          <EmptyState message="No timeline events match the current filters." />
        ) : (
          events.map((record) => (
            <article key={record.id} className="relative">
              <div className="absolute -left-[1.05rem] top-5 h-2.5 w-2.5 rounded-full border border-white bg-black/45" />
              <div className="mb-1 flex items-center gap-1.5 pl-1 text-xs text-black/65">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatEventDate(record)}
              </div>
              <RecordCard
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default TimelineView;
