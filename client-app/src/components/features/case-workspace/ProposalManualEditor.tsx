import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type {
  GraphLink,
  RecordLinkType,
  RecordParty,
  RecordSubstatus,
  RecordType,
  SupportStatus,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  isSymmetricLink,
  LINK_TYPE_LABEL_PAIRS,
  RECORD_DISPLAY_STATUS_CARD_CLASSES,
  RECORD_SUBSTATUS_LABELS,
  RECORD_TYPE_LABELS,
  SUPPORT_STATUS_LABELS,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";
import { TextInputField } from "#/components/features/create-case/fields";

import { recordDisplayStatus, recordMatchesSearch } from "./helpers";
import { StatusBadge } from "./RecordBadges";
import { displayRejectionReason } from "./LinkInfoPopover";
import { WorkPanelSearch } from "./RecordFilters";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Manual proposal editor (visual mock).
//
// A draft-editing surface for a PROPOSED record: hand-edit the common text
// fields and curate the proposal's knowledge-graph links (search + add, choose
// the relationship type and direction, write the rationale, delete). It does
// NOT submit the proposal — Save commits the working copy to the workspace
// graph's ephemeral session state and exits; Cancel discards. Nothing here is
// written back to the hardcoded demo module or server, so refresh restores the
// original test data.
// Only proposals reach this surface — accepted records are never hand-edited.
// ─────────────────────────────────────────────────────────────────────────────

export type ProposalDraft = {
  title: string;
  summary: string;
  content: string;
  category: string;
  supportStatus?: SupportStatus;
  supportStatusExplanation: string;
  substatus?: RecordSubstatus;
  party?: RecordParty;
  links: GraphLink[];
};

const LINK_TYPES = Object.keys(LINK_TYPE_LABEL_PAIRS) as RecordLinkType[];
const SUPPORT_STATUS_OPTIONS = Object.keys(
  SUPPORT_STATUS_LABELS,
) as SupportStatus[];
const PARTY_OPTIONS: RecordParty[] = ["ours", "opposing"];
const SUBSTATUS_OPTIONS_BY_TYPE: Partial<
  Record<RecordType, readonly RecordSubstatus[]>
> = {
  OBJECTIVE: ["ACTIVE", "AT_RISK", "ACHIEVED", "ABANDONED"],
  CLAIM: ["ASSERTED", "ANTICIPATED", "WITHDRAWN", "DISMISSED"],
  THEORY: ["ADOPTED", "EXPLORING", "BACKUP", "ABANDONED"],
  ISSUE: ["OPEN", "RESERVED", "RESOLVED"],
  ARGUMENT: ["DRAFT", "TRIAL_READY"],
  TASK: ["OPEN", "IN_PROGRESS", "DONE"],
  TESTIMONY: ["ANTICIPATED", "PREPARED", "GIVEN"],
  LEGAL_PRECEDENT: [
    "GOOD_LAW",
    "DISTINGUISHED",
    "QUESTIONED",
    "OVERRULED",
  ],
  NOTE: ["OPEN_QUESTION", "RESOLVED"],
};
const OPTIONAL_SUBSTATUS_TYPES = new Set<RecordType>([
  "LEGAL_PRECEDENT",
  "NOTE",
]);
const SUBSTATUS_FIELD_LABELS_BY_TYPE: Partial<Record<RecordType, string>> = {
  OBJECTIVE: "Objective state",
  CLAIM: "Claim posture",
  THEORY: "Theory posture",
  ISSUE: "Issue state",
  ARGUMENT: "Argument readiness",
  TASK: "Task progress",
  TESTIMONY: "Testimony stage",
  LEGAL_PRECEDENT: "Precedent treatment",
  NOTE: "Note state",
};

const compactSelectClass =
  "rounded-lg border border-black/15 bg-white/80 px-2 py-1 text-sm text-black/75 outline-none transition focus:border-black/30";

// Which end of an edge the proposal sits on, read from its perspective.
function linkDirectionFor(
  link: GraphLink,
  recordId: string,
): "outbound" | "inbound" {
  return link.fromRecordId === recordId ? "outbound" : "inbound";
}

function otherIdFor(link: GraphLink, recordId: string): string {
  return link.fromRecordId === recordId ? link.toRecordId : link.fromRecordId;
}

// Re-orient an edge so the proposal sits on the requested side, swapping the
// from/to endpoints (and their types) when the direction flips. The link type
// itself is canonical and unchanged — only which record reads as source moves.
function orientLink(
  link: GraphLink,
  recordId: string,
  direction: "outbound" | "inbound",
): GraphLink {
  const recordIsFrom = link.fromRecordId === recordId;
  const wantRecordFrom = direction === "outbound";
  if (recordIsFrom === wantRecordFrom) return link;
  return {
    ...link,
    fromRecordId: link.toRecordId,
    toRecordId: link.fromRecordId,
    fromRecordType: link.toRecordType,
    toRecordType: link.fromRecordType,
  };
}

// Build the proposal's incident links (both directions), de-duplicated by id.
function incidentLinks(graph: WorkspaceGraph, recordId: string): GraphLink[] {
  const seen = new Set<string>();
  const result: GraphLink[] = [];
  for (const link of [
    ...(graph.outboundLinks.get(recordId) ?? []),
    ...(graph.inboundLinks.get(recordId) ?? []),
  ]) {
    if (seen.has(link.id)) continue;
    seen.add(link.id);
    result.push(link);
  }
  return result;
}

function seedDraft(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): ProposalDraft {
  const substatusOptions = SUBSTATUS_OPTIONS_BY_TYPE[record.type];
  const substatus =
    record.substatus && substatusOptions?.includes(record.substatus)
      ? record.substatus
      : substatusOptions && !OPTIONAL_SUBSTATUS_TYPES.has(record.type)
        ? substatusOptions[0]
        : undefined;

  return {
    title: record.title,
    summary: record.summary ?? "",
    content: record.content,
    category: record.category ?? "",
    supportStatus: record.supportStatus,
    supportStatusExplanation: record.supportStatusExplanation ?? "",
    substatus,
    party: record.party === "neutral" ? undefined : record.party,
    links: incidentLinks(graph, record.id),
  };
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-xs text-black/60">{children}</span>;
}

function RecordAttributeEditor({
  record,
  graph,
  draft,
  onChange,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  draft: ProposalDraft;
  onChange: (next: Partial<ProposalDraft>) => void;
}) {
  const substatusOptions = SUBSTATUS_OPTIONS_BY_TYPE[record.type];
  const substatusIsOptional = OPTIONAL_SUBSTATUS_TYPES.has(record.type);
  const clientRole = graph.demo.caseContext.representation.clientRole;
  const substatusFieldLabel =
    SUBSTATUS_FIELD_LABELS_BY_TYPE[record.type] ??
    `${RECORD_TYPE_LABELS[record.type]} state`;

  return (
    <div className="mt-5 rounded-lg border border-black/15 bg-black/[0.025] p-3">
      <p className="mb-2 text-xs text-black/65">Record attributes</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Side</FieldLabel>
          <select
            className={compactSelectClass}
            value={draft.party ?? ""}
            onChange={(event) =>
              onChange({
                party: event.target.value
                  ? (event.target.value as RecordParty)
                  : undefined,
              })
            }
          >
            <option value="">No party</option>
            {PARTY_OPTIONS.map((party) => (
              <option key={party} value={party}>
                {recordPartyLabel(party, clientRole)}
              </option>
            ))}
          </select>
          <p className="text-xs leading-4 text-black/45">
            Which side this record mainly concerns. Leave blank when it is not
            tied to either party.
          </p>
        </label>

        {substatusOptions && (
          <label className="flex flex-col gap-1.5">
            <FieldLabel>{substatusFieldLabel}</FieldLabel>
            <select
              className={compactSelectClass}
              value={
                draft.substatus ??
                (substatusIsOptional ? "" : substatusOptions[0])
              }
              onChange={(event) =>
                onChange({
                  substatus: event.target.value
                    ? (event.target.value as RecordSubstatus)
                    : undefined,
                })
              }
            >
              {substatusIsOptional && (
                <option value="">
                  No {substatusFieldLabel.toLowerCase()}
                </option>
              )}
              {substatusOptions.map((substatus) => (
                <option key={substatus} value={substatus}>
                  {RECORD_SUBSTATUS_LABELS[substatus]}
                </option>
              ))}
            </select>
            <p className="text-xs leading-4 text-black/45">
              Where this record sits in its own workflow or legal lifecycle.
            </p>
          </label>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Evidence support</FieldLabel>
          <select
            className={compactSelectClass}
            value={draft.supportStatus ?? ""}
            onChange={(event) =>
              onChange({
                supportStatus: event.target.value
                  ? (event.target.value as SupportStatus)
                  : undefined,
                ...(event.target.value ? {} : { supportStatusExplanation: "" }),
              })
            }
          >
            <option value="">No evidence support</option>
            {SUPPORT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {SUPPORT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <p className="text-xs leading-4 text-black/45">
            How strongly the current record graph supports this record's
            identity, role, or assertion.
          </p>
        </div>

        <TextAreaField
          className="w-full sm:col-span-2"
          label="Support rationale"
          description={
            draft.supportStatus
              ? undefined
              : "Choose an evidence support level before adding a rationale."
          }
          placeholder="Why is this support level appropriate? Cite the evidence, conflict, or gap."
          value={draft.supportStatus ? draft.supportStatusExplanation : ""}
          onChange={(event) =>
            onChange({ supportStatusExplanation: event.target.value })
          }
          rows={2}
          minRows={2}
          maxRows={4}
          disabled={!draft.supportStatus}
        />
      </div>
    </div>
  );
}

// Small read-only chip for the "other" record on a link — mirrors the type tag
// + title of a RecordChip but is inert (no navigation while editing). Accepts a
// minimal shape so a dangling-reference fallback can be rendered without a full
// record.
function OtherRecordTag({
  record,
}: {
  record: { type: RecordType; title: string };
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
        {RECORD_TYPE_LABELS[record.type]}
      </span>
      <span className="min-w-0 truncate text-sm text-black/75">
        {record.title}
      </span>
    </span>
  );
}

// One editable edge: the related record, a relationship-type select, a
// direction toggle whose two options ARE the live forward/inverse phrasings, an
// explanation, and a delete. The phrasing line always anchors "This record" on
// the left; inverse direction flips the arrows instead of moving the records.
function LinkEditorRow({
  link,
  recordId,
  graph,
  onChange,
  onRemove,
}: {
  link: GraphLink;
  recordId: string;
  graph: WorkspaceGraph;
  onChange: (next: GraphLink) => void;
  onRemove: () => void;
}) {
  const direction = linkDirectionFor(link, recordId);
  const other = graph.recordsById.get(otherIdFor(link, recordId));
  const otherType =
    direction === "outbound" ? link.toRecordType : link.fromRecordType;
  const pair = LINK_TYPE_LABEL_PAIRS[link.type];
  const symmetric = isSymmetricLink(link.type);
  // Phrasing always uses the canonical (forward) verb; direction is carried by
  // the arrows so "This record" stays anchored on the left while editing.
  const verb = pair.forward;
  const otherTitle = other?.title ?? "Unknown record";
  const ThisRecord = (
    <span className="font-medium text-black/75">This record</span>
  );
  const OtherRecord = (
    <span className="min-w-0 truncate text-black/70">{otherTitle}</span>
  );
  const Arrow = symmetric
    ? ArrowLeftRight
    : direction === "outbound"
      ? ArrowRight
      : ArrowLeft;
  const missingReason = !link.explanation.trim();
  // Reflect the linked record's status in the row, in the same language as
  // RecordCard: the card-surface wash plus the resolved status pill (a frozen
  // record reads red, a replaced one gray, etc.). The reason is shown for a
  // frozen-and-not-replaced ("Rejected") record so the human sees why it stands.
  const otherDisplayStatus = other
    ? recordDisplayStatus(other, graph)
    : undefined;
  const rejectionReason =
    otherDisplayStatus === "REJECTED" ? other?.rejectionReason : undefined;

  return (
    <div
      className={`rounded-lg border p-2.5 ${
        otherDisplayStatus
          ? RECORD_DISPLAY_STATUS_CARD_CLASSES[otherDisplayStatus]
          : "border-black/15 bg-white/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <OtherRecordTag
            record={other ?? { type: otherType, title: "Unknown record" }}
          />
          {otherDisplayStatus && <StatusBadge status={otherDisplayStatus} />}
        </div>
        <button
          type="button"
          aria-label="Remove link"
          className="shrink-0 rounded-md p-1 text-black/45 transition-colors hover:bg-black/10 hover:text-red-700"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {rejectionReason && (
        <p className="mt-1.5 text-xs leading-snug text-red-800/90 line-clamp-2">
          <span className="font-medium">Rejected:</span>{" "}
          {displayRejectionReason(rejectionReason)}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className={compactSelectClass}
          value={link.type}
          onChange={(event) =>
            onChange({ ...link, type: event.target.value as RecordLinkType })
          }
        >
          {LINK_TYPES.map((type) => {
            const labels = LINK_TYPE_LABEL_PAIRS[type];
            return (
              <option key={type} value={type}>
                {labels.forward === labels.inverse
                  ? labels.forward
                  : `${labels.forward} / ${labels.inverse}`}
              </option>
            );
          })}
        </select>

        {/* Direction toggle — the two pills are the actual forward / inverse
            phrasings, so picking one both sets orientation and shows how the
            edge will read from this record. Hidden for symmetric links, which
            read the same either way. */}
        {!symmetric && (
          <div className="inline-flex overflow-hidden rounded-lg border border-black/15">
            {(["outbound", "inbound"] as const).map((option, index) => {
              const active = direction === option;
              const label = option === "outbound" ? pair.forward : pair.inverse;
              return (
                <button
                  key={option}
                  type="button"
                  className={`px-2 py-1 text-sm transition-colors ${
                    index > 0 ? "border-l border-black/15" : ""
                  } ${
                    active
                      ? "bg-black/10 text-black/80"
                      : "bg-white/60 text-black/55 hover:bg-black/5"
                  }`}
                  onClick={() => onChange(orientLink(link, recordId, option))}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* "This record" stays fixed on the left; inverse direction flips both
          arrows so the relationship can be read without the row jumping around.
          Symmetric links use a ↔. */}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-black/55">
        {ThisRecord}
        <Arrow className="h-3 w-3 shrink-0 text-black/30" />
        <span className="shrink-0 font-medium text-black/75">{verb}</span>
        <Arrow className="h-3 w-3 shrink-0 text-black/30" />
        {OtherRecord}
      </p>

      <div className="mt-2">
        <TextAreaField
          className="w-full"
          label="Why are they related?"
          placeholder="State the rationale for this edge — every link must say why it exists."
          value={link.explanation}
          onChange={(event) =>
            onChange({ ...link, explanation: event.target.value })
          }
          rows={2}
          minRows={2}
        />
        {missingReason && (
          <p className="mt-1 text-xs text-amber-700">
            Add a reason before saving.
          </p>
        )}
      </div>
    </div>
  );
}

// Search-and-pick a record to link. Filters the workspace by text; checkboxes opt
// proposed and rejected (frozen) records into the candidate set (both off by
// default — links usually attach to authoritative records). Replaced records are
// retired version history and are never offered, even one that was also rejected.
function LinkSearchPicker({
  record,
  graph,
  existingOtherIds,
  onPick,
  onClose,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  existingOtherIds: Set<string>;
  onPick: (target: TypedCaseRecord) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [includeProposed, setIncludeProposed] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(false);
  const clientRole = graph.demo.caseContext.representation.clientRole;
  const searchTerm = query.trim();

  const candidates = useMemo(() => {
    if (!searchTerm) return [];

    return graph.records
      .filter((candidate) => {
        if (candidate.id === record.id) return false;
        if (existingOtherIds.has(candidate.id)) return false;
        const status = graph.effectiveStatus(candidate);
        // Replaced records are retired version history — never linkable. Checked
        // first so a rejected-then-superseded record stays out regardless.
        if (status === "REPLACED") return false;
        // Frozen reads as "Rejected"; gate it behind its own toggle rather than
        // the proposed one, whatever lifecycle sits underneath.
        if (graph.recordIsFrozen(candidate)) {
          if (!includeRejected) return false;
        } else if (status === "PROPOSED" && !includeProposed) {
          return false;
        }
        return recordMatchesSearch(candidate, searchTerm, clientRole);
      })
      .slice(0, 12);
  }, [
    graph,
    record.id,
    existingOtherIds,
    includeProposed,
    includeRejected,
    searchTerm,
    clientRole,
  ]);

  return (
    <div className="rounded-lg border border-black/15 bg-black/[0.025] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-black/65">Link a record</p>
        <button
          type="button"
          aria-label="Close link search"
          className="rounded-md p-1 text-black/45 transition-colors hover:bg-black/10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2">
        <WorkPanelSearch
          value={query}
          onChange={setQuery}
          placeholder="Search records to link…"
        />
      </div>

      <div className="mt-2 flex flex-col items-start gap-1.5">
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#282828]"
            checked={includeProposed}
            onChange={(event) => setIncludeProposed(event.target.checked)}
          />
          Include proposed records
        </label>
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#282828]"
            checked={includeRejected}
            onChange={(event) => setIncludeRejected(event.target.checked)}
          />
          Include rejected records
        </label>
      </div>

      <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="px-1 py-2 text-sm text-black/50">
            {searchTerm ? "No matching records." : "Search to find records."}
          </p>
        ) : (
          candidates.map((candidate) => {
            const candidateDisplayStatus = recordDisplayStatus(candidate, graph);
            const candidateReason =
              candidateDisplayStatus === "REJECTED"
                ? candidate.rejectionReason
                : undefined;
            return (
              <button
                key={candidate.id}
                type="button"
                className={`group flex w-full flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-left transition-colors hover:border-black/30 ${RECORD_DISPLAY_STATUS_CARD_CLASSES[candidateDisplayStatus]}`}
                onClick={() => onPick(candidate)}
              >
                <div className="flex w-full items-center gap-2">
                  <OtherRecordTag record={candidate} />
                  <StatusBadge status={candidateDisplayStatus} />
                  <Plus className="ml-auto h-4 w-4 shrink-0 text-black/30 group-hover:text-black/70" />
                </div>
                {candidateReason && (
                  <p className="text-xs leading-snug text-red-800/90 line-clamp-2">
                    <span className="font-medium">Rejected:</span>{" "}
                    {displayRejectionReason(candidateReason)}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProposalManualEditor({
  record,
  graph,
  onSave,
  onCancel,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onSave: (draft: ProposalDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProposalDraft>(() =>
    seedDraft(record, graph),
  );
  const [picking, setPicking] = useState(false);

  const existingOtherIds = useMemo(
    () => new Set(draft.links.map((link) => otherIdFor(link, record.id))),
    [draft.links, record.id],
  );

  const updateLink = (id: string, next: GraphLink) =>
    setDraft((prev) => ({
      ...prev,
      links: prev.links.map((link) => (link.id === id ? next : link)),
    }));

  const removeLink = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link.id !== id),
    }));

  const addLink = (target: TypedCaseRecord) => {
    const newLink: GraphLink = {
      id: `link-draft-${Date.now()}`,
      workspaceId: record.workspaceId,
      caseId: record.caseId,
      fromRecordId: record.id,
      fromRecordType: record.type,
      toRecordId: target.id,
      toRecordType: target.type,
      type: "RELATED_TO",
      status: "PROPOSED",
      strength: "MODERATE",
      explanation: "",
      createdAt: new Date().toISOString(),
    };
    setDraft((prev) => ({ ...prev, links: [newLink, ...prev.links] }));
    setPicking(false);
  };

  const hasUnexplainedLink = draft.links.some(
    (link) => !link.explanation.trim(),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-black/45">
            Editing proposal · {RECORD_TYPE_LABELS[record.type]}
          </p>
          <p className="mt-0.5 text-sm text-black/55">
            Changes stay on the draft and don't submit it for review.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <TextInputField
            className="w-full"
            label="Title"
            value={draft.title}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Record title"
          />
          <TextInputField
            className="w-full"
            label="Category"
            value={draft.category}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, category: event.target.value }))
            }
            placeholder="Free-form segmentation tag (optional)"
          />
          <TextAreaField
            className="w-full"
            label="Mini summary"
            value={draft.summary}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, summary: event.target.value }))
            }
            placeholder="Short blurb for cards and search."
            rows={2}
            minRows={2}
          />
          <TextAreaField
            className="w-full"
            label="Content"
            value={draft.content}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, content: event.target.value }))
            }
            placeholder="Full prose content."
            rows={6}
            minRows={6}
          />
        </div>

        <RecordAttributeEditor
          record={record}
          graph={graph}
          draft={draft}
          onChange={(next) => setDraft((prev) => ({ ...prev, ...next }))}
        />

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-black/65">
              <Link2 className="h-3.5 w-3.5" />
              Linked records ({draft.links.length})
            </p>
            {!picking && (
              <Button
                style="secondary"
                size="sm"
                icon={Plus}
                text="Add link"
                onClick={() => setPicking(true)}
              />
            )}
          </div>

          {picking && (
            <div className="mb-2">
              <LinkSearchPicker
                record={record}
                graph={graph}
                existingOtherIds={existingOtherIds}
                onPick={addLink}
                onClose={() => setPicking(false)}
              />
            </div>
          )}

          {draft.links.length === 0 ? (
            <div className="rounded-lg border border-black/15 bg-black/[0.025] p-3 text-sm text-black/50">
              No links yet. Add one to connect this proposal into the graph.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {draft.links.map((link) => (
                <LinkEditorRow
                  key={link.id}
                  link={link}
                  recordId={record.id}
                  graph={graph}
                  onChange={(next) => updateLink(link.id, next)}
                  onRemove={() => removeLink(link.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/15 bg-white/70 px-4 py-3">
        <span className="text-xs text-black/55">
          {hasUnexplainedLink
            ? "Every link needs a reason before you can save."
            : "Saving keeps this a draft — it won't go to review."}
        </span>
        <div className="flex items-center gap-2">
          <Button style="ghost" size="sm" text="Cancel" onClick={onCancel} />
          <Button
            style="primary"
            size="sm"
            icon="save"
            text="Save draft"
            disabled={hasUnexplainedLink}
            onClick={() => onSave(draft)}
          />
        </div>
      </div>
    </div>
  );
}

export default ProposalManualEditor;
