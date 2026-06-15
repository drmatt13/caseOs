import type { ClientRole } from "#/types/caseDomain";
import type { CaseDocument, TypedCaseRecord } from "#/types/caseRecords";
import {
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_STATUS_LABELS,
  RECORD_SUBSTATUS_LABELS,
  RECORD_TYPE_LABELS,
  type RecordDisplayStatus,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";

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
