import { useState } from "react";

import type { RecordType } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";

import CaseWorkspaceModal from "./CaseWorkspaceModal";
import type { RecordCreationTarget } from "./useCaseWorkspace";

// ─────────────────────────────────────────────────────────────────────────────
// Generate-a-record modal — UI-only stub.
//
// Captures a prompt for the case agent to draft a record. There is no AI backend
// yet (the agent chat send is likewise a mock), so "Generate" is inert: it
// surfaces a "coming soon" note rather than creating anything. When wired, this
// will draft a PROPOSED record and route it to the review queue. Manual "Create"
// is the working path today (RecordCreateModal).
// ─────────────────────────────────────────────────────────────────────────────

function GenerateRecordForm({
  type,
  onClose,
}: {
  type: RecordType;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [attempted, setAttempted] = useState(false);
  const label = RECORD_TYPE_LABELS[type].toLowerCase();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-black/45">
            Generate {label}
          </p>
          <p className="mt-0.5 text-sm text-black/55">
            Describe what the case agent should draft. It will propose a {label}{" "}
            grounded in the case graph for your review.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <TextAreaField
            className="w-full"
            label={`What should this ${label} cover?`}
            placeholder={`Ask the agent to draft a ${label} — summarize a discovery gap, compare arguments, or propose one from a document…`}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            minRows={4}
          />
          <TextAreaField
            className="w-full"
            label="Additional instructions (optional)"
            placeholder="Constraints, tone, or sources to prioritize."
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={2}
            minRows={2}
          />
        </div>

        {attempted && (
          <p className="mt-3 rounded-lg border border-amber-600/25 bg-amber-50/50 px-3 py-2 text-sm leading-5 text-amber-950">
            Agent generation isn't connected yet. Once it is, this will draft a
            proposed {label} and send it to the review queue. In the meantime, use{" "}
            <span className="font-medium">Create</span> to author one by hand.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/15 bg-white/70 px-4 py-3">
        <span className="text-xs text-black/55">
          Generation is coming soon — manual “Create” works today.
        </span>
        <div className="flex items-center gap-2">
          <Button style="ghost" size="sm" text="Cancel" onClick={onClose} />
          <Button
            style="primary"
            size="sm"
            icon="sparkles"
            text="Generate"
            disabled={!prompt.trim()}
            onClick={() => setAttempted(true)}
          />
        </div>
      </div>
    </div>
  );
}

function GenerateRecordModal({
  target,
  onClose,
}: {
  target: RecordCreationTarget | null;
  onClose: () => void;
}) {
  return (
    <CaseWorkspaceModal
      open={Boolean(target)}
      title={
        target ? `Generate ${RECORD_TYPE_LABELS[target.type].toLowerCase()}` : ""
      }
      onClose={onClose}
    >
      {target && (
        <GenerateRecordForm key={target.key} type={target.type} onClose={onClose} />
      )}
    </CaseWorkspaceModal>
  );
}

export default GenerateRecordModal;
