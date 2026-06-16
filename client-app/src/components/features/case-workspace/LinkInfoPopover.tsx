import { ArrowDown, Info } from "lucide-react";

import type { GraphLink, RecordLinkType } from "#/types/caseRecords";
import {
  linkTypeLabel,
  RECORD_TYPE_LABELS,
} from "#/lib/caseRecordPresentation";
import { TONES, type ToneName } from "#/lib/tones";
import Popover from "#/components/ui/Popover";

import type { WorkspaceGraph } from "./useWorkspaceGraph";

// The relationship's valence drives the popover tint AND the verb's ink, keeping
// the "Ink & Tint" promise that color carries meaning: a contradiction or attack
// reads critical (red), support/evidence reads positive (green), and every other
// relationship is a calm, neutral-informational blue.
function linkTone(type: RecordLinkType): ToneName {
  if (type === "CONTRADICTS" || type === "ATTACKS") return "critical";
  if (type === "SUPPORTS" || type === "EVIDENCES") return "positive";
  return "info";
}

// One end of the edge, rendered as a calm white-glass card sitting *in* the
// tinted panel: a small type tag (the record's category) above its own title.
// `here` marks the record the viewer is currently standing on, so the diagram
// always reads as "where I am → where this goes" no matter which end the popover
// was opened from.
function RecordRow({
  typeLabel,
  title,
  here,
}: {
  typeLabel: string;
  title: string;
  here: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5 ${
        here ? "border-black/15 bg-white/80" : "border-black/10 bg-white/55"
      }`}
    >
      <span className="text-[0.6rem] uppercase tracking-wide text-black/45">
        {typeLabel}
      </span>
      <span className="text-sm leading-snug text-black/80">{title}</span>
    </div>
  );
}

// The "why" behind a single graph edge, reached from a small Info button on the
// link chip. Reads as a plain sentence diagram — source record, the relationship
// verb under a downward arrow, target record, then the agent's rationale. The
// edge is always laid out in its canonical from → to order so the relationship
// reads the same regardless of which end you opened it from; `direction` only
// decides which record is highlighted as "you are here."
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
  // Canonical forward phrasing ("Evidences", "Depends on", …): the source acts
  // on the target, read top-to-bottom along the arrow.
  const verb = linkTypeLabel(link.type, "outbound");

  const fromRecord = graph.recordsById.get(link.fromRecordId);
  const toRecord = graph.recordsById.get(link.toRecordId);

  // Fall back to the link's stored endpoint types if a record can't be resolved,
  // so the diagram still reads even with a dangling reference.
  const fromTypeLabel = RECORD_TYPE_LABELS[fromRecord?.type ?? link.fromRecordType];
  const toTypeLabel = RECORD_TYPE_LABELS[toRecord?.type ?? link.toRecordType];
  const fromTitle = fromRecord?.title ?? fromTypeLabel;
  const toTitle = toRecord?.title ?? toTypeLabel;

  // "outbound" → the viewer stands on the source; "inbound" → on the target.
  const hereEnd: "from" | "to" = direction === "outbound" ? "from" : "to";

  return (
    <Popover
      placement="top"
      triggerLabel={`Why this link: ${fromTitle} ${verb.toLowerCase()} ${toTitle}`}
      triggerClassName="flex shrink-0 items-center rounded-md px-1 text-black/35 transition-colors hover:text-black/70"
      trigger={<Info className="h-3.5 w-3.5" />}
      className={`z-[10001] flex w-72 max-w-[90vw] flex-col gap-1.5 rounded-xl border ${tone.surface} p-3 shadow-md backdrop-blur-sm`}
    >
      <RecordRow
        typeLabel={fromTypeLabel}
        title={fromTitle}
        here={hereEnd === "from"}
      />

      {/* Relationship verb: the heart of the edge. Color lives in the ink, and
          the downward arrow makes the from → to direction unmistakable. */}
      <div
        className={`flex items-center justify-center gap-1.5 ${tone.ink}`}
      >
        <ArrowDown className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">{verb}</span>
      </div>

      <RecordRow
        typeLabel={toTypeLabel}
        title={toTitle}
        here={hereEnd === "to"}
      />

      <p className="border-t border-black/10 pt-2 text-sm leading-5 text-black/75">
        {link.explanation}
      </p>
    </Popover>
  );
}

export default LinkInfoPopover;
