import {
  AlertCircle,
  Clock,
  FileText,
  Gavel,
  HelpCircle,
  ListChecks,
  NotebookPen,
  Paperclip,
  Scale,
  Sparkles,
  SquareCheckBig,
  TriangleAlert,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { CaseSummarySectionType } from "#/types/caseRecords";
import {
  caseDisplayName,
  caseForumLabel,
  caseIdentifierDisplayLabel,
  caseStageLabel,
} from "#/lib/caseContext";
import {
  REVIEW_SEVERITY_DOT_CLASSES,
  REVIEW_SEVERITY_LABELS,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";

import { EmptyState } from "../common";
import { reviewQueue, formatDate, latestCaseSummary } from "../helpers";
import RecordChip from "../RecordChip";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

// Icon per case-brief section, so each block reads at a glance.
const SECTION_ICON: Record<CaseSummarySectionType, LucideIcon> = {
  OVERVIEW: FileText,
  FACTS: ListChecks,
  CLAIMS: Scale,
  ISSUES: AlertCircle,
  ARGUMENTS: Gavel,
  TIMELINE: Clock,
  EVIDENCE: Paperclip,
  RISKS: TriangleAlert,
  NEXT_STEPS: SquareCheckBig,
  OPEN_QUESTIONS: HelpCircle,
  CUSTOM: NotebookPen,
};

function GlanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-black/55">{label}</dt>
      <dd className="mt-0.5 text-sm leading-5 text-black/75">{value}</dd>
    </div>
  );
}

function OverviewView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const summary = latestCaseSummary(graph);
  const reviewRecords = reviewQueue(graph);

  const ctx = graph.demo.caseContext;
  const clientRole = ctx.representation.clientRole;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Case Brief — the evolving master summary, the page's hero */}
      <section className="rounded-xl border border-black/15 bg-white/65 p-4">
        <h2 className="font-serif text-lg">Case Brief</h2>
        {summary && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-black/55">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              AI-drafted brief · every claim links to a source record · Updated{" "}
              {formatDate(summary.summaryData.generatedAt)}
            </span>
          </p>
        )}

        {summary ? (
          <>
            <p className="mt-3 whitespace-pre-line text-md leading-6 text-black/75">
              {summary.summaryData.overview}
            </p>
            <div className="mt-4 flex flex-col gap-4">
              {summary.summaryData.sections.map((section) => {
                const Icon = SECTION_ICON[section.type];
                const records = (section.recordIds ?? []).flatMap((id) => {
                  const record = graph.recordsById.get(id);
                  return record ? [record] : [];
                });
                return (
                  <div key={section.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-black/60" />
                      <h3 className="text-sm font-medium text-black/70">
                        {section.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-black/70">
                      {section.content}
                    </p>
                    {records.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {records.map((record) => (
                          <RecordChip
                            key={record.id}
                            record={record}
                            graph={graph}
                            onOpenRecord={onOpenRecord}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState message="No case brief synthesized yet. The agent will generate one as records are accepted." />
          </div>
        )}
      </section>

      {/* Case at a Glance — the framing context */}
      <section className="rounded-xl border border-black/15 bg-white/65 p-4">
        <h2 className="font-serif text-lg">Case at a Glance</h2>
        <dl className="mt-3 flex flex-col gap-3">
          <GlanceRow label="Matter" value={caseDisplayName(ctx)} />
          <GlanceRow
            label="Identifier"
            value={caseIdentifierDisplayLabel(ctx)}
          />
          <GlanceRow label="Forum" value={caseForumLabel(ctx)} />
          <GlanceRow
            label="Procedural stage"
            value={caseStageLabel(ctx.proceduralStage)}
          />
          {ctx.currentPosture && (
            <GlanceRow label="Current posture" value={ctx.currentPosture} />
          )}
          <GlanceRow
            label={`${recordPartyLabel("ours", clientRole)} objective`}
            value={ctx.objectives.ours}
          />
          <GlanceRow
            label={`${recordPartyLabel("opposing", clientRole)} objective`}
            value={ctx.objectives.theirs}
          />
          <GlanceRow label="The dispute" value={ctx.claims.dispute} />
        </dl>
      </section>

      {/* Needs Attention — the agent-flagged review queue, most urgent first */}
      <section className="rounded-xl border border-black/15 bg-white/65 p-4">
        <h2 className="font-serif text-lg">Needs Attention</h2>
        {reviewRecords.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2.5">
            {reviewRecords.map((record) => {
              // reviewQueue gates on recordNeedsReview, so the flag is always set.
              const review = record.reviewNeeded!;
              return (
                <div
                  key={record.id}
                  className="rounded-lg border border-black/15 bg-white/75 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full border ${REVIEW_SEVERITY_DOT_CLASSES[review.severity]}`}
                      title={`${REVIEW_SEVERITY_LABELS[review.severity]} severity`}
                    />
                    <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-black/80">
                      {review.reason}
                    </p>
                    <span className="shrink-0 text-xs uppercase tracking-wide text-black/45">
                      {REVIEW_SEVERITY_LABELS[review.severity]}
                    </span>
                  </div>
                  {review.detail && (
                    <p className="mt-1 text-sm leading-5 text-black/65">
                      {review.detail}
                    </p>
                  )}
                  <div className="mt-2">
                    {/* The reason is the row title above, so suppress the chip's
                        own review triangle to avoid echoing it. */}
                    <RecordChip
                      record={record}
                      graph={graph}
                      onOpenRecord={onOpenRecord}
                      hidePill
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState message="Nothing needs attention right now." />
          </div>
        )}
      </section>

      {/* Workspace Activity */}
      <section className="rounded-xl border border-black/15 bg-white/65 p-4">
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
      </section>
    </div>
  );
}

export default OverviewView;
