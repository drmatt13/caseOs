import { useMemo, useState } from "react";

import type { RecordType, TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";
import Button from "#/components/ui/Button";
import { CheckboxField } from "#/components/ui/form";

import {
  draftBlockingIssue,
  makeSkeletonRecord,
  RecordDraftFields,
  seedDraft,
  type RecordDraft,
} from "./RecordDraftEditor";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Manual record creator (create shell).
//
// Authors a brand-new record by hand using the same RecordDraftFields body as
// the proposal editor. The record type is fixed by the originating view. A
// checkbox chooses whether the record is added directly (ACCEPTED, skipping
// review) or created as a proposal (PROPOSED, the default — it lands in the
// review queue). Saving calls graph.createRecord; like every workspace mutation
// it is ephemeral session state. The edit counterpart is ProposalManualEditor.
// ─────────────────────────────────────────────────────────────────────────────

function RecordCreateEditor({
  type,
  graph,
  onCreated,
  onCancel,
}: {
  type: RecordType;
  graph: WorkspaceGraph;
  onCreated: (record: TypedCaseRecord) => void;
  onCancel: () => void;
}) {
  // Stable across the lifetime of this editor so curated links keep pointing at
  // the same (future) record id, which createRecord then reuses.
  const [skeletonId] = useState(() => `record-new-${Date.now()}`);
  const skeleton = useMemo(
    () => makeSkeletonRecord(type, graph.demo, skeletonId),
    [type, graph.demo, skeletonId],
  );

  const [draft, setDraft] = useState<RecordDraft>(() =>
    seedDraft(skeleton, graph),
  );
  const [addDirectly, setAddDirectly] = useState(false);

  const onChange = (next: Partial<RecordDraft>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  const blockingIssue = draftBlockingIssue(type, draft);

  const handleCreate = () => {
    const created = graph.createRecord({
      id: skeletonId,
      type,
      draft,
      asProposal: !addDirectly,
    });
    if (created) onCreated(created);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain contain-paint p-4">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-black/45">
            New {RECORD_TYPE_LABELS[type].toLowerCase()}
          </p>
          <p className="mt-0.5 text-sm text-black/55">
            Author the record by hand, then add it directly or send it to review.
          </p>
        </div>

        <RecordDraftFields
          record={skeleton}
          graph={graph}
          draft={draft}
          onChange={onChange}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-black/15 bg-white/70 px-4 py-3">
        <CheckboxField
          size="sm"
          label="Add directly to the case (skip review)"
          checked={addDirectly}
          onChange={setAddDirectly}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-black/55">
            {blockingIssue ??
              (addDirectly
                ? "Added as an accepted record — no review needed."
                : "Created as a proposal — it goes to the review queue.")}
          </span>
          <div className="flex items-center gap-2">
            <Button style="ghost" size="sm" text="Cancel" onClick={onCancel} />
            <Button
              style="primary"
              size="sm"
              icon="plus"
              text={addDirectly ? "Add to case" : "Create proposal"}
              disabled={Boolean(blockingIssue)}
              onClick={handleCreate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordCreateEditor;
