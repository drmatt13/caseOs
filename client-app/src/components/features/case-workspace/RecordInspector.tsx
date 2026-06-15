import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";

import {
  documentScopeLabel,
  formatDate,
  formatEventDate,
  isImageDocument,
  recordDisplayStatus,
} from "./helpers";
import { DocumentViewButton } from "./common";
import {
  PartyBadge,
  StatusBadge,
  SubstatusBadge,
  SupportBadge,
} from "./RecordBadges";
import RecordChip from "./RecordChip";
import {
  PendingReplacementNotice,
  ReplacementNotice,
  VersionHistoryNotice,
} from "./RecordNotices";
import RecordLinksPanel from "./RecordLinksPanel";
import { AcceptedRecordActions, ProposalActions } from "./RecordActions";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Record inspector modal (graph traversal)
// Hosted outside ContentShell and styled to match AppModal / EditUserModal:
// a centered card over a blur + tint backdrop, kept mounted so it can animate
// open and closed.
// ─────────────────────────────────────────────────────────────────────────────

function RecordInspector({
  stack,
  graph,
  onOpenRecord,
  onBack,
  onClose,
}: {
  stack: string[];
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const open = stack.length > 0;
  const recordId = stack[stack.length - 1];

  // Keep the last opened record on screen through the close animation,
  // mirroring AppModal's prevModal/visibleModal handling.
  const [displayRecordId, setDisplayRecordId] = useState<string | undefined>(
    recordId,
  );

  useEffect(() => {
    if (recordId) setDisplayRecordId(recordId);
  }, [recordId]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const record = displayRecordId
    ? graph.recordsById.get(displayRecordId)
    : undefined;

  return (
    <div
      className={`fixed inset-0 z-10000 flex items-start justify-center overflow-hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* blur layer */}
      <div
        className={`absolute inset-0 transition-[backdrop-filter] ${
          open
            ? "duration-200 ease-out backdrop-blur-xs"
            : "duration-300 ease-in backdrop-blur-0"
        }`}
      />

      {/* tint layer */}
      <div
        className={`absolute inset-0 bg-black/10 transition-opacity ${
          open
            ? "duration-200 ease-out opacity-100"
            : "duration-300 ease-in opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative top-12 z-20 flex h-max max-h-[calc(100vh-6rem)] w-2xl max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-black/22 bg-white/90 text-md shadow-md backdrop-blur-sm transition-all ${
          open
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/15 px-4 py-3">
          {stack.length > 1 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span className="text-sm text-black/55">Record inspector</span>
          )}
          {stack.length > 1 && (
            <span className="text-xs text-black/50">
              {stack.length} records deep
            </span>
          )}
          <button
            type="button"
            aria-label="Close record inspector"
            className="ml-auto rounded-lg p-1.5 text-black/65 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {record && (
          <RecordInspectorBody
            key={record.id}
            record={record}
            graph={graph}
            onOpenRecord={onOpenRecord}
            onClose={onClose}
            // Every record already open in this path (ancestors plus the record
            // itself). Any chip pointing back into this set is a cycle and gets
            // locked, so traversal can never loop — not via links, not via
            // version history, not via a self-reference.
            visitedIds={new Set(stack)}
          />
        )}
      </div>
    </div>
  );
}

function RecordInspectorBody({
  record,
  graph,
  onOpenRecord,
  onClose,
  visitedIds,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onClose: () => void;
  visitedIds: Set<string>;
}) {
  const status = graph.effectiveStatus(record);
  const displayStatus = recordDisplayStatus(record, graph);
  const sourceDocument =
    record.type === "DOCUMENT"
      ? graph.demo.documents.find((document) => document.id === record.documentId)
      : undefined;
  const siblingDocumentRecords =
    record.type === "DOCUMENT"
      ? graph.records.filter(
          (candidate) =>
            candidate.type === "DOCUMENT" &&
            candidate.documentId === record.documentId &&
            candidate.id !== record.id,
        )
      : [];
  const pendingProposals = graph.pendingReplacementByTargetId.get(record.id);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
          {RECORD_TYPE_LABELS[record.type]}
        </span>
        {/* The inspector shows the FULL decomposition — every axis at once —
            unlike the single resolved pill on dense cards. */}
        <StatusBadge status={displayStatus} />
        <SubstatusBadge record={record} />
        <SupportBadge record={record} />
        <PartyBadge
          record={record}
          clientRole={graph.demo.caseContext.representation.clientRole}
        />
      </div>

      <h2 className="font-serif text-xl leading-snug">{record.title}</h2>
      {record.summary && (
        <p className="mt-1 text-sm text-black/70">{record.summary}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/50">
        {record.category && <span>Category: {record.category}</span>}
        {record.type === "FACT" && record.isContextual && (
          <span>Background context</span>
        )}
        {record.type === "NOTE" && record.pinned && <span>Pinned</span>}
        {record.type === "LEGAL_PRECEDENT" && record.citeChecked === false && (
          <span>Cite-check pending</span>
        )}
        <span>Version {record.version}</span>
        <span>
          {record.createdBy === "agent" ? "Agent" : "Human"} ·{" "}
          {formatDate(record.createdAt)}
        </span>
        {record.approvedAt && (
          <span>Approved {formatDate(record.approvedAt)}</span>
        )}
      </div>

      {record.type === "PERSON" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {record.roles.map((role) => (
            <span
              key={role}
              className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70"
            >
              {role.replaceAll("_", " ").toLowerCase()}
            </span>
          ))}
          {record.organization && (
            <span className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs text-black/70">
              {record.organization}
            </span>
          )}
        </div>
      )}

      {record.type === "TIMELINE_EVENT" && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white/75 px-2.5 py-1.5 text-sm text-black/70">
          <CalendarDays className="h-4 w-4" />
          {formatEventDate(record)}
        </p>
      )}

      {record.type === "DOCUMENT" && sourceDocument && (
        <div className="mt-3 rounded-lg border border-black/15 bg-white/75 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-black/70">
              {isImageDocument(sourceDocument) ? (
                <ImageIcon className="h-4 w-4 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{sourceDocument.fileName}</span>
            </div>
            <DocumentViewButton document={sourceDocument} />
          </div>
          <p className="mt-1 text-xs text-black/50">
            {documentScopeLabel(record, sourceDocument)} ·{" "}
            {sourceDocument.processingStatus}
          </p>
          {siblingDocumentRecords.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-black/65">
                Other records from this file ({siblingDocumentRecords.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {siblingDocumentRecords.map((sibling) => (
                  <RecordChip
                    key={sibling.id}
                    record={sibling}
                    graph={graph}
                    onOpenRecord={onOpenRecord}
                    isCycle={visitedIds.has(sibling.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-md leading-6 text-black/80">{record.content}</p>

      {/* Replacement state mirrors the case-record card so the inspector reads
          the same way: the amber "would replace" and red "locked, pending
          replacement" containers travel with the record into the drawer. */}
      {status === "PROPOSED" && record.replacesIds?.length && (
        <div className="mt-4">
          <ReplacementNotice
            record={record}
            graph={graph}
            onOpenRecord={onOpenRecord}
            visitedIds={visitedIds}
          />
        </div>
      )}

      {pendingProposals && (
        <div className="mt-4">
          <PendingReplacementNotice
            proposals={pendingProposals}
            graph={graph}
            onOpenRecord={onOpenRecord}
            visitedIds={visitedIds}
          />
        </div>
      )}

      <VersionHistoryNotice
        record={record}
        graph={graph}
        onOpenRecord={onOpenRecord}
        visitedIds={visitedIds}
      />

      <div className="mt-4">
        <p className="mb-1.5 text-xs text-black/65">Knowledge graph</p>
        <RecordLinksPanel
          record={record}
          graph={graph}
          onOpenRecord={onOpenRecord}
          visitedIds={visitedIds}
          allowProposedLinksToggle
        />
      </div>

      {status === "PROPOSED" && (
        <ProposalActions
          record={record}
          onDelete={(id) => {
            graph.deleteRecord(id);
            onClose();
          }}
          onDecision={graph.decideProposal}
        />
      )}

      {status === "ACCEPTED" && (
        <AcceptedRecordActions
          record={record}
          onPropose={graph.proposeRevision}
        />
      )}
    </div>
  );
}

export default RecordInspector;
