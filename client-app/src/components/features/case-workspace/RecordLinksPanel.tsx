import { useContext } from "react";
import { Link2 } from "lucide-react";

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
//   • A rejected record shows its incident link history for audit, even though
//     those edges no longer count as authoritative reasoning paths.
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
  // Frozen is orthogonal to lifecycle, so it overrides the live/proposed reads:
  // a frozen record is treated as rejected here (unless it's also replaced, where
  // replaced wins and its links read as provenance). This mirrors the old model,
  // where freezing drove effectiveStatus to REJECTED.
  const frozen = graph.recordIsFrozen(record);
  const recordIsProposed = viewStatus === "PROPOSED" && !frozen;
  const recordIsAccepted = viewStatus === "ACCEPTED" && !frozen;
  const recordIsRejected = frozen && viewStatus !== "REPLACED";
  const recordIsPendingReplacement =
    viewStatus === "PENDING_REPLACEMENT" && !frozen;
  const recordIsReplaced = viewStatus === "REPLACED";

  const {
    show: showProposedLinks,
    setShow: setShowProposedLinks,
    showRejected: showRejectedRecords,
    setShowRejected: setShowRejectedRecords,
  } = useContext(ShowProposedLinksContext);
  const canToggleProposedLinks = allowProposedLinksToggle && recordIsAccepted;
  const canToggleRejectedRecords = allowProposedLinksToggle && recordIsAccepted;
  const shouldShowProposedLinks = canToggleProposedLinks && showProposedLinks;
  const shouldHideRejectedSignals =
    canToggleRejectedRecords && !showRejectedRecords;

  const otherEndpointId = (link: GraphLink) =>
    link.fromRecordId === record.id ? link.toRecordId : link.fromRecordId;

  // A proposed link is worth showing while its other endpoint isn't retired.
  const proposedLinkVisible = (link: GraphLink) => {
    const other = graph.recordsById.get(otherEndpointId(link));
    return !other || graph.effectiveStatus(other) !== "REPLACED";
  };

  const linkPointsToRejectedRecord = (link: GraphLink) => {
    const other = graph.recordsById.get(otherEndpointId(link));
    return Boolean(
      other &&
        graph.recordIsFrozen(other) &&
        graph.effectiveStatus(other) !== "REPLACED",
    );
  };

  // A rejection is information the agent can read without traversing: surface
  // both rejected edges and edges to rejected records in every view, so a
  // rejected path (and its reason) is never hidden. The red chip / red popover
  // make their status unmistakable.
  const rejectionInformative = (link: GraphLink) => {
    if (graph.effectiveLinkStatus(link) === "REJECTED") return true;
    return linkPointsToRejectedRecord(link);
  };

  const visibleLink = (link: GraphLink) => {
    if (shouldHideRejectedSignals && rejectionInformative(link)) {
      return false;
    }
    if (rejectionInformative(link)) return true;
    if (recordIsReplaced) return true;
    // Frozen records are reference-only, but their link history is still audit
    // context. Their accepted edges intentionally demote to PROPOSED because a
    // rejected endpoint is no longer authoritative; keep those incident links
    // visible here so the human can still inspect how the abandoned record fit.
    if (recordIsRejected) return proposedLinkVisible(link);
    if (recordIsProposed || recordIsPendingReplacement) {
      return proposedLinkVisible(link);
    }
    // Plain accepted: authoritative links always; proposed links only when the
    // inspector toggle is available and opted in.
    if (graph.effectiveLinkStatus(link) === "ACCEPTED") return true;
    return shouldShowProposedLinks && proposedLinkVisible(link);
  };

  const hasVisiblePredecessorLink = (
    replacement: TypedCaseRecord,
    carriedLink: GraphLink,
    direction: "outbound" | "inbound",
  ) =>
    (replacement.replacesIds ?? []).some((predecessorId) =>
      (direction === "outbound"
        ? graph.outboundLinks.get(record.id)
        : graph.inboundLinks.get(record.id)
      )?.some((candidate) => {
        const predecessorEndpoint =
          direction === "outbound"
            ? candidate.toRecordId
            : candidate.fromRecordId;
        return (
          predecessorEndpoint === predecessorId &&
          candidate.type === carriedLink.type &&
          visibleLink(candidate)
        );
      }),
    );

  // When a pending-replacement target is shown with its successor nested
  // beneath it, suppress the successor's proposed carry-forward edge from the
  // main list. Otherwise the same proposal appears twice: once as dependency
  // context and once as a standalone proposed link.
  const visibleNonDuplicateLink =
    (direction: "outbound" | "inbound") => (link: GraphLink) => {
      if (!visibleLink(link)) return false;
      if (graph.effectiveLinkStatus(link) === "ACCEPTED") return true;

      const other = graph.recordsById.get(otherEndpointId(link));
      if (!other?.replacesIds?.length) return true;

      return !hasVisiblePredecessorLink(other, link, direction);
    };

  const outbound = (graph.outboundLinks.get(record.id) ?? []).filter(
    visibleNonDuplicateLink("outbound"),
  );
  const inbound = (graph.inboundLinks.get(record.id) ?? []).filter(
    visibleNonDuplicateLink("inbound"),
  );
  const hasVisibleLinks = outbound.length > 0 || inbound.length > 0;

  const groupLinks = (
    links: GraphLink[],
    direction: "outbound" | "inbound",
  ) => {
    const groups = new Map<
      string,
      {
        record: TypedCaseRecord;
        link: GraphLink;
        direction: "outbound" | "inbound";
      }[]
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
        { record: target, link, direction },
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
          {entries.map(({ record: target, link, direction }) => {
            // If this link's target is mid-replacement, show the proposal that
            // would replace it inline — but only the proposal(s) that carry THIS
            // relationship forward to the record being viewed. A target's split
            // can fan out to several successors, each inheriting a different
            // slice of its links; surfacing a successor here that never links
            // back to `record` would imply a relationship it doesn't have.
            const replacements =
              graph.pendingReplacementByTargetId.get(target.id) ?? [];
            // Never list the record we're viewing beneath itself (it may itself
            // be one of the target's proposed replacements).
            const otherReplacements = replacements.filter(
              (replacement) => replacement.id !== record.id,
            );

            // `target` sits on one side of `link`; mirror that orientation when
            // checking for a replacement's proposed link back to `record`.
            // Inbound group (target is `from`): the carry-forward link is
            // replacement → record. Outbound group (target is `to`): it's
            // record → replacement.
            const targetIsFrom = link.fromRecordId === target.id;
            const carriedLinkToRecord = (replacement: TypedCaseRecord) =>
              (targetIsFrom
                ? graph.inboundLinks.get(record.id)
                : graph.outboundLinks.get(record.id)
              )?.find((candidate) => {
                const replacementEndpoint = targetIsFrom
                  ? candidate.fromRecordId
                  : candidate.toRecordId;
                return (
                  replacementEndpoint === replacement.id &&
                  candidate.type === link.type &&
                  graph.effectiveLinkStatus(candidate) === "PROPOSED"
                );
              });

            const carriedReplacements = otherReplacements
              .map((replacement) => ({
                replacement,
                carriedLink: carriedLinkToRecord(replacement),
              }))
              .filter(
                (
                  entry,
                ): entry is {
                  replacement: TypedCaseRecord;
                  carriedLink: GraphLink;
                } => Boolean(entry.carriedLink),
              );
            const visibleReplacements =
              recordIsAccepted && !shouldShowProposedLinks
                ? []
                : carriedReplacements;
            // Only show the amber "Pending Replacement" treatment when the
            // panel can also show the successor record(s) directly beneath this
            // chip. Without that paired context, the badge suggests a hidden
            // replacement path that is not visible in this relationship view.
            const showTargetPendingReplacement = visibleReplacements.length > 0;
            return (
              <div key={link.id} className="min-w-0">
                <RecordChip
                  record={target}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds?.has(target.id)}
                  showPendingReplacement={showTargetPendingReplacement}
                  link={link}
                  linkDirection={direction}
                />
                {/* Every edge now states its rationale, so the inspector shows
                    it inline on every link (a clamped preview) — no longer
                    gated to proposed/replaced records. The chip's Info icon
                    opens the full, untruncated explanation with confidence. */}
                {/* <p className="mt-0.5 pl-1 text-xs leading-snug text-black/55 line-clamp-2">
                  {link.explanation}
                </p> */}
                {visibleReplacements.length > 0 && (
                  <div className="ml-3 mt-1 flex flex-col">
                    {/* <span className="mb-1 flex items-center gap-1 text-[0.7rem] uppercase tracking-wide text-black/40">
                      <CornerDownRight className="h-3 w-3" />
                      Proposed Replacement{" "}
                      {visibleReplacements.length > 1 ? "Records" : "Record"}
                    </span> */}
                    {visibleReplacements.map(
                      ({ replacement, carriedLink }, index) => {
                        const isLast = index === visibleReplacements.length - 1;
                        return (
                          <div
                            key={replacement.id}
                            className="relative flex items-center py-0.5"
                          >
                            {/* Tree connector, drawn as two non-overlapping
                              layers so the trunk stays unbroken while every chip
                              gets its own rounded elbow:
                                • a straight vertical trunk down the left. While
                                  more chips follow it runs the full row height;
                                  on the last chip it stops exactly where the
                                  curve begins (center − corner radius) so nothing
                                  dangles below the terminal L.
                                • a quarter-circle elbow whose height equals the
                                  corner radius, so it has no straight vertical
                                  run — it only meets the trunk tangentially and
                                  curves out to the chip at its vertical center. */}
                            <span
                              aria-hidden
                              className={`absolute left-0 top-0 w-px bg-black/15 ${
                                isLast ? "h-[calc(50%-0.5rem)]" : "bottom-0"
                              }`}
                            />
                            <span
                              aria-hidden
                              className="absolute bottom-1/2 left-0 h-2 w-4 rounded-bl-lg border-b border-l border-black/15"
                            />
                            <div className="min-w-0 flex-1 pl-4">
                              <RecordChip
                                record={replacement}
                                graph={graph}
                                onOpenRecord={onOpenRecord}
                                isCycle={visitedIds?.has(replacement.id)}
                                pairedReplacement
                                link={carriedLink}
                                linkDirection={direction}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
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
      {canToggleProposedLinks && (
        <div className="flex flex-col items-start gap-2 mb-1">
          <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#282828]"
              checked={showProposedLinks}
              onChange={(event) => setShowProposedLinks(event.target.checked)}
            />
            Show links to records under review
          </label>
          <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-black/60">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#282828]"
              checked={showRejectedRecords}
              onChange={(event) => setShowRejectedRecords(event.target.checked)}
            />
            Show rejected records
          </label>
        </div>
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
              : recordIsRejected
                ? "This frozen record has no linked records."
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
