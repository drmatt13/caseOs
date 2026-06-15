import { CircleAlert, ShieldCheck, Users } from "lucide-react";

import { ATTENTION_SUBSTATUSES } from "#/lib/caseRecordPresentation";
import type { WorkspaceViewType } from "#/types/caseWorkspace";

import { Metric } from "../common";
import RecordChip from "../RecordChip";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function OverviewView({
  graph,
  onOpenRecord,
  onSelectView,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onSelectView: (view: WorkspaceViewType) => void;
}) {
  const highPriorityRecords = graph.records.filter(
    (record) =>
      record.priority === "high" &&
      graph.effectiveStatus(record) === "ACCEPTED",
  );
  const attentionRecords = graph.records.filter(
    (record) =>
      record.substatus &&
      ATTENTION_SUBSTATUSES.includes(record.substatus) &&
      graph.effectiveStatus(record) !== "REPLACED" &&
      graph.effectiveStatus(record) !== "REJECTED",
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg">Strategic Snapshot</h2>
              <p className="mt-1 text-sm text-black/70">
                {graph.demo.caseContext.currentPosture}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-green-700" />
          </div>
          <p className="text-md leading-6 text-black/75">
            {graph.demo.caseContext.objectives.ours}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Metric label="Case health" value={`${graph.demo.meta.health}%`} />
            <Metric
              label="Trial readiness"
              value={`${graph.demo.meta.trialReadiness}%`}
            />
            <Metric
              label="Pending proposals"
              value={String(graph.proposedRecords.length)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-amber-700" />
              <h2 className="font-serif text-lg">Main Risk</h2>
            </div>
            <p className="mt-2 text-md leading-6 text-black/75">
              {graph.demo.caseContext.objectives.biggestCurrentRisk}
            </p>
          </div>
          <div className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-black/65" />
              <h2 className="font-serif text-lg">Their Objective</h2>
            </div>
            <p className="mt-2 text-md leading-6 text-black/75">
              {graph.demo.caseContext.objectives.theirs}
            </p>
          </div>
        </div>

        {attentionRecords.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg">Needs Attention</h2>
              <button
                type="button"
                className="rounded-lg border border-amber-200 bg-white/80 px-3 py-1.5 text-sm text-amber-800 transition-colors hover:bg-amber-100"
                onClick={() => onSelectView("review")}
              >
                Open review queue
              </button>
            </div>
            <p className="mt-1 text-sm text-black/65">
              Records flagged for source review, missing support, date
              conflicts, or pending replacement.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {attentionRecords.slice(0, 6).map((record) => (
                <RecordChip
                  key={record.id}
                  record={record}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <h2 className="font-serif text-lg">High-Priority Work</h2>
          <div className="mt-3 flex flex-col gap-1.5">
            {highPriorityRecords.map((record) => (
              <RecordChip
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <h2 className="font-serif text-lg">Workspace Activity</h2>
          <div className="mt-3 flex flex-col gap-2">
            {graph.demo.activity.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-black/15 bg-white/75 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-black/65">
                  <span>{item.actor}</span>
                  <span>{item.time}</span>
                </div>
                <p className="mt-1.5 text-sm leading-5 text-black/75">
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default OverviewView;
