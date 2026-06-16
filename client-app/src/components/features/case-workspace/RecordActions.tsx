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
import { TONES } from "#/lib/tones";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";

import type { ProposalDecision } from "./useWorkspaceGraph";

export function ProposalActions({
  record,
  onDelete,
  onDecision,
  onEditManually,
}: {
  record: TypedCaseRecord;
  onDelete: (recordId: string) => void;
  onDecision: (recordId: string, decision: ProposalDecision) => void;
  onEditManually: (recordId: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestingEdits, setSuggestingEdits] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3">
      {/* Accept is the affirmative primary; Reject carries the lone destructive
          accent (red ink at rest, fills on hover); Suggest edits is a neutral
          secondary and Delete a quiet ghost — a deliberate emphasis gradient so
          the review decision reads at a glance. */}
      <div className="flex flex-wrap flex-row-reverse items-center gap-2">
        <Button
          style="primary"
          size="sm"
          icon={CheckCircle2}
          text="Accept proposal"
          onClick={() => onDecision(record.id, { status: "accepted" })}
        />
        {/* <Button
          style="danger"
          size="sm"
          icon={XCircle}
          text="Reject proposal"
          onClick={() => setRejecting((value) => !value)}
        /> */}
        <Button
          style="secondary"
          size="sm"
          icon={Sparkles}
          text="Suggest edits"
          title="Suggest edits with AI"
          onClick={() => setSuggestingEdits((value) => !value)}
        />
        <Button
          style="secondary"
          size="sm"
          icon={PencilLine}
          text="Edit manually"
          title="Hand-edit this proposal and its links"
          onClick={() => onEditManually(record.id)}
        />
        <Button
          style="ghost"
          size="sm"
          icon={Trash2}
          text="Delete proposal"
          onClick={() => onDelete(record.id)}
        />
      </div>

      {rejecting && (
        <div className={`mt-3 rounded-lg border p-3 ${TONES.critical.surface}`}>
          <TextAreaField
            label="Reason for rejecting this proposal"
            placeholder="Example: unsupported by produced discovery, duplicates an accepted fact, or uses language that overstates the evidence."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button
              style="danger"
              size="sm"
              text="Save rejection"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                onDecision(record.id, {
                  status: "rejected",
                  reason: rejectionReason.trim(),
                })
              }
            />
          </div>
        </div>
      )}

      {suggestingEdits && (
        <div className="mt-3 rounded-lg border border-black/15 bg-black/[0.025] p-3">
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
              <span className="text-sm text-black/70">
                Edit suggestion queued for the agent.
              </span>
            ) : (
              <span className="text-sm text-black/55">
                This keeps the proposal open for review.
              </span>
            )}
            <Button
              style="secondary"
              size="sm"
              icon={Sparkles}
              text="Send suggestion"
              disabled={!editSuggestion.trim()}
              onClick={() => setEditSubmitted(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Action surface for accepted (authoritative) records: propose a revision. An
// accepted record can't be edited in place — and crucially it isn't hand-edited
// either. Instead the human describes WHAT should change and the agent drafts a
// new PROPOSED record that would replace this one, routed through the normal
// review queue. Submitting flips this record to "Pending Replacement", so the
// surface swaps to the replacement notice on its own — that transition is the
// confirmation. The drafted proposal can then be refined via manual edit.
export function AcceptedRecordActions({
  record,
  onRequestRevision,
}: {
  record: TypedCaseRecord;
  onRequestRevision: (recordId: string, instruction: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

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
        <Button
          style="secondary"
          size="sm"
          icon={open ? undefined : Sparkles}
          text={open ? "Cancel" : "Propose revision"}
          onClick={() => {
            setInstruction("");
            setOpen((value) => !value);
          }}
        />
      </div>

      {open && (
        <div className="mt-3">
          <TextAreaField
            label="What should the agent change?"
            placeholder="Describe the revision — what to add, soften, cite, split, or rewrite. The agent drafts a proposed revision for your review."
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-black/55">
              The agent drafts a replacement proposal for the review queue.
            </span>
            <Button
              style="primary"
              size="sm"
              text="Draft revision"
              icon="sparkles"
              disabled={!instruction.trim()}
              onClick={() => {
                onRequestRevision(record.id, instruction.trim());
                setOpen(false);
                setInstruction("");
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
          ? `${TONES.positive.surface} text-emerald-800`
          : `${TONES.critical.surface} text-red-800`
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
