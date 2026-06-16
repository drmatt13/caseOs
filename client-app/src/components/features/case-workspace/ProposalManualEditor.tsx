import { useMemo, useState } from "react";
import { ArrowRight, Link2, Plus, Trash2, X } from "lucide-react";

import type {
  GraphLink,
  RecordLinkType,
  RecordType,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  LINK_TYPE_LABEL_PAIRS,
  linkTypeLabel,
  RECORD_TYPE_LABELS,
} from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";
import { TextInputField } from "#/components/features/create-case/fields";

import { recordMatchesSearch } from "./helpers";
import { WorkPanelSearch } from "./RecordFilters";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Manual proposal editor (visual mock).
//
// A draft-editing surface for a PROPOSED record: hand-edit the common text
// fields and curate the proposal's knowledge-graph links (search + add, choose
// the relationship type and direction, write the rationale, delete). It does
// NOT submit the proposal — Save commits the working copy to the inspector's
// ephemeral session cache and exits; Cancel discards. Nothing here is written
// back into the graph or demo.links: this is a UI mock, and the ephemeral cache
// exists only so "save and edit again later" reads believably within a session.
// Only proposals reach this surface — accepted records are never hand-edited.
// ─────────────────────────────────────────────────────────────────────────────

export type ProposalDraft = {
  title: string;
  summary: string;
  content: string;
  category: string;
  links: GraphLink[];
};

const LINK_TYPES = Object.keys(LINK_TYPE_LABEL_PAIRS) as RecordLinkType[];

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
  return {
    title: record.title,
    summary: record.summary ?? "",
    content: record.content,
    category: record.category ?? "",
    links: incidentLinks(graph, record.id),
  };
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
// explanation, and a delete. The phrasing line reads "This record → <verb> →
// <other>" so direction is never ambiguous.
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
  const verb = linkTypeLabel(link.type, direction);
  const missingReason = !link.explanation.trim();

  return (
    <div className="rounded-lg border border-black/15 bg-white/70 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <OtherRecordTag
          record={other ?? { type: otherType, title: "Unknown record" }}
        />
        <button
          type="button"
          aria-label="Remove link"
          className="shrink-0 rounded-md p-1 text-black/45 transition-colors hover:bg-black/10 hover:text-red-700"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

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
            edge will read from this record. */}
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
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-black/55">
        <span className="text-black/70">This record</span>
        <ArrowRight className="h-3 w-3 text-black/30" />
        <span className="font-medium text-black/75">{verb}</span>
        <ArrowRight className="h-3 w-3 text-black/30" />
        <span className="min-w-0 truncate text-black/70">
          {other?.title ?? "Unknown record"}
        </span>
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

// Search-and-pick a record to link. Filters the workspace by text; a checkbox
// opts proposed records into the candidate set (off by default — links usually
// attach to authoritative records). Retired/rejected records are never offered.
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
  const clientRole = graph.demo.caseContext.representation.clientRole;
  const searchTerm = query.trim();

  const candidates = useMemo(() => {
    if (!searchTerm) return [];

    return graph.records
      .filter((candidate) => {
        if (candidate.id === record.id) return false;
        if (existingOtherIds.has(candidate.id)) return false;
        const status = graph.effectiveStatus(candidate);
        if (status === "REPLACED" || status === "REJECTED") return false;
        if (status === "PROPOSED" && !includeProposed) return false;
        return recordMatchesSearch(candidate, searchTerm, clientRole);
      })
      .slice(0, 12);
  }, [
    graph,
    record.id,
    existingOtherIds,
    includeProposed,
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

      <label className="mt-2 flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-[#282828]"
          checked={includeProposed}
          onChange={(event) => setIncludeProposed(event.target.checked)}
        />
        Include proposed records
      </label>

      <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="px-1 py-2 text-sm text-black/50">
            {searchTerm ? "No matching records." : "Search to find records."}
          </p>
        ) : (
          candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="group flex w-full items-center gap-2 rounded-lg border border-black/15 bg-white/70 px-2.5 py-1.5 text-left transition-colors hover:bg-white"
              onClick={() => onPick(candidate)}
            >
              <OtherRecordTag record={candidate} />
              <Plus className="ml-auto h-4 w-4 shrink-0 text-black/30 group-hover:text-black/70" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ProposalManualEditor({
  record,
  graph,
  initialDraft,
  onSave,
  onCancel,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  initialDraft?: ProposalDraft;
  onSave: (draft: ProposalDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProposalDraft>(
    () => initialDraft ?? seedDraft(record, graph),
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
            label="Summary"
            value={draft.summary}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, summary: event.target.value }))
            }
            placeholder="One-line description for cards and search."
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
