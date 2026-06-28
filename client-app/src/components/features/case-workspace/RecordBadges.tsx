import { Info, TriangleAlert } from "lucide-react";

import type { ClientRole } from "#/types/caseDomain";
import type { TypedCaseRecord } from "#/types/caseRecords";
import {
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_PARTY_CLASSES,
  RECORD_SUBSTATUS_CLASSES,
  RECORD_SUBSTATUS_LABELS,
  REVIEW_URGENCY_LABELS,
  REVIEW_SEVERITY_ICON_CLASSES,
  SUPPORT_STATUS_CLASSES,
  SUPPORT_STATUS_LABELS,
  type RecordDisplayStatus,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";

import { resolveStatePill } from "./helpers";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  );
}

// The single resolved state pill for dense views (cards). One pill, chosen by
// cascade — never a stack. See resolveStatePill for the priority order.
export function StatePill({
  record,
  graph,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
}) {
  const resolved = resolveStatePill(record, graph);
  if (!resolved) return null;
  return <Pill label={resolved.label} className={resolved.className} />;
}

export function StatusBadge({ status }: { status: RecordDisplayStatus }) {
  // Accepted is the authoritative default — it wears no badge. Its absence,
  // alongside Proposed / Pending Replacement, is the signal. Only unsettled
  // states are labeled.
  if (status === "ACCEPTED") return null;
  // "Proposed Replacement" is the record card's identity alone (see
  // resolveStatePill / RecordCard, where the violet pill and violet card surface
  // read as one object). Every other surface — the inspector, PeopleView —
  // collapses it to a plain "Proposed"; replacement context is carried by the
  // ReplacementNotice instead.
  const resolved = status === "PROPOSED_REPLACEMENT" ? "PROPOSED" : status;
  return (
    <Pill
      label={RECORD_DISPLAY_STATUS_LABELS[resolved]}
      className={RECORD_DISPLAY_STATUS_CLASSES[resolved]}
    />
  );
}

// The record's domain lifecycle ("phase"). Lifecycle-only now — no review
// coloring (that's the separate review triangle). Shown in the inspector's full
// decomposition.
export function SubstatusBadge({ record }: { record: TypedCaseRecord }) {
  if (!record.substatus) return null;
  return (
    <Pill
      label={RECORD_SUBSTATUS_LABELS[record.substatus]}
      className={RECORD_SUBSTATUS_CLASSES[record.substatus]}
    />
  );
}

// Evidentiary grounding. Shown in the inspector's full decomposition.
export function SupportBadge({ record }: { record: TypedCaseRecord }) {
  if (!record.supportStatus) return null;
  return (
    <Pill
      label={SUPPORT_STATUS_LABELS[record.supportStatus]}
      className={SUPPORT_STATUS_CLASSES[record.supportStatus]}
    />
  );
}

// The agent-attached "needs review" flag, shown in dense views as a small
// severity-tinted status icon. It is passive status, not its own button: the
// card or chip around it owns navigation.
export function ReviewFlagIcon({
  record,
  className = "",
}: {
  record: TypedCaseRecord;
  className?: string;
}) {
  const flag = record.reviewNeeded;
  if (!flag) return null;
  const title = `Needs review (${REVIEW_URGENCY_LABELS[flag.severity].toLowerCase()}): ${flag.reason}`;
  const Icon = flag.severity === "low" ? Info : TriangleAlert;
  return (
    <span
      role="img"
      title={title}
      aria-label={title}
      className="inline-flex"
    >
      <Icon
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 ${REVIEW_SEVERITY_ICON_CLASSES[flag.severity]} ${className}`}
      />
    </span>
  );
}

export function PartyBadge({
  record,
  clientRole,
}: {
  record: TypedCaseRecord;
  clientRole: ClientRole;
}) {
  if (!record.party || record.party === "neutral") return null;

  return (
    <Pill
      label={recordPartyLabel(record.party, clientRole)}
      className={RECORD_PARTY_CLASSES[record.party]}
    />
  );
}
