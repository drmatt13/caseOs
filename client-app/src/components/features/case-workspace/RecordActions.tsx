import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  CheckCircle2,
  CircleSlash,
  GitBranch,
  PencilLine,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";

import type { TaskSubstatus, TypedCaseRecord } from "#/types/caseRecords";
import {
  RECORD_SUBSTATUS_LABELS,
  SINGULAR_VIEW_LABELS,
} from "#/lib/caseRecordPresentation";
import { RECORD_TYPE_VIEW } from "#/types/caseWorkspace";
import { TONES } from "#/lib/tones";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";

import type { ProposalDecision, WorkspaceGraph } from "./useWorkspaceGraph";

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
  const [suggestingEdits, setSuggestingEdits] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3">
      {/* Proposals are either accepted into the graph, edited, or deleted from
          review. Rejection is reserved for already accepted records, where it
          creates a traversal boundary with an auditable reason. */}
      <div className="flex flex-wrap flex-row-reverse items-center gap-2">
        <Button
          style="primary"
          size="sm"
          icon={CheckCircle2}
          text="Accept proposal"
          onClick={() => onDecision(record.id, { status: "accepted" })}
        />
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
          style="danger"
          size="sm"
          icon={Trash2}
          text="Delete proposal"
          onClick={() => onDelete(record.id)}
        />
      </div>

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

// Action surface for accepted (authoritative) records. An accepted record can't
// be edited in place: the human either has the agent draft a replacement
// ("Propose revision") or marks it as a rejected traversal boundary ("Reject
// record"). One consistent toolbar, one inline panel at a time.
type ActiveAction = "revision" | "reject";

