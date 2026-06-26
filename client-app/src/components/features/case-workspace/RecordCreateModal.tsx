import type { TypedCaseRecord } from "#/types/caseRecords";
import { RECORD_TYPE_LABELS } from "#/lib/caseRecordPresentation";

import CaseWorkspaceModal from "./CaseWorkspaceModal";
import RecordCreateEditor from "./RecordCreateEditor";
import type { WorkspaceGraph } from "./useWorkspaceGraph";
import type { RecordCreationTarget } from "./useCaseWorkspace";

// Overlay host for the manual record creator. `target` carries the record type
// and a per-open key, so each open mounts a fresh editor (no stale draft) while
// the shell still animates closed after the target clears.
function RecordCreateModal({
  target,
  graph,
  onClose,
  onCreated,
}: {
  target: RecordCreationTarget | null;
  graph: WorkspaceGraph;
  onClose: () => void;
  onCreated: (record: TypedCaseRecord) => void;
}) {
  return (
    <CaseWorkspaceModal
      open={Boolean(target)}
      title={target ? `New ${RECORD_TYPE_LABELS[target.type].toLowerCase()}` : ""}
      onClose={onClose}
    >
      {target && (
        <RecordCreateEditor
          key={target.key}
          type={target.type}
          graph={graph}
          onCreated={onCreated}
          onCancel={onClose}
        />
      )}
    </CaseWorkspaceModal>
  );
}

export default RecordCreateModal;
