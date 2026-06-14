import { useContext } from "react";
import { CornerDownRight, Link2 } from "lucide-react";

import type { GraphLink, TypedCaseRecord } from "#/types/caseRecords";
import {
  LINK_TYPE_INBOUND_LABELS,
  LINK_TYPE_LABELS,
} from "#/lib/caseRecordPresentation";

import RecordChip from "./RecordChip";
import { ShowProposedLinksContext } from "./showProposedLinksContext";
import type { WorkspaceGraph } from "./useWorkspaceGraph";

// Outbound + inbound graph links for a record, grouped by link type.
//
// What's shown depends on the record being viewed:
//   • A proposed record carries every link as part of the same proposal — shown
//     in full, but never one pointing at a retired record.
//   • A plain accepted record shows only its authoritative links by default; in
//     the inspector, a checkbox opts into proposed links to records in review.
//   • A pending-replacement record shows review links in full because the
//     record itself is already in an unsettled lifecycle state.
//   • A replaced record keeps its historical links for provenance.
// When a link's target is mid-replacement, the proposal that would replace it
// is shown inline beneath it ("replaced by", offset on a connector rail) so the
// two coexist — accepting the replacement retires the target, which then drops
// out of view on its own.
// `visitedIds` are records already open higher in the inspector path; their
// chips are grayed to flag circular references.
function RecordLinksPanel({
  record,
  graph,
  onOpenRecord,
  visitedIds,
  allowProposedLinksToggle = false,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
  allowProposedLinksToggle?: boolean;
}) {
  const viewStatus = graph.effectiveStatus(record);
  const recordIsProposed = viewStatus === "PROPOSED";
  const recordIsAccepted = viewStatus === "ACCEPTED";
  const recordIsPendingReplacement = viewStatus === "PENDING_REPLACEMENT";
  const recordIsReplaced = viewStatus === "REPLACED";

  const { show: showProposedLinks, setShow: setShowProposedLinks } = useContext(
    ShowProposedLinksContext,
  );
  const canToggleProposedLinks = allowProposedLinksToggle && recordIsAccepted;
  const shouldShowProposedLinks = canToggleProposedLinks && showProposedLinks;

  const otherEndpointId = (link: GraphLink) =>
    link.fromRecordId === record.id ? link.toRecordId : link.fromRecordId;

  // A proposed link is worth showing while its other endpoint isn't retired.
  const proposedLinkVisible = (link: GraphLink) => {
    const other = graph.recordsById.get(otherEndpointId(link));
    return !other || graph.effectiveStatus(other) !== "REPLACED";
  };

  const visibleLink = (link: GraphLink) => {
    if (recordIsReplaced) return true;
    if (recordIsProposed || recordIsPendingReplacement) {
      return proposedLinkVisible(link);
    }
    // Plain accepted: authoritative links always; proposed links only when the
    // inspector toggle is available and opted in.
    if (graph.effectiveLinkStatus(link) === "ACCEPTED") return true;
    return shouldShowProposedLinks && proposedLinkVisible(link);
  };

  const allLinks = [
    ...(graph.outboundLinks.get(record.id) ?? []),
    ...(graph.inboundLinks.get(record.id) ?? []),
  ];
  // Whether the checkbox would reveal anything (proposed links currently hidden).
  const hasProposedLinks =
    canToggleProposedLinks &&
    allLinks.some(
      (link) =>
        graph.effectiveLinkStatus(link) !== "ACCEPTED" &&
        proposedLinkVisible(link),
    );

  const outbound = (graph.outboundLinks.get(record.id) ?? []).filter(
    visibleLink,
  );
  const inbound = (graph.inboundLinks.get(record.id) ?? []).filter(visibleLink);
  const hasVisibleLinks = outbound.length > 0 || inbound.length > 0;

  const groupLinks = (
    links: GraphLink[],
    direction: "outbound" | "inbound",
  ) => {
    const groups = new Map<
      string,
      { record: TypedCaseRecord; link: GraphLink }[]
    >();
    for (const link of links) {
      const targetId =
        direction === "outbound" ? link.toRecordId : link.fromRecordId;
      const target = graph.recordsById.get(targetId);
      if (!target) continue;
      const label =
        direction === "outbound"
          ? LINK_TYPE_LABELS[link.type]
          : LINK_TYPE_INBOUND_LABELS[link.type];
      groups.set(label, [
        ...(groups.get(label) ?? []),
        { record: target, link },
      ]);
    }
    return groups;
  };

  const renderGroups = (groups: ReturnType<typeof groupLinks>) =>
    [...groups.entries()].map(([label, entries]) => (
      <div key={label} className="min-w-0">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-black/65">
          <Link2 className="h-3.5 w-3.5" />
          {label}
        </p>
        <div className="flex flex-col gap-1.5">
          {entries.map(({ record: target, link }) => {
            // If this link's target is mid-replacement, show the proposal that
            // would replace it inline — both coexist until the replacement is
            // accepted, at which point the target retires and drops out.
            const replacement = graph.pendingReplacementByTargetId.get(
              target.id,
            );
            return (
              <div key={link.id} className="min-w-0">
                <RecordChip
                  record={target}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds?.has(target.id)}
                />
                {(recordIsProposed || recordIsReplaced) && link.explanation && (
                  <p className="mt-0.5 pl-1 text-xs text-black/55">
                    {link.explanation}
                  </p>
                )}
                {replacement && replacement.id !== record.id && (
                  <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-black/15 pl-3">
                    <span className="flex items-center gap-1 text-[0.7rem] uppercase tracking-wide text-black/40">
                      <CornerDownRight className="h-3 w-3" />
                      Proposed Replacement Record
                    </span>
                    <RecordChip
                      record={replacement}
                      graph={graph}
                      onOpenRecord={onOpenRecord}
                      isCycle={visitedIds?.has(replacement.id)}
                      pairedReplacement
                      // hideProposedReplacementPill
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className="flex flex-col gap-3">
      {recordIsAccepted && hasProposedLinks && (
        <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#282828]"
            checked={showProposedLinks}
            onChange={(event) => setShowProposedLinks(event.target.checked)}
          />
          Show proposed links to records in review
        </label>
      )}
      {recordIsReplaced && (
        <p className="rounded-lg border border-black/15 bg-black/[0.025] px-2.5 py-1.5 text-xs leading-5 text-black/55">
          Historical links, retained for provenance. They are hidden from
          accepted records and proposals.
        </p>
      )}
      {!hasVisibleLinks ? (
        <div className="rounded-lg border border-black/15 bg-black/[0.025] p-3 text-sm text-black/50">
          {recordIsProposed
            ? "This proposal introduces no linked records yet."
            : recordIsReplaced
              ? "This record had no links."
              : "No accepted links yet."}
        </div>
      ) : (
        <>
          {outbound.length > 0 &&
            renderGroups(groupLinks(outbound, "outbound"))}
          {inbound.length > 0 && renderGroups(groupLinks(inbound, "inbound"))}
        </>
      )}
    </div>
  );
}

export default RecordLinksPanel;
