import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  CheckCircle2,
  GitBranch,
  PencilLine,
  Settings,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { SINGULAR_VIEW_LABELS } from "#/lib/caseRecordPresentation";
import { RECORD_TYPE_VIEW } from "#/types/caseWorkspace";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";

import type { ProposalDecision } from "./useWorkspaceGraph";

export function ProposalActions({
  record,
  onDelete,
  onDecision,
}: {
  record: TypedCaseRecord;
  onDelete: (recordId: string) => void;
  onDecision: (recordId: string, decision: ProposalDecision) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestingEdits, setSuggestingEdits] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-green-800 transition-colors hover:bg-green-100"
          onClick={() => onDecision(record.id, { status: "accepted" })}
          type="button"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-800 transition-colors hover:bg-red-100"
          onClick={() => setRejecting((value) => !value)}
          type="button"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/10"
          onClick={() => onDelete(record.id)}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/10"
          onClick={() => setSuggestingEdits((value) => !value)}
          title="Suggest edits with AI"
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest edits
        </button>
      </div>

      {rejecting && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <TextAreaField
            label="Reason for rejecting this proposal"
            placeholder="Example: unsupported by produced discovery, duplicates an accepted fact, or uses language that overstates the evidence."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-800 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-red-300"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                onDecision(record.id, {
                  status: "rejected",
                  reason: rejectionReason.trim(),
                })
              }
              type="button"
            >
              Save rejection
            </button>
          </div>
        </div>
      )}

      {suggestingEdits && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <TextAreaField
            label="Suggested edit for the agent"
            placeholder="Tell the agent what to preserve, soften, cite, split, or rewrite before you accept it."
            value={editSuggestion}
            onChange={(event) => {
              setEditSuggestion(event.target.value);
              setEditSubmitted(false);
            }}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {editSubmitted ? (
              <span className="text-sm text-blue-800">
                Edit suggestion queued for the agent.
              </span>
            ) : (
              <span className="text-sm text-blue-900/60">
                This keeps the proposal open for review.
              </span>
            )}
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-black/30"
              disabled={!editSuggestion.trim()}
              onClick={() => setEditSubmitted(true)}
              type="button"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Send suggestion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Action surface for accepted (authoritative) records: propose a revision. An
// accepted record can't be edited in place — instead the user drafts a new
// version that becomes a PROPOSED record replacing this one, routed through
// the normal review queue. This is the primary way humans turn an accepted
// record back into a proposal.
export function AcceptedRecordActions({
  record,
  onPropose,
}: {
  record: TypedCaseRecord;
  onPropose: (recordId: string, draft: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(record.content);

  return (
    <div
      className="mt-3 rounded-lg border border-black/15 bg-white/75 p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-black/65">
          <GitBranch className="h-4 w-4" />
          <span>Propose a revision</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/10"
          onClick={() => {
            setDraft(record.content);
            setOpen((value) => !value);
          }}
        >
          <PencilLine className="h-3.5 w-3.5" />
          {open ? "Cancel" : "Propose revision"}
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <TextAreaField
            label="Revised content"
            placeholder="Edit the content. Submitting creates a proposed record that would replace this one and sends it to the review queue."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            minRows={4}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-black/55">
              Goes to the review queue as a replacement proposal.
            </span>
            <Button
              style="secondary"
              text="Submit proposal"
              icon="sparkles"
              disabled={!draft.trim() || draft.trim() === record.content.trim()}
              onClick={() => {
                onPropose(record.id, draft);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProposalDecisionNote({
  decision,
}: {
  decision: ProposalDecision;
}) {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
        decision.status === "accepted"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <p className="font-medium">
        Proposal {decision.status === "accepted" ? "accepted" : "rejected"}
      </p>
      {decision.reason && (
        <p className="mt-1 leading-5">Reason: {decision.reason}</p>
      )}
    </div>
  );
}

export function RecordSettingsMenu({
  record,
  onDelete,
}: {
  record: TypedCaseRecord;
  onDelete: (recordId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuNote, setMenuNote] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const itemLabel =
    SINGULAR_VIEW_LABELS[RECORD_TYPE_VIEW[record.type]] ?? "record";
  const isReplaced = record.status === "REPLACED";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleMenuAction = (
    event: MouseEvent<HTMLButtonElement>,
    note: string,
  ) => {
    event.stopPropagation();
    setMenuNote(note);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="rounded-lg p-1.5 text-black/65 transition-colors hover:bg-black/15"
        title={`Open ${itemLabel} settings`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-20 min-w-52 rounded-xl border border-black/22 bg-white/90 p-1.5 text-sm shadow-md backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          {isReplaced ? (
            <p className="px-2.5 py-2 text-black/50">
              Replaced records are read-only.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-black/70 transition-colors hover:bg-black/10"
                onClick={(event) =>
                  handleMenuAction(
                    event,
                    `Edit mode queued for this ${itemLabel}.`,
                  )
                }
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit {itemLabel}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-black/70 transition-colors hover:bg-black/10"
                onClick={(event) =>
                  handleMenuAction(
                    event,
                    `Suggested edits queued for this ${itemLabel}.`,
                  )
                }
              >
                <Sparkles className="h-3.5 w-3.5" />
                Suggest edits
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-red-700 transition-colors hover:bg-black/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(record.id);
                  setOpen(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {itemLabel}
              </button>
            </>
          )}
          {menuNote && !isReplaced && (
            <p className="mt-1 border-t border-black/15 px-2.5 py-2 text-xs leading-4 text-black/50">
              {menuNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
