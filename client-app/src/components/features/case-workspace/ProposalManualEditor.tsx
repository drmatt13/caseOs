import { useState } from "react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";

import {
  draftBlockingIssue,
  RecordDraftFields,
  seedDraft,
  type RecordDraft,
} from "./RecordDraftEditor";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Manual proposal editor (edit shell).
//
// A draft-editing surface for an existing PROPOSED record: hand-edit its fields
// and curate its knowledge-graph links via the shared RecordDraftFields body. It
// does NOT submit the proposal — Save commits the working copy to the workspace
// graph's ephemeral session state (saveProposalDraft) and exits; Cancel discards.
// Nothing is written back to the hardcoded demo module or server, so refresh
// restores the original test data. Only proposals reach this surface — accepted
// records are never hand-edited. The create counterpart is RecordCreateEditor.
// ─────────────────────────────────────────────────────────────────────────────

// Re-exported so existing callers keep importing the draft shape from here.
export type { RecordDraft as ProposalDraft } from "./RecordDraftEditor";

function ProposalManualEditor({
  record,
  graph,
  onSave,
  onCancel,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onSave: (draft: RecordDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RecordDraft>(() =>
    seedDraft(record, graph),
  );

  const onChange = (next: Partial<RecordDraft>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  const blockingIssue = draftBlockingIssue(record.type, draft);

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

        <RecordDraftFields
          record={record}
          graph={graph}
          draft={draft}
          onChange={onChange}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/15 bg-white/70 px-4 py-3">
        <span className="text-xs text-black/55">
          {blockingIssue ?? "Saving keeps this a draft — it won't go to review."}
        </span>
        <div className="flex items-center gap-2">
          <Button style="ghost" size="sm" text="Cancel" onClick={onCancel} />
          <Button
            style="primary"
            size="sm"
            icon="save"
            text="Save draft"
            disabled={Boolean(blockingIssue)}
            onClick={() => onSave(draft)}
          />
        </div>
      </div>
    </div>
  );
}

export default ProposalManualEditor;
