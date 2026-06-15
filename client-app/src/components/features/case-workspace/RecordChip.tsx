import { ChevronRight, Repeat } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import {
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_TYPE_LABELS,
} from "#/lib/caseRecordPresentation";

import { recordDisplayStatus } from "./helpers";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// Clickable reference to another record — the core graph-traversal affordance.
// The chip stays neutral white; lifecycle is carried entirely by the colored
// status pill on the right, so a list of links reads as one calm column with
// the standing of each target legible at a glance. The left tag is the record
// type (gray, tight radius); the right pill is the lifecycle status (colored,
// full radius). When `isCycle` is set the target is already open higher in the
// inspector path, so the chip is grayed and flagged for a circular dependency.
function RecordChip({
  record,
  graph,
  onOpenRecord,
  isCycle = false,
  pairedReplacement = false,
  showPendingReplacement = false,
  hidePill = false,
  hideProposedReplacementPill = false,
  allowCycleNavigation = false,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  isCycle?: boolean;
  // True only where the replaced counterpart is shown right alongside (the
  // "replaced by" pairing). On a lone chip a Proposed Replacement reads as a
  // plain blue "Proposed" link — without its counterpart the replacement
  // framing is just noise.
  pairedReplacement?: boolean;
  // True inside ReplacementNotice ("This proposal would replace:") —
  // the only context where "Pending Replacement" badge belongs on a link.
  showPendingReplacement?: boolean;
  // Hard override: suppress every right-side pill, including cycle state.
  hidePill?: boolean;
  // True when the surrounding copy already explains replacement context and
  // the green "Proposed Replacement" pill would repeat the same signal.
  hideProposedReplacementPill?: boolean;
  // Version-history chips can point back to a record already in the inspector
  // path. In that case clicking jumps back to that record instead of looping.
  allowCycleNavigation?: boolean;
}) {
  let displayStatus = recordDisplayStatus(record, graph);
  if (displayStatus === "PROPOSED_REPLACEMENT" && !pairedReplacement) {
    displayStatus = "PROPOSED";
  }
  const cycleLocked = isCycle && !allowCycleNavigation;
  const hideProposedReplacementStatus =
    displayStatus === "PROPOSED_REPLACEMENT" && hideProposedReplacementPill;
  // Accepted links wear no pill (their calm absence reads as "settled").
  // Pending-replacement links are also pill-free in general link lists — the
  // amber badge belongs only inside "This proposal would replace:" where the
  // relationship is already framed by the container.
  // Cycle chips show "In path" unless the hard pill override is set.
  const showPill =
    !hidePill &&
    (isCycle ||
      (!hideProposedReplacementStatus &&
        displayStatus !== "ACCEPTED" &&
        (displayStatus !== "PENDING_REPLACEMENT" || showPendingReplacement)));

  return (
    <button
      type="button"
      title={
        cycleLocked
          ? "Already open in this path — following it again would loop"
          : record.title
      }
      className={`group flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${
        cycleLocked
          ? "border-black/15 bg-black/[0.03] opacity-70 cursor-not-allowed"
          : isCycle
            ? "border-sky-700/20 bg-sky-50/35 hover:border-sky-800/30 hover:bg-sky-50/60"
            : "border-black/15 bg-white/80 hover:border-black/25 hover:bg-white"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenRecord(record.id);
      }}
      disabled={cycleLocked}
    >
      {/* Left tag: record type — tight radius, gray, reads as a category. */}
      <span className="min-w-0 max-w-28 shrink rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
        <span className="block truncate">
          {RECORD_TYPE_LABELS[record.type]}
        </span>
      </span>
      <span
        className={`min-w-0 flex-1 truncate ${
          cycleLocked ? "text-black/55" : "text-black/75 group-hover:text-black"
        }`}
      >
        {record.title}
      </span>
      {/* Right pill: lifecycle — full radius + color, matching StatusBadge.
          Accepted shows none; its absence is the "settled" signal. */}
      {!hidePill && isCycle ? (
        <span className="ml-auto inline-flex min-w-0 max-w-24 shrink items-center gap-1 rounded-full border border-black/15 bg-black/[0.04] px-2 py-0.5 text-xs text-black/55">
          <Repeat className="h-3 w-3" />
          <span className="truncate">In path</span>
        </span>
      ) : showPill ? (
        <span
          className={`ml-auto min-w-0 max-w-36 shrink rounded-full border px-2 py-0.5 text-xs ${RECORD_DISPLAY_STATUS_CLASSES[displayStatus]}`}
        >
          <span className="block truncate">
            {RECORD_DISPLAY_STATUS_LABELS[displayStatus]}
          </span>
        </span>
      ) : null}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 text-black/30 group-hover:text-black/70 ${
          showPill ? "" : "ml-auto"
        }`}
      />
    </button>
  );
}

export default RecordChip;
