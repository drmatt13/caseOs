import type { ClientRole } from "#/types/caseDomain";
import type {
  CaseDocument,
  DatePrecision,
  TimelineEventRecord,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_STATUS_LABELS,
  RECORD_SUBSTATUS_CLASSES,
  RECORD_SUBSTATUS_LABELS,
  RECORD_TYPE_LABELS,
  SUPPORT_STATUS_CLASSES,
  SUPPORT_STATUS_LABELS,
  type RecordDisplayStatus,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";
import { TONES } from "#/lib/tones";

import type { WorkspaceGraph } from "./useWorkspaceGraph";

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Intl options per precision. Coarse precisions read as approximate;
// "minute"/"second" surface the time-of-day stored in `eventDate`.
const EVENT_DATE_FORMAT_OPTIONS: Record<
  DatePrecision,
  Intl.DateTimeFormatOptions
> = {
  year: { year: "numeric" },
  month: { month: "short", year: "numeric" },
  day: { month: "short", day: "numeric", year: "numeric" },
  minute: {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  second: {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  },
};

// Formats a timeline event's date at the granularity declared by its
// `datePrecision` (default "day"). When the event carries an `eventEndDate`, the
// two bounds render as a range with shared parts collapsed by Intl's native
// range formatter ("5:00 – 5:30 PM", "Jun 12–18, 1994"); otherwise it formats
// the single instant exactly as before.
export function formatEventDate(
  record: Pick<
    TimelineEventRecord,
    "eventDate" | "eventEndDate" | "datePrecision"
  >,
): string {
  const { eventDate, eventEndDate, datePrecision = "day" } = record;
  const start = new Date(eventDate);
  if (Number.isNaN(start.getTime())) return eventDate;

  const formatter = new Intl.DateTimeFormat(
    "en-US",
    EVENT_DATE_FORMAT_OPTIONS[datePrecision],
  );

  if (eventEndDate) {
    const end = new Date(eventEndDate);
    // Render a range only when the end bound is valid and genuinely later than
    // the start; a bad or non-advancing end falls back to the single instant.
    if (!Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
      return formatter.formatRange(start, end);
    }
  }
  return formatter.format(start);
}

// A ranged event is one with a valid end bound after its start. Used by the
// timeline to render an extent (a bar) rather than a single point (a dot).
export function isRangedEvent(
  record: Pick<TimelineEventRecord, "eventDate" | "eventEndDate">,
): boolean {
  if (!record.eventEndDate) return false;
  const start = new Date(record.eventDate).getTime();
  const end = new Date(record.eventEndDate).getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
}

export function isImageDocument(document: CaseDocument) {
  return Boolean(document.mimeType?.startsWith("image/"));
}

// Where in the source file a document record draws from. Images don't paginate,
// so they read as a region rather than a page range.
export function documentScopeLabel(
  record: Extract<TypedCaseRecord, { type: "DOCUMENT" }>,
  document: CaseDocument,
) {
  if (record.pageRange) {
    const { start, end } = record.pageRange;
    const pages = start === end ? `Page ${start}` : `Pages ${start}–${end}`;
    return document.pageCount ? `${pages} of ${document.pageCount}` : pages;
  }
  if (isImageDocument(document)) return "Image region";
  return document.pageCount
    ? `Whole file (${document.pageCount} pp.)`
    : "Whole file";
}

export function recordMatchesSearch(
  record: TypedCaseRecord,
  searchValue: string,
  clientRole: ClientRole,
) {
  const normalizedSearch = searchValue.trim().toLowerCase();
  if (normalizedSearch.length === 0) return true;

  return [
    RECORD_TYPE_LABELS[record.type],
    record.title,
    record.summary ?? "",
    record.content,
    record.category ?? "",
    record.substatus ? RECORD_SUBSTATUS_LABELS[record.substatus] : "",
    record.supportStatus ? SUPPORT_STATUS_LABELS[record.supportStatus] : "",
    record.party ? recordPartyLabel(record.party, clientRole) : "",
    // A proposed record that replaces reads as "Proposed Replacement"; index
    // that label so the term finds it (raw status alone would only say Proposed).
    record.status === "PROPOSED" && record.replacesIds?.length
      ? RECORD_DISPLAY_STATUS_LABELS.PROPOSED_REPLACEMENT
      : RECORD_STATUS_LABELS[record.status],
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

// Resolve a record to its display status — the lifecycle status, except a
// proposal that would replace an existing record reads as its own "Proposed
// Replacement" state (green badge, purple surface). The single source of truth
// for every status badge, card tint, and inspector wash, so links, cards, and
// the inspector never diverge.
export function recordDisplayStatus(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): RecordDisplayStatus {
  const status = graph.effectiveStatus(record);
  return status === "PROPOSED" && record.replacesIds?.length
    ? "PROPOSED_REPLACEMENT"
    : status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived attention + the single "resolved state" pill
// ─────────────────────────────────────────────────────────────────────────────

// An accepted record is "stale" once it has gone untouched past this window.
const STALE_AFTER_DAYS = 120;

function isStale(record: TypedCaseRecord): boolean {
  const ts = Date.parse(record.updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

// Whether a record needs human action, DERIVED from the structured axes rather
// than a hand-set flag: weak/conflicting evidence, a blocking/at-risk phase, bad
// law, an unverified citation, or staleness. Returns a short reason label (used
// directly as the attention pill text) or null. This is the reasoning-friendly
// replacement for the old hand-maintained ATTENTION_SUBSTATUSES list.
export function recordAttention(record: TypedCaseRecord): string | null {
  const support = record.supportStatus;
  if (support === "CONFLICTED") return "Conflicted";
  if (support === "UNSUPPORTED") return "Unsupported";
  if (support === "UNKNOWN") return "Unverified";

  const sub = record.substatus;
  if (sub === "BLOCKED") return "Blocked";
  if (sub === "AT_RISK") return "At risk";
  if (sub === "OVERRULED") return "Overruled";
  if (sub === "QUESTIONED") return "Questioned";
  if (sub === "OPEN_QUESTION") return "Open question";

  if (record.type === "LEGAL_PRECEDENT" && record.citeChecked === false)
    return "Needs cite check";

  if (isStale(record)) return "Stale";
  return null;
}

// True when a live (non-replaced, non-rejected) record needs attention. The
// single source of truth for the Overview "Needs Attention" panel.
export function needsAttention(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): boolean {
  const status = graph.effectiveStatus(record);
  if (status === "REPLACED" || status === "REJECTED") return false;
  return recordAttention(record) !== null;
}

// The ONE pill a dense view (card / chip) shows for a record, chosen by a
// priority cascade so a record never wears a stack of competing badges:
//   review status (if unsettled) → attention → support → phase
// Returns null when an accepted, well-grounded record has nothing to flag — its
// calm blankness is itself the "settled" signal. The full decomposition (every
// axis at once) lives in the inspector, not here.
export function resolveStatePill(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): { label: string; className: string } | null {
  const displayStatus = recordDisplayStatus(record, graph);
  if (displayStatus !== "ACCEPTED") {
    return {
      label: RECORD_DISPLAY_STATUS_LABELS[displayStatus],
      className: RECORD_DISPLAY_STATUS_CLASSES[displayStatus],
    };
  }

  const attention = recordAttention(record);
  if (attention) return { label: attention, className: TONES.caution.badge };

  if (record.supportStatus === "PARTIALLY_SUPPORTED") {
    return {
      label: SUPPORT_STATUS_LABELS.PARTIALLY_SUPPORTED,
      className: SUPPORT_STATUS_CLASSES.PARTIALLY_SUPPORTED,
    };
  }

  if (record.substatus) {
    return {
      label: RECORD_SUBSTATUS_LABELS[record.substatus],
      className: RECORD_SUBSTATUS_CLASSES[record.substatus],
    };
  }

  return null;
}
