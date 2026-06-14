import { useState } from "react";
import { PencilLine } from "lucide-react";

import Button from "#/components/Button";
import TextAreaField from "#/components/TextAreaField";

function CaseNoteComposer({
  onCreateCaseNote,
}: {
  onCreateCaseNote: (content: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-xl border border-black/15 bg-white/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm text-black/70">
        <PencilLine className="h-4 w-4" />
        <span>New case note</span>
      </div>
      <TextAreaField
        label="Case note"
        placeholder="Capture a strategy thought, question, witness point, or hearing note..."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        minRows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button
          style="secondary"
          text="Add case note"
          icon="plus"
          disabled={!draft.trim()}
          onClick={() => {
            onCreateCaseNote(draft);
            setDraft("");
          }}
        />
      </div>
    </div>
  );
}

export default CaseNoteComposer;
