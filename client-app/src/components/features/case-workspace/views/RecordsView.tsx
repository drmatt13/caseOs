import type { RecordStatus } from "#/types/caseRecords";
import { VIEW_RECORD_TYPE, type RecordViewType } from "#/types/caseWorkspace";
import {
  SINGULAR_VIEW_LABELS,
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";

import { recordMatchesSearch } from "../helpers";
import { EmptyState } from "../common";
import { StatusFilter, WorkPanelSearch } from "../RecordFilters";
import RecordCard from "../RecordCard";
import type { WorkspaceGraph } from "../useWorkspaceGraph";
import CaseNoteComposer from "./CaseNoteComposer";

function RecordsView({
  activeView,
  graph,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  onOpenRecord,
}: {
  activeView: RecordViewType;
  graph: WorkspaceGraph;
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: RecordStatus[];
  setSelectedStatuses: (statuses: RecordStatus[]) => void;
  onOpenRecord: (recordId: string) => void;
}) {
  const recordType = VIEW_RECORD_TYPE[activeView];
  const singular = SINGULAR_VIEW_LABELS[activeView] ?? "record";

  const filteredRecords = graph.records.filter((record) => {
    if (record.type !== recordType) return false;
    const status = graph.effectiveStatus(record);
    const matchesStatus = selectedStatuses.includes(status);
    return (
      matchesStatus &&
      recordMatchesSearch(
        record,
        panelSearch,
        graph.demo.caseContext.representation.clientRole,
      )
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS[activeView]}</h2>
        <p className="mt-1 text-sm text-black/70">
          {VIEW_DESCRIPTIONS[activeView]}
        </p>
      </div>

      {activeView !== "notes" && (
        <div className="flex justify-end">
          <Button style="secondary" text={`Create ${singular}`} icon="plus" />
        </div>
      )}

      <WorkPanelSearch
        value={panelSearch}
        onChange={setPanelSearch}
        placeholder={`Search ${VIEW_LABELS[activeView].toLowerCase()}`}
      />

      <StatusFilter
        selectedStatuses={selectedStatuses}
        onSelectStatuses={setSelectedStatuses}
      />

      {activeView === "notes" && (
        <CaseNoteComposer onCreateCaseNote={graph.createNote} />
      )}

      <div className="grid grid-cols-1 gap-3">
        {filteredRecords.length === 0 ? (
          <EmptyState
            message={`No ${VIEW_LABELS[activeView].toLowerCase()} match the current filters.`}
          />
        ) : (
          filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default RecordsView;
