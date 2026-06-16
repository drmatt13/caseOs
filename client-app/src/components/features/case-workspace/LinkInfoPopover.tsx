import { Info } from "lucide-react";

import type { GraphLink, RecordLinkType } from "#/types/caseRecords";
import { linkTypeLabel } from "#/lib/caseRecordPresentation";
import { TONES, type ToneName } from "#/lib/tones";
import Popover from "#/components/ui/Popover";

import type { WorkspaceGraph } from "./useWorkspaceGraph";

// The relationship's valence drives the popover tint, keeping the "Ink & Tint"
// promise that color carries meaning: a contradiction or attack reads critical,
// support/evidence reads positive, and every other relationship is a calm,
// neutral-informational blue.
function linkTone(type: RecordLinkType): ToneName {
  if (type === "CONTRADICTS" || type === "ATTACKS") return "critical";
  if (type === "SUPPORTS" || type === "EVIDENCES") return "positive";
  return "info";
}

// The "why" behind a single graph edge, reached from a small Info button on the
// link chip. Surfaces the relationship (phrased for the viewer's direction), the
// agent's rationale, its live link status, and confidence when present — so an
// accepted edge's reasoning is one click away rather than hidden.
function LinkInfoPopover({
  link,
  direction,
  graph,
}: {
  link: GraphLink;
  direction: "outbound" | "inbound";
  graph: WorkspaceGraph;
}) {
  const tone = TONES[linkTone(link.type)];
  const relationship = linkTypeLabel(link.type, direction);
  const status = graph.effectiveLinkStatus(link);
  const confidencePct =
    link.confidence != null ? Math.round(link.confidence * 100) : null;

  return (
    <Popover
      placement="top"
      triggerLabel={`Why this link: ${relationship}`}
      triggerClassName="flex shrink-0 items-center rounded-md px-1 text-black/35 transition-colors hover:text-black/70"
      trigger={<Info className="h-3.5 w-3.5" />}
      className={`z-[10001] flex max-w-xs flex-col gap-2 rounded-xl border ${tone.surface} p-3 text-sm shadow-md backdrop-blur-sm`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${tone.badge}`}
        >
          {relationship}
        </span>
        {status !== "ACCEPTED" && (
          <span className="rounded-full border border-black/15 bg-black/[0.03] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/55">
            {status === "REJECTED" ? "Rejected" : "Proposed"}
          </span>
        )}
      </div>
      <p className="leading-5 text-black/75">{link.explanation}</p>
      {confidencePct != null && (
        <p className="text-xs text-black/55">
          Agent confidence {confidencePct}%
        </p>
      )}
    </Popover>
  );
}

export default LinkInfoPopover;
