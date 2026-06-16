import { ArrowDown, ArrowLeftRight, ArrowUp, Info } from "lucide-react";

import type {
  GraphLink,
  RecordLinkType,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  isSymmetricLink,
  LINK_TYPE_LABEL_PAIRS,
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

// The label already says "rejected"; keep the stored reason literal, but avoid
// doubled display copy like "Note rejected: rejected because...". Exported so the
// proposal editor can surface a frozen linked record's reason the same way.
export function displayRejectionReason(reason: string) {
  const trimmed = reason.trim();
  const withoutLeadingStatus = trimmed
    .replace(/^(?:(?:reject(?:ed|ion)?)\b[\s:;,.!?\-]*)+/i, "")
    .trimStart();
  return withoutLeadingStatus || trimmed;
}

type EndpointRejection = {
  key: "from" | "to";
  typeLabel: string;
  here: boolean;
  reason: string;
};

// One end of the edge, rendered as a calm white-glass card sitting *in* the
// tinted panel: a small type tag (the record's category) above its own title.
// `here` marks the record the viewer is currently standing on — always pinned to
// the top of the diagram — so the relationship reads "where I am → where this
// goes" no matter which end the popover was opened from.
function RecordRow({
  typeLabel,
  title,
  here = false,
}: {
  typeLabel: string;
  title: string;
  here?: boolean;
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
// link chip. Reads as a plain sentence diagram — the record you're inspecting on
// top, the relationship verb under a direction arrow, the other record below,
// then the agent's rationale. The current record is always pinned to the top
// ("you are here"); the arrow, not the record order, carries direction — it
// points at the edge's destination, so an outgoing link points DOWN to the
// record below and an incoming link points UP into the record you're on.
function LinkInfoPopover({
  link,
  direction,
  graph,
}: {
  link: GraphLink;
  direction: "outbound" | "inbound";
  graph: WorkspaceGraph;
}) {
  const fromRecord = graph.recordsById.get(link.fromRecordId);
  const toRecord = graph.recordsById.get(link.toRecordId);

  const rejectedEndpoint = (
    record: TypedCaseRecord | undefined,
    key: "from" | "to",
    typeLabel: string,
    here: boolean,
  ): EndpointRejection | undefined => {
    // A frozen-and-not-replaced endpoint (display "Rejected"). A frozen record
    // that was later replaced reads as Replaced, not Rejected, so skip it here.
    if (
      !record ||
      !graph.recordIsFrozen(record) ||
      graph.effectiveStatus(record) === "REPLACED"
    ) {
      return undefined;
    }
    const decision = graph.proposalDecisions[record.id];
    const reason =
      record.rejectionReason ??
      (decision?.status === "rejected" ? decision.reason : undefined);
    const resolvedReason = reason?.trim() || "No rejection reason recorded.";
    return {
      key,
      typeLabel,
      here,
      reason: displayRejectionReason(resolvedReason),
    };
  };

  // Fall back to the link's stored endpoint types if a record can't be resolved,
  // so the diagram still reads even with a dangling reference.
  const ends = {
    from: {
      typeLabel: RECORD_TYPE_LABELS[fromRecord?.type ?? link.fromRecordType],
      title: fromRecord?.title ?? RECORD_TYPE_LABELS[link.fromRecordType],
    },
    to: {
      typeLabel: RECORD_TYPE_LABELS[toRecord?.type ?? link.toRecordType],
      title: toRecord?.title ?? RECORD_TYPE_LABELS[link.toRecordType],
    },
  };

  // "outbound" → we stand on the source (from); "inbound" → on the target (to).
  // The record we're on is `here` and is pinned to the top; the other hangs
  // below it.
  const isOutbound = direction === "outbound";
  const here = isOutbound ? ends.from : ends.to;
  const other = isOutbound ? ends.to : ends.from;
  const endpointRejections = [
    rejectedEndpoint(fromRecord, "from", ends.from.typeLabel, isOutbound),
    rejectedEndpoint(toRecord, "to", ends.to.typeLabel, !isOutbound),
  ].filter((entry): entry is EndpointRejection => Boolean(entry));

  // A rejected edge or endpoint overrides the type-based valence: the whole
  // popover reads critical (red). Edge rejection explains why the relationship
  // was abandoned; endpoint rejection explains why a linked record is frozen.
  const isRejected = graph.effectiveLinkStatus(link) === "REJECTED";
  const tone =
    isRejected || endpointRejections.length > 0
      ? TONES.critical
      : TONES[linkTone(link.type)];

  // Verb phrased from the top (current) record's perspective so the diagram
  // always reads naturally top-to-bottom ("<here> evidences <other>" outbound,
  // "<here> evidenced by <other>" inbound). The arrow points at the edge's
  // canonical destination: down (out of the current record) when outbound, up
  // (into the current record) when inbound.
  // Symmetric links carry no direction: use the canonical verb and a horizontal
  // ↔ instead of the up/down arrow, matching the proposal editor.
  const symmetric = isSymmetricLink(link.type);
  const verb = symmetric
    ? LINK_TYPE_LABEL_PAIRS[link.type].forward
    : linkTypeLabel(link.type, direction);
  const DirectionArrow = symmetric
    ? ArrowLeftRight
    : isOutbound
      ? ArrowDown
      : ArrowUp;

  return (
    <Popover
      placement="top"
      triggerLabel={`Why this link: ${here.title} ${verb.toLowerCase()} ${other.title}`}
      triggerClassName="flex shrink-0 items-center rounded-md px-1 text-black/35 transition-colors hover:text-black/70"
      trigger={<Info className="h-3.5 w-3.5" />}
      className={`z-10001 flex w-72 max-w-[90vw] flex-col gap-1.5 rounded-xl border ${tone.surface} p-3 shadow-md backdrop-blur-sm`}
    >
      <RecordRow typeLabel={here.typeLabel} title={here.title} here />

      {/* Relationship verb: the heart of the edge. Color lives in the ink; the
          arrow points at the link's destination so direction is unmistakable. */}
      <div className={`flex items-center justify-center gap-1.5 ${tone.ink}`}>
        <DirectionArrow className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">{verb}</span>
      </div>

      <RecordRow typeLabel={other.typeLabel} title={other.title} />

      <p className="border-t border-black/10 pt-2 text-sm leading-5 text-black/75">
        {link.explanation}
      </p>

      {/* Why the edge was rejected — the reason the agent reads in lieu of
          following it. Inked critical to match the red panel. */}
      {isRejected && link.rejectionReason && (
        <p className={`border-t border-black/10 pt-2 text-sm leading-5 ${tone.ink}`}>
          <span className="font-medium">Rejected:</span>{" "}
          {displayRejectionReason(link.rejectionReason)}
        </p>
      )}

      {endpointRejections.map((rejection) => (
        <p
          key={rejection.key}
          className={`border-t border-black/10 pt-2 text-sm leading-5 ${tone.ink}`}
        >
          <span className="font-medium">
            {rejection.here
              ? "Current record rejected:"
              : `${rejection.typeLabel} rejected:`}
          </span>{" "}
          {rejection.reason}
        </p>
      ))}
    </Popover>
  );
}

export default LinkInfoPopover;
