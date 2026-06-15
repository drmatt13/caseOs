import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

import type { TypedCaseRecord } from "#/types/caseRecords";
import Button from "#/components/ui/Button";
import TextAreaField from "#/components/ui/TextAreaField";

import RecordChip from "../RecordChip";
import type { WorkspaceGraph } from "../useWorkspaceGraph";

function AgentView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [proposedInstructions, setProposedInstructions] = useState<string[]>(
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <Bot className="h-5 w-5" />
            Case Agent
          </h2>
          <p className="mt-1 text-sm text-black/70">
            Grounded in the case knowledge graph. Every answer cites records you
            can open, and every change arrives as a reviewable proposal.
          </p>
        </div>
        <Button
          style="secondary"
          size="sm"
          text={showInstructions ? "Hide instructions" : "Agent instructions"}
          onClick={() => setShowInstructions((value) => !value)}
        />
      </div>

      {showInstructions && (
        <section className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
          <h3 className="text-sm font-medium text-black/70">
            Standing instructions
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {[...graph.demo.agentInstructions, ...proposedInstructions].map(
              (instruction) => (
                <div
                  key={instruction}
                  className="flex gap-2 rounded-lg border border-black/15 bg-white/75 p-3 text-sm text-black/75"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-black/55" />
                  <span>{instruction}</span>
                </div>
              ),
            )}
          </div>
          <div className="mt-3 rounded-lg border border-black/15 bg-white/75 p-3">
            <TextAreaField
              label="Propose an instruction change"
              placeholder="Example: When reviewing discovery, prioritize missing records controlled by property management."
              value={instructionDraft}
              onChange={(event) => setInstructionDraft(event.target.value)}
              rows={2}
              minRows={2}
            />
            <div className="mt-2 flex justify-end">
              <Button
                style="secondary"
                text="Propose change"
                icon="save"
                disabled={!instructionDraft.trim()}
                onClick={() => {
                  setProposedInstructions((items) => [
                    ...items,
                    `Proposed: ${instructionDraft.trim()}`,
                  ]);
                  setInstructionDraft("");
                }}
              />
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-black/15 bg-white/65 p-4">
        {graph.demo.agentThread.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-1.5 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl border p-3 ${
                message.role === "user"
                  ? "border-black/15 bg-black/[0.05]"
                  : "border-black/15 bg-white/85"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs text-black/55">
                {message.role === "agent" && <Bot className="h-3.5 w-3.5" />}
                <span>{message.role === "agent" ? "Case Agent" : "You"}</span>
                <span>· {message.time}</span>
              </div>
              <p className="text-md leading-6 text-black/80">
                {message.content}
              </p>
              {message.citedRecordIds && message.citedRecordIds.length > 0 && (
                <div className="mt-3 border-t border-black/15 pt-2">
                  <p className="mb-1.5 text-xs text-black/50">
                    Grounded in {message.citedRecordIds.length} records
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {message.citedRecordIds
                      .map((id) => graph.recordsById.get(id))
                      .filter((record): record is TypedCaseRecord =>
                        Boolean(record),
                      )
                      .map((record) => (
                        <RecordChip
                          key={record.id}
                          record={record}
                          graph={graph}
                          onOpenRecord={onOpenRecord}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="mt-2 rounded-lg border border-black/15 bg-white/75 p-3">
          <TextAreaField
            label="Ask the case agent"
            placeholder="Ask the agent to summarize discovery gaps, compare arguments, or propose new records from a document..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-black/55">
              Responses cite records; proposed changes go to the review queue.
            </span>
            <Button
              text="Send"
              icon="sparkles"
              disabled={!prompt.trim()}
              onClick={() => setPrompt("")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default AgentView;