export function AcceptedRecordActions({
  record,
  onRequestRevision,
  onReject,
}: {
  record: TypedCaseRecord;
  onRequestRevision: (recordId: string, instruction: string) => void;
  onReject: (recordId: string, reason: string) => void;
}) {
  // One action surface, one open panel at a time. `active` names which inline
  // panel is expanded; `instruction` backs the revision panel and `reason` the
  // reject form.
  const [active, setActive] = useState<ActiveAction | null>(null);
  const [instruction, setInstruction] = useState("");
  const [reason, setReason] = useState("");

  const toggle = (next: ActiveAction) => {
    setInstruction("");
    setReason("");
    setActive((current) => (current === next ? null : next));
  };

  return (
    <div
      className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-black/65">
          <Wrench className="h-4 w-4" />
          <span>Manage record</span>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            style="danger"
            size="sm"
            icon={CircleSlash}
            text={active === "reject" ? "Cancel" : "Reject record"}
            title="Reject this record; agents can read the reason, but will not rely on it or follow it further"
            onClick={() => toggle("reject")}
          />
          <Button
            style="secondary"
            size="sm"
            icon={GitBranch}
            text={active === "revision" ? "Cancel" : "Propose revision"}
            title="Have the agent draft a replacement proposal"
            onClick={() => toggle("revision")}
          />
        </div>
      </div>

      {active === "revision" && (
        <div className="mt-3 rounded-lg border border-black/15 bg-black/2.5 p-3">
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
                setActive(null);
                setInstruction("");
              }}
            />
          </div>
        </div>
      )}

      {active === "reject" && (
        <div className={`mt-3 rounded-lg border p-3 ${TONES.critical.surface}`}>
          <TextAreaField
            label="Reason for rejecting this record"
            placeholder="Example: superseded by the settlement; this theory is no longer being pursued."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button
              style="danger"
              size="sm"
              text="Reject record"
              disabled={!reason.trim()}
              onClick={() => {
                onReject(record.id, reason.trim());
                setActive(null);
                setReason("");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Action surface for a frozen record (display "Rejected"): ask the agent to
// draft a new replacement proposal. Accepting that proposal retires the rejected
// original as Replaced while keeping its rejection reason. (Restore lives on the
// FrozenNote above.)
export function RejectedRecordActions({
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
      className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-black/65">
          <Wrench className="h-4 w-4" />
          <span>Manage record</span>
        </div>
        <Button
          style="secondary"
          size="sm"
          icon={open ? undefined : Sparkles}
          text={open ? "Cancel" : "Propose revision"}
          title="Have the agent draft a replacement proposal"
          onClick={() => {
            setInstruction("");
            setOpen((value) => !value);
          }}
        />
      </div>

      {open && (
        <div className="mt-3">
          <TextAreaField
            label="What should the agent revise?"
            placeholder="Describe the revision — what to preserve, change, cite, split, or rewrite. The agent drafts a replacement proposal for your review."
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-black/55">
              Accepting the revision retires this rejected record as replaced
              while keeping its rejection reason.
            </span>
            <Button
              style="primary"
              size="sm"
              icon="sparkles"
              text="Draft revision"
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

// Segmented work-phase control for a live task. Changing a task's phase is a
// graph operation, not an arbitrary flag — marking a task DONE can unblock the
// records that REQUIRE it, and re-opening one can re-block them. So the control
// is a deliberate two-step: pick a new phase (it stages), then confirm. The
// confirmation surfaces how many live dependents the change will re-evaluate.
const TASK_PHASES: TaskSubstatus[] = ["OPEN", "IN_PROGRESS", "DONE"];

// Count of live (ACCEPTED) records that REQUIRE this task — the dependents whose
// standing the change re-evaluates.
function liveDependentCount(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): number {
  const dependents = new Set<string>();
  for (const link of graph.inboundLinks.get(record.id) ?? []) {
    if (link.type !== "REQUIRES") continue;
    const from = graph.recordsById.get(link.fromRecordId);
    if (from && graph.effectiveStatus(from) === "ACCEPTED") {
      dependents.add(link.fromRecordId);
    }
  }
  return dependents.size;
}

function statusImpactLine(dependentCount: number): string {
  if (dependentCount === 0) return "Updates the task's status.";
  const noun = dependentCount === 1 ? "record" : "records";
  return `${dependentCount} ${noun} depend on this task and will be re-evaluated.`;
}

export function TaskStatusControl({
  record,
  graph,
  onChange,
}: {
  record: Extract<TypedCaseRecord, { type: "TASK" }>;
  graph: WorkspaceGraph;
  onChange: (recordId: string, substatus: TaskSubstatus) => void;
}) {
  const [staged, setStaged] = useState<TaskSubstatus | null>(null);

  return (
    <div
      className="mt-3 rounded-lg border border-black/15 bg-white/75 p-2"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <span className="px-1 text-sm text-black/65">Status</span>
        <div className="flex flex-1 gap-1">
          {TASK_PHASES.map((phase) => {
            const isCurrent = record.substatus === phase;
            const isStaged = staged === phase;
            const className = isStaged
              ? "ring-2 ring-inset ring-[#282828] bg-white text-[#282828]"
              : isCurrent
                ? "bg-[#282828] text-white"
                : "bg-black/5 text-black/70 hover:bg-black/10";
            return (
              <button
                key={phase}
                type="button"
                aria-pressed={isCurrent}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ${className}`}
                onClick={() =>
                  setStaged(record.substatus === phase ? null : phase)
                }
              >
                {RECORD_SUBSTATUS_LABELS[phase]}
              </button>
            );
          })}
        </div>
      </div>

      {staged && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-black/10 px-1 pt-2">
          <span className="text-xs text-black/55">
            {statusImpactLine(liveDependentCount(record, graph))}
          </span>
          <div className="flex items-center gap-2">
            <Button
              style="ghost"
              size="sm"
              text="Cancel"
              onClick={() => setStaged(null)}
            />
            <Button
              style="primary"
              size="sm"
              text={`Mark ${RECORD_SUBSTATUS_LABELS[staged]}`}
              onClick={() => {
                onChange(record.id, staged);
                setStaged(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Answer surface for a live question. Answering and the answer text are one
// action: saving a non-empty answer marks the question ANSWERED (handled by the
// graph), and "Reopen" clears it back to UNANSWERED. There is no way to be
// answered without an answer. Editing an already-answered question re-opens this
// composer in place without losing the prior text until the user saves.
export function QuestionAnswerControl({
  record,
  onChange,
}: {
  record: Extract<TypedCaseRecord, { type: "QUESTION" }>;
  onChange: (recordId: string, answer: string) => void;
}) {
  const answered = record.substatus === "ANSWERED";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record.answer ?? "");

  // Settled answer — read-only until the user chooses to edit or reopen it.
  if (answered && !editing) {
    return (
      <div
        className={`mt-3 rounded-lg border px-3 py-2.5 ${TONES.positive.surface}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-black/55">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Answer
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              style="ghost"
              size="sm"
              icon={PencilLine}
              text="Edit"
              onClick={() => {
                setDraft(record.answer ?? "");
                setEditing(true);
              }}
            />
            <Button
              style="ghost"
              size="sm"
              icon={RotateCcw}
              text="Reopen"
              onClick={() => onChange(record.id, "")}
            />
          </div>
        </div>
        <p className="mt-1.5 text-md leading-6 text-black/80">{record.answer}</p>
      </div>
    );
  }

  // Compose / edit the answer. The save is disabled until there is real text, so
  // the question can never flip to ANSWERED empty-handed.
  const trimmed = draft.trim();
  return (
    <div
      className="mt-3 rounded-lg border border-black/15 bg-white/75 p-2"
      onClick={(event) => event.stopPropagation()}
    >
      <TextAreaField
        label="Answer"
        placeholder="Write the answer that resolves this question. Saving marks it answered."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        minRows={3}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {answered && (
          <Button
            style="ghost"
            size="sm"
            text="Cancel"
            onClick={() => {
              setDraft(record.answer ?? "");
              setEditing(false);
            }}
          />
        )}
        <Button
          style="primary"
          size="sm"
          text={answered ? "Save answer" : "Save & mark answered"}
          disabled={!trimmed}
          onClick={() => {
            onChange(record.id, trimmed);
            setEditing(false);
          }}
        />
      </div>
    </div>
  );
}

// Notice shown on a rejected record: why it is kept for context, plus Restore.
export function FrozenNote({
  reason,
  onRestore,
}: {
  reason?: string;
  onRestore: () => void;
}) {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${TONES.critical.surface} text-red-800`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 font-medium">
          <CircleSlash className="h-4 w-4" />
          Rejected
        </p>
        <Button
          style="secondary"
          size="sm"
          icon={RotateCcw}
          text="Restore"
          onClick={onRestore}
        />
      </div>
      {reason && <p className="mt-1 leading-5">Reason: {reason}</p>}
      <p className="mt-1 text-xs leading-5 text-red-700">
        Agents may read this reason, but will not rely on this record or follow
        it further.
      </p>
    </div>
  );
}


export function ProposalDecisionNote() {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${TONES.positive.surface} text-emerald-800`}
    >
      <p className="font-medium">Proposal accepted</p>
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
