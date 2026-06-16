import { ChevronRight, Repeat } from "lucide-react";

import type { GraphLink, TypedCaseRecord } from "#/types/caseRecords";
import {
  RECORD_CHIP_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_TYPE_LABELS,
} from "#/lib/caseRecordPresentation";

import { recordDisplayStatus } from "./helpers";
import LinkInfoPopover from "./LinkInfoPopover";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// Clickable reference to another record — the core graph-traversal affordance.
// The chip shell gets a light status wash, while the right pill carries the
// resolved display status. Pending-replacement records stay visually accepted
// unless the caller opts into the replacement context. The left tag is the
// record type (gray, tight radius); the right pill is the lifecycle status
// (colored, full radius). When `isCycle` is set the target is already open in
// the current inspector path, so the chip is locked: grayed, non-interactive,
// and flagged "In path". This lock is uniform across every surface that renders
// a chip — knowledge-graph links, replacement notices, version history, and
// sibling documents all follow the same rule, so a reference can never loop the
// path.
function RecordChip({
  record,
  graph,
  onOpenRecord,
  isCycle = false,
  pairedReplacement = false,
  showPendingReplacement = false,
  hidePill = false,
  hideProposedReplacementPill = false,
  link,
  linkDirection = "outbound",
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  // True when the target is already open in the current inspector path (an
  // ancestor, or the record itself). Following it again would loop, so the chip
  // is locked: grayed, disabled, and flagged "In path".
  isCycle?: boolean;
  // True only where the replaced counterpart is shown right alongside (the
  // "replaced by" pairing). On a lone chip a Proposed Replacement reads as a
  // plain blue "Proposed" link — without its counterpart the replacement
  // framing is just noise.
  pairedReplacement?: boolean;
  // Surfaces the amber "Pending Replacement" badge on a link, normally
  // suppressed in general link lists. RecordLinksPanel opts in only when it
  // will render the visible successor record(s) directly beneath the chip.
  showPendingReplacement?: boolean;
  // Suppress the right-side status pill (e.g. version-history predecessors read
  // calmer without one). Does NOT suppress the "In path" cycle pill — a locked
  // chip must always explain why it can't be followed.
  hidePill?: boolean;
  // True when the surrounding copy already explains replacement context and
  // the proposed pill would repeat the same signal.
  hideProposedReplacementPill?: boolean;
  // The graph edge this chip was reached through. When provided, a small Info
  // affordance is rendered beside the chip that opens the edge's explanation.
  // Absent on non-link surfaces (version history, sibling docs, overview, agent
  // proposals), so no icon appears there.
  link?: GraphLink;
  // Which phrasing the explanation popover uses: "outbound" (the viewed record
  // is the source) or "inbound" (it is the target). Only meaningful with `link`.
  linkDirection?: "outbound" | "inbound";
}) {
  const effectiveStatus = graph.effectiveStatus(record);
  let displayStatus = recordDisplayStatus(record, graph);
  if (displayStatus === "PROPOSED_REPLACEMENT" && !pairedReplacement) {
    displayStatus = "PROPOSED";
  }
  const pillDisplayStatus =
    displayStatus === "PROPOSED_REPLACEMENT" ? "PROPOSED" : displayStatus;
  const hideProposedReplacementStatus =
    displayStatus === "PROPOSED_REPLACEMENT" && hideProposedReplacementPill;
  const chipStatus =
    displayStatus === "PENDING_REPLACEMENT" && showPendingReplacement
      ? "PENDING_REPLACEMENT"
      : effectiveStatus === "PENDING_REPLACEMENT"
        ? "ACCEPTED"
        : effectiveStatus;
  const chipStatusClass = RECORD_CHIP_STATUS_CLASSES[chipStatus];
  // Accepted links wear no pill (their calm absence reads as "settled").
  // Pending-replacement links are also pill-free unless the caller can show the
  // visible replacement records in context. `hidePill` suppresses it outright.
  // A cycle replaces the status pill with the "In path" lock badge, so the
  // status pill never competes with it.
  const showStatusPill =
    !isCycle &&
    !hidePill &&
    !hideProposedReplacementStatus &&
    displayStatus !== "ACCEPTED" &&
    (displayStatus !== "PENDING_REPLACEMENT" || showPendingReplacement);
  const showAnyPill = isCycle || showStatusPill;

  const chipButton = (
    <button
      type="button"
      title={
        isCycle
          ? "Already open in this path — following it again would loop"
          : record.title
      }
      className={`group flex ${
        link ? "flex-1" : "w-full"
      } min-w-0 items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${
        isCycle
          ? "border-black/15 bg-black/[0.03] opacity-70 cursor-not-allowed"
          : chipStatusClass
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenRecord(record.id);
      }}
      disabled={isCycle}
    >
      {/* Left tag: record type — tight radius, gray, reads as a category. */}
      <span className="min-w-0 shrink rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
        <span className="block">{RECORD_TYPE_LABELS[record.type]}</span>
      </span>
      <span
        className={`min-w-0 flex-1 truncate ${
          isCycle ? "text-black/55" : "text-black/75 group-hover:text-black"
        }`}
      >
        {record.title}
      </span>
      {/* Right pill: "In path" when the target is locked (cycle), otherwise the
          lifecycle status. The cycle badge is shown even when `hidePill` is set,
          because a disabled chip must explain why it can't be followed. Accepted
          shows none; its absence is the "settled" signal. */}
      {isCycle ? (
        <span className="ml-auto inline-flex min-w-0 max-w-24 shrink items-center gap-1 rounded-full border border-black/15 bg-black/[0.04] px-2 py-0.5 text-xs text-black/55">
          <Repeat className="h-3 w-3" />
          <span className="truncate">In path</span>
        </span>
      ) : showStatusPill ? (
        <span
          className={`ml-auto min-w-0 max-w-36 shrink rounded-full border px-2 py-0.5 text-xs ${RECORD_DISPLAY_STATUS_CLASSES[pillDisplayStatus]}`}
        >
          <span className="block truncate">
            {RECORD_DISPLAY_STATUS_LABELS[pillDisplayStatus]}
          </span>
        </span>
      ) : null}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 text-black/30 group-hover:text-black/70 ${
          showAnyPill ? "" : "ml-auto"
        }`}
      />
    </button>
  );

  // Non-link surfaces render the bare chip — byte-identical to before.
  if (!link) return chipButton;

  // With an edge in hand, pair the chip with its explanation affordance. The
  // chip flexes to fill the row; the Info button sits alongside and stays
  // interactive even when the chip is a locked cycle — the *why* of an edge is
  // still worth reading when you can't traverse it.
  return (
    <div className="group/chiprow flex w-full min-w-0 items-stretch gap-1">
      {chipButton}
      <LinkInfoPopover link={link} direction={linkDirection} graph={graph} />
    </div>
  );
}

export default RecordChip;
