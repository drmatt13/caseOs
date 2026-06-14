import { useMemo, useState } from "react";

import type {
  GraphLink,
  LinkStatus,
  RecordStatus,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  demoLinks,
  demoRecords,
  demoUserId,
  DEMO_CASE_ID,
  DEMO_WORKSPACE_ID,
} from "#/lib/caseWorkspaceDemo";

export type ProposalDecision = {
  status: "accepted" | "rejected";
  reason?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Workspace data hook: records + graph lookups + simulated lifecycle state
// ─────────────────────────────────────────────────────────────────────────────

// A record is "live" / authoritative once accepted — including while a
// replacement proposal is pending against it.
function isAuthoritative(status: RecordStatus) {
  return status === "ACCEPTED" || status === "PENDING_REPLACEMENT";
}

export function useWorkspaceGraph() {
  const [localNotes, setLocalNotes] = useState<TypedCaseRecord[]>([]);
  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>([]);
  const [proposalDecisions, setProposalDecisions] = useState<
    Record<string, ProposalDecision>
  >({});
  // Records whose replacement completed in this session (proposal accepted).
  const [replacedIds, setReplacedIds] = useState<string[]>([]);
  // Proposed records created in this session from an accepted record (revisions
  // that would replace their source). These flow through the normal review
  // queue and replacement lifecycle.
  const [addedRecords, setAddedRecords] = useState<TypedCaseRecord[]>([]);

  const records = useMemo(
    () =>
      [...addedRecords, ...localNotes, ...demoRecords].filter(
        (record) => !deletedRecordIds.includes(record.id),
      ),
    [addedRecords, localNotes, deletedRecordIds],
  );

  const recordsById = useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  );

  const { outboundLinks, inboundLinks } = useMemo(() => {
    const outbound = new Map<string, GraphLink[]>();
    const inbound = new Map<string, GraphLink[]>();

    for (const link of demoLinks) {
      if (
        deletedRecordIds.includes(link.fromRecordId) ||
        deletedRecordIds.includes(link.toRecordId)
      ) {
        continue;
      }
      outbound.set(link.fromRecordId, [
        ...(outbound.get(link.fromRecordId) ?? []),
        link,
      ]);
      inbound.set(link.toRecordId, [
        ...(inbound.get(link.toRecordId) ?? []),
        link,
      ]);
    }

    return { outboundLinks: outbound, inboundLinks: inbound };
  }, [deletedRecordIds]);

  // Proposed records that replace another record, keyed by the target id.
  const pendingReplacementByTargetId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord>();
    for (const record of records) {
      if (
        record.status === "PROPOSED" &&
        !proposalDecisions[record.id] &&
        record.replacesIds
      ) {
        for (const targetId of record.replacesIds) {
          map.set(targetId, record);
        }
      }
    }
    return map;
  }, [records, proposalDecisions]);

  const acceptedReplacementByTargetId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord>();
    for (const record of records) {
      if (!record.replacesIds?.length) continue;

      const decision = proposalDecisions[record.id];
      const isAcceptedReplacement =
        decision?.status === "accepted" ||
        (!decision &&
          (record.status === "ACCEPTED" ||
            record.status === "PENDING_REPLACEMENT" ||
            record.status === "REPLACED"));

      if (!isAcceptedReplacement) continue;

      for (const targetId of record.replacesIds) {
        if (!recordsById.has(targetId) || map.has(targetId)) continue;
        map.set(targetId, record);
      }
    }
    return map;
  }, [records, recordsById, proposalDecisions]);

  const effectiveStatus = (record: TypedCaseRecord): RecordStatus => {
    const decision = proposalDecisions[record.id];
    if (decision)
      return decision.status === "accepted" ? "ACCEPTED" : "REJECTED";
    if (replacedIds.includes(record.id)) return "REPLACED";
    // An accepted record reads as "Pending Replacement" only while a live
    // replacement proposal targets it; if that proposal is decided away, it
    // reverts to plain accepted.
    if (
      record.status === "ACCEPTED" ||
      record.status === "PENDING_REPLACEMENT"
    ) {
      return pendingReplacementByTargetId.has(record.id)
        ? "PENDING_REPLACEMENT"
        : "ACCEPTED";
    }
    return record.status;
  };

  // A link is authoritative only while BOTH of its endpoints are authoritative.
  // This single rule does two jobs:
  //   • promotes a proposal's links on acceptance — links to already-accepted
  //     records flip immediately, links to still-proposed records stay proposed
  //     until those are accepted in turn; and
  //   • demotes an "accepted" link whose endpoint is (or becomes) proposed or
  //     replaced — so an accepted record never displays a link pointing into a
  //     proposed record.
  const effectiveLinkStatus = (link: GraphLink): LinkStatus => {
    if (link.status === "REJECTED") return "REJECTED";
    const from = recordsById.get(link.fromRecordId);
    const to = recordsById.get(link.toRecordId);
    return from &&
      to &&
      isAuthoritative(effectiveStatus(from)) &&
      isAuthoritative(effectiveStatus(to))
      ? "ACCEPTED"
      : "PROPOSED";
  };

  const proposedRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.status === "PROPOSED" && !proposalDecisions[record.id],
      ),
    [records, proposalDecisions],
  );

  const decideProposal = (recordId: string, decision: ProposalDecision) => {
    setProposalDecisions((decisions) => ({
      ...decisions,
      [recordId]: decision,
    }));
    // Accepting a replacement proposal retires its targets.
    if (decision.status === "accepted") {
      const record = recordsById.get(recordId);
      if (record?.replacesIds?.length) {
        setReplacedIds((ids) => [
          ...ids,
          ...record.replacesIds!.filter((id) => !ids.includes(id)),
        ]);
      }
    }
  };

  // Propose a revised version of an accepted record. The draft becomes a new
  // PROPOSED record that would replace its source — the primary path for a
  // human to turn an accepted record into a fresh proposal. It carries the
  // source's type and type-specific fields, lands in the review queue, and (via
  // replacesIds) flips the source to "Pending Replacement".
  const proposeRevision = (recordId: string, draft: string) => {
    const source = recordsById.get(recordId);
    const trimmed = draft.trim();
    if (!source || !trimmed) return;
    const now = new Date().toISOString();
    const revision = {
      ...source,
      id: `proposal-${recordId}-${Date.now()}`,
      status: "PROPOSED",
      version: source.version + 1,
      replacesIds: [source.id],
      replacedByIds: undefined,
      approvedByUserId: undefined,
      approvedAt: undefined,
      createdBy: "human",
      createdByUserId: demoUserId,
      content: trimmed,
      createdAt: now,
      updatedAt: now,
    } as TypedCaseRecord;
    setAddedRecords((existing) => [revision, ...existing]);
  };

  const deleteRecord = (recordId: string) => {
    setDeletedRecordIds((ids) =>
      ids.includes(recordId) ? ids : [...ids, recordId],
    );
    setProposalDecisions((decisions) => {
      const next = { ...decisions };
      delete next[recordId];
      return next;
    });
  };

  const createNote = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setLocalNotes((notes) => [
      {
        id: `note-local-${Date.now()}`,
        workspaceId: DEMO_WORKSPACE_ID,
        caseId: DEMO_CASE_ID,
        type: "NOTE",
        substatus: "GENERAL",
        title: trimmed.split("\n")[0].slice(0, 72),
        summary: "New working case note captured in the workspace.",
        content: trimmed,
        category: "Case note",
        status: "ACCEPTED",
        version: 1,
        createdBy: "human",
        createdByUserId: demoUserId,
        approvedByUserId: demoUserId,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...notes,
    ]);
  };

  return {
    records,
    recordsById,
    outboundLinks,
    inboundLinks,
    effectiveStatus,
    effectiveLinkStatus,
    pendingReplacementByTargetId,
    acceptedReplacementByTargetId,
    proposedRecords,
    proposalDecisions,
    decideProposal,
    proposeRevision,
    deleteRecord,
    createNote,
  };
}

export type WorkspaceGraph = ReturnType<typeof useWorkspaceGraph>;
