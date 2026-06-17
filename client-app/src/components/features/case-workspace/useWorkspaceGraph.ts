import { useMemo, useState } from "react";

import type {
  GraphLink,
  LinkStatus,
  RecordParty,
  RecordStatus,
  RecordSubstatus,
  SupportStatus,
  TaskSubstatus,
  TypedCaseRecord,
} from "#/types/caseRecords";
import type { CaseDemo } from "#/demo/caseDemoTypes";
import {
  linkTypeLabel,
  RECORD_TYPE_LABELS,
  SUPPORT_STATUS_LABELS,
} from "#/lib/caseRecordPresentation";

export type ProposalDraftUpdate = {
  title: string;
  summary: string;
  content: string;
  category: string;
  supportStatus?: SupportStatus;
  supportStatusExplanation: string;
  substatus?: RecordSubstatus;
  party?: RecordParty;
  links: GraphLink[];
};

export type ProposalDecision = {
  status: "accepted";
};

export type SupportMetadataProposal = {
  id: string;
  recordId: string;
  sourceRecordId: string;
  sourceLinkId: string;
  supportStatus?: SupportStatus;
  supportStatusExplanation: string;
  createdAt: string;
};

type RecordDecision =
  | ProposalDecision
  | {
      status: "rejected";
      reason: string;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Workspace data hook: records + graph lookups + simulated lifecycle state
// ─────────────────────────────────────────────────────────────────────────────

// A record is "live" / authoritative once accepted — including while a
// replacement proposal is pending against it.
function isAuthoritative(status: RecordStatus) {
  return status === "ACCEPTED" || status === "PENDING_REPLACEMENT";
}

export function useWorkspaceGraph(demo: CaseDemo) {
  const [localNotes, setLocalNotes] = useState<TypedCaseRecord[]>([]);
  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>([]);
  const [editedRecords, setEditedRecords] = useState<
    Record<string, TypedCaseRecord>
  >({});
  const [editedLinks, setEditedLinks] = useState<Record<string, GraphLink>>({});
  const [deletedLinkIds, setDeletedLinkIds] = useState<string[]>([]);
  const [proposalDecisions, setProposalDecisions] = useState<
    Record<string, RecordDecision>
  >({});
  const [supportMetadataProposals, setSupportMetadataProposals] = useState<
    Record<string, SupportMetadataProposal>
  >({});
  // Per-task work-phase overrides set from the quick status control.
  const [taskSubstatusOverrides, setTaskSubstatusOverrides] = useState<
    Record<string, TaskSubstatus>
  >({});
  // Records whose replacement completed in this session (proposal accepted).
  const [replacedIds, setReplacedIds] = useState<string[]>([]);
  // Proposed records created in this session from an accepted record (revisions
  // that would replace their source). These flow through the normal review
  // queue and replacement lifecycle.
  const [addedRecords, setAddedRecords] = useState<TypedCaseRecord[]>([]);

  const records = useMemo(() => {
    const baseRecords = [...addedRecords, ...localNotes, ...demo.records];
    return baseRecords
      .map((record) => editedRecords[record.id] ?? record)
      .filter((record) => !deletedRecordIds.includes(record.id))
      // Fold session overrides onto the record itself so every consumer (lists,
      // search, links, inspector) reads them uniformly off the record — no
      // special-case map lookups downstream. The rejection reason is retained even
      // once the record is replaced, so the "why" survives a regenerated fix.
      .map((record) => {
        const decision = proposalDecisions[record.id];
        const rejectionReason =
          decision?.status === "rejected" ? decision.reason : undefined;
        const taskSubstatus =
          record.type === "TASK" ? taskSubstatusOverrides[record.id] : undefined;
        if (!rejectionReason && !taskSubstatus) return record;
        return {
          ...record,
          ...(taskSubstatus ? { substatus: taskSubstatus } : {}),
          ...(rejectionReason ? { rejectionReason } : {}),
        } as TypedCaseRecord;
      });
  }, [
    addedRecords,
    localNotes,
    demo.records,
    editedRecords,
    deletedRecordIds,
    proposalDecisions,
    taskSubstatusOverrides,
  ]);

  const recordsById = useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  );

  // Frozen disposition — orthogonal to lifecycle `status` (see RecordStatus). A
  // record is frozen by a session reject decision or by a stored `rejectedAt`:
  // reference-only as a traversal boundary until restored. Every consumer reads
  // "is this frozen?" through here so the rule lives in one place.
  const recordIsFrozen = (record: TypedCaseRecord): boolean => {
    const decision = proposalDecisions[record.id];
    if (decision) return decision.status === "rejected";
    return Boolean(record.rejectedAt);
  };

  const { outboundLinks, inboundLinks } = useMemo(() => {
    const outbound = new Map<string, GraphLink[]>();
    const inbound = new Map<string, GraphLink[]>();
    const demoLinkIds = new Set(demo.links.map((link) => link.id));
    const links = [
      ...demo.links.map((link) => editedLinks[link.id] ?? link),
      ...Object.values(editedLinks).filter((link) => !demoLinkIds.has(link.id)),
    ];

    for (const link of links) {
      if (
        deletedLinkIds.includes(link.id) ||
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
  }, [deletedLinkIds, deletedRecordIds, demo.links, editedLinks]);

  // Proposed records that replace another record, keyed by the target id.
  // Many-valued: one accepted record can be split into several proposed
  // successors, and the pending lock should show each live proposal.
  const pendingReplacementByTargetId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord[]>();
    for (const record of records) {
      if (
        record.status === "PROPOSED" &&
        !proposalDecisions[record.id] &&
        !recordIsFrozen(record) &&
        record.replacesIds
      ) {
        for (const targetId of record.replacesIds) {
          map.set(targetId, [...(map.get(targetId) ?? []), record]);
        }
      }
    }
    return map;
  }, [records, proposalDecisions]);

  // Accepted/retired replacements that supersede a target, keyed by target id.
  // Many-valued: a 1→N split retires one source in favor of several successors,
  // all of which list it in their `replacesIds`, so a single target can have
  // more than one successor here. This is what lets version history render a
  // branch ("Replaced by" → several records) rather than only the first one.
  const acceptedReplacementsByTargetId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord[]>();
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
        if (!recordsById.has(targetId)) continue;
        const existing = map.get(targetId) ?? [];
        if (existing.some((r) => r.id === record.id)) continue;
        map.set(targetId, [...existing, record]);
      }
    }
    return map;
  }, [records, recordsById, proposalDecisions]);

  const effectiveStatus = (record: TypedCaseRecord): RecordStatus => {
    // Lifecycle position only. The frozen disposition is orthogonal (see
    // recordIsFrozen): a frozen record keeps the lifecycle status it had, and
    // "Rejected" is derived for display, never returned here.
    // REPLACED still wins: regenerating a frozen record into an accepted
    // successor retires it to REPLACED, while its `rejectionReason` is left in
    // place so the audit trail survives the fix.
    if (replacedIds.includes(record.id)) return "REPLACED";
    const decision = proposalDecisions[record.id];
    if (decision?.status === "accepted") return "ACCEPTED";
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
    // A frozen endpoint is no longer authoritative, so its accepted edges demote
    // to PROPOSED — same as before, when freezing drove effectiveStatus to
    // REJECTED. Frozen is now orthogonal, so it must be checked explicitly.
    return from &&
      to &&
      isAuthoritative(effectiveStatus(from)) &&
      !recordIsFrozen(from) &&
      isAuthoritative(effectiveStatus(to)) &&
      !recordIsFrozen(to)
      ? "ACCEPTED"
      : "PROPOSED";
  };

  const proposedRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.status === "PROPOSED" &&
          !proposalDecisions[record.id] &&
          !recordIsFrozen(record),
      ),
    [records, proposalDecisions],
  );

  const supportMetadataProposalsByRecordId = useMemo(
    () =>
      new Map(
        Object.values(supportMetadataProposals).map((proposal) => [
          proposal.recordId,
          proposal,
        ]),
      ),
    [supportMetadataProposals],
  );

  const proposedSupportStatusFor = (
    link: GraphLink,
    record: TypedCaseRecord,
  ): SupportStatus | undefined => {
    if (record.supportStatus === "SUPPORT_NOT_REQUIRED") return undefined;

    if (
      link.type === "CONTRADICTS" ||
      link.type === "ATTACKS" ||
      link.type === "DUPLICATES"
    ) {
      return "CONFLICTED";
    }

    if (
      link.type === "EVIDENCES" ||
      link.type === "SUPPORTS" ||
      link.type === "CITES"
    ) {
      if (
        !record.supportStatus ||
        record.supportStatus === "UNKNOWN" ||
        record.supportStatus === "UNSUPPORTED"
      ) {
        return "PARTIALLY_SUPPORTED";
      }
      return record.supportStatus;
    }

    return undefined;
  };

  const generateSupportMetadataProposals = (source: TypedCaseRecord) => {
    const incidentLinks = [
      ...(outboundLinks.get(source.id) ?? []),
      ...(inboundLinks.get(source.id) ?? []),
    ];
    const now = new Date().toISOString();
    const nextProposals: Record<string, SupportMetadataProposal> = {};

    for (const link of incidentLinks) {
      const targetId =
        link.fromRecordId === source.id ? link.toRecordId : link.fromRecordId;
      if (source.replacesIds?.includes(targetId)) continue;

      const target = recordsById.get(targetId);
      if (!target || recordIsFrozen(target)) continue;

      const targetStatus = effectiveStatus(target);
      if (targetStatus !== "ACCEPTED" && targetStatus !== "PENDING_REPLACEMENT")
        continue;

      const proposedStatus = proposedSupportStatusFor(link, target);
      if (!proposedStatus) continue;

      const direction =
        link.fromRecordId === target.id ? "outbound" : "inbound";
      const relationship = linkTypeLabel(link.type, direction).toLowerCase();
      const sourceType = RECORD_TYPE_LABELS[source.type].toLowerCase();
      const proposedLabel = SUPPORT_STATUS_LABELS[proposedStatus].toLowerCase();

      nextProposals[target.id] = {
        id: `support-meta-${target.id}-${Date.now()}-${link.id}`,
        recordId: target.id,
        sourceRecordId: source.id,
        sourceLinkId: link.id,
        supportStatus: proposedStatus,
        supportStatusExplanation: `Newly accepted ${sourceType} "${source.title}" is now connected to this record as "${relationship}". Suggested support status: ${proposedLabel}. Review the linked record and edge rationale before accepting this metadata update.`,
        createdAt: now,
      };
    }

    if (Object.keys(nextProposals).length === 0) return;
    setSupportMetadataProposals((existing) => ({
      ...existing,
      ...nextProposals,
    }));
  };

  const decideProposal = (recordId: string, decision: ProposalDecision) => {
    const record = recordsById.get(recordId);
    if (!record || effectiveStatus(record) !== "PROPOSED") return;

    setProposalDecisions((decisions) => ({
      ...decisions,
      [recordId]: decision,
    }));
    // Accepting a replacement proposal retires its targets.
    if (decision.status === "accepted") {
      const record = recordsById.get(recordId);
      if (record) generateSupportMetadataProposals(record);
      if (record?.replacesIds?.length) {
        setReplacedIds((ids) => [
          ...ids,
          ...record.replacesIds!.filter((id) => !ids.includes(id)),
        ]);
      }
    }
  };

  // Agent-drafted revision of an accepted record. The human describes WHAT to
  // change (the instruction) rather than hand-editing the prose; the agent then
  // drafts a proposed revision for review. In this proof-of-concept the "agent"
  // is mocked: we seed the draft from the source content and mark it
  // agent-authored, landing it in the review queue (where it can be manually
  // edited). Like proposeRevision, replacesIds flips the source to "Pending
  // Replacement". The instruction itself is not persisted on the record.
  const requestAgentRevision = (recordId: string, instruction: string) => {
    const source = recordsById.get(recordId);
    if (!source || !instruction.trim()) return;
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
      createdBy: "agent",
      createdByUserId: undefined,
      createdAt: now,
      updatedAt: now,
    } as TypedCaseRecord;
    setAddedRecords((existing) => [revision, ...existing]);
  };

  const saveProposalDraft = (recordId: string, draft: ProposalDraftUpdate) => {
    const source = recordsById.get(recordId);
    if (!source || effectiveStatus(source) !== "PROPOSED") return;

    const now = new Date().toISOString();
    const editedRecord = {
      ...source,
      title: draft.title,
      summary: draft.summary.trim() ? draft.summary : undefined,
      content: draft.content,
      category: draft.category.trim() ? draft.category : undefined,
      supportStatus: draft.supportStatus,
      supportStatusExplanation: draft.supportStatus && draft.supportStatusExplanation.trim()
        ? draft.supportStatusExplanation
        : undefined,
      substatus: draft.substatus,
      party: draft.party,
      updatedAt: now,
    } as TypedCaseRecord;

    const incidentLinkIds = new Set<string>();
    for (const link of [
      ...(outboundLinks.get(recordId) ?? []),
      ...(inboundLinks.get(recordId) ?? []),
    ]) {
      incidentLinkIds.add(link.id);
    }

    const draftLinkIds = new Set(draft.links.map((link) => link.id));
    const removedLinkIds = [...incidentLinkIds].filter(
      (id) => !draftLinkIds.has(id),
    );

    setEditedRecords((existing) => ({
      ...existing,
      [recordId]: editedRecord,
    }));
    setEditedLinks((existing) => {
      const next = { ...existing };
      for (const link of draft.links) {
        next[link.id] = link;
      }
      for (const id of removedLinkIds) {
        delete next[id];
      }
      return next;
    });
    setDeletedLinkIds((ids) => [
      ...ids.filter((id) => !draftLinkIds.has(id)),
      ...removedLinkIds.filter((id) => !ids.includes(id)),
    ]);
  };

  const acceptSupportMetadataProposal = (proposalId: string) => {
    const proposal = Object.values(supportMetadataProposals).find(
      (candidate) => candidate.id === proposalId,
    );
    if (!proposal) return;

    const record = recordsById.get(proposal.recordId);
    if (!record) return;

    const now = new Date().toISOString();
    const editedRecord = {
      ...record,
      supportStatus: proposal.supportStatus,
      supportStatusExplanation: proposal.supportStatusExplanation.trim()
        ? proposal.supportStatusExplanation
        : undefined,
      updatedAt: now,
    } as TypedCaseRecord;

    setEditedRecords((existing) => ({
      ...existing,
      [record.id]: editedRecord,
    }));
    setSupportMetadataProposals((existing) => {
      const next = { ...existing };
      delete next[proposal.recordId];
      return next;
    });
  };

  const dismissSupportMetadataProposal = (proposalId: string) => {
    setSupportMetadataProposals((existing) => {
      const next = { ...existing };
      for (const proposal of Object.values(existing)) {
        if (proposal.id === proposalId) delete next[proposal.recordId];
      }
      return next;
    });
  };

  // Freeze (retire) a live record. The reason is persisted onto the record (see
  // the `records` memo) so it's auditable. Proposals leave review by deletion,
  // not rejection.
  const rejectRecord = (recordId: string, reason: string) => {
    const record = recordsById.get(recordId);
    if (!record) return;
    const status = effectiveStatus(record);
    if (status !== "ACCEPTED" && status !== "PENDING_REPLACEMENT") return;

    const trimmed = reason.trim();
    if (!trimmed) return;
    setProposalDecisions((decisions) => ({
      ...decisions,
      [recordId]: { status: "rejected", reason: trimmed },
    }));
  };

  // Restore a frozen record to its prior live status by clearing the decision.
  const restoreRecord = (recordId: string) => {
    setProposalDecisions((decisions) => {
      const next = { ...decisions };
      delete next[recordId];
      return next;
    });
  };

  const setTaskSubstatus = (recordId: string, substatus: TaskSubstatus) => {
    setTaskSubstatusOverrides((overrides) => ({
      ...overrides,
      [recordId]: substatus,
    }));
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
    setTaskSubstatusOverrides((overrides) => {
      const next = { ...overrides };
      delete next[recordId];
      return next;
    });
    setSupportMetadataProposals((existing) => {
      const next = { ...existing };
      for (const proposal of Object.values(existing)) {
        if (
          proposal.recordId === recordId ||
          proposal.sourceRecordId === recordId
        ) {
          delete next[proposal.recordId];
        }
      }
      return next;
    });
  };

  const createNote = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setLocalNotes((notes) => [
      {
        id: `note-local-${Date.now()}`,
        workspaceId: demo.workspaceId,
        caseId: demo.caseId,
        type: "NOTE",
        title: trimmed.split("\n")[0].slice(0, 72),
        summary: "New working case note captured in the workspace.",
        content: trimmed,
        category: "Case note",
        status: "ACCEPTED",
        version: 1,
        createdBy: "human",
        createdByUserId: demo.userId,
        approvedByUserId: demo.userId,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...notes,
    ]);
  };

  return {
    demo,
    records,
    recordsById,
    outboundLinks,
    inboundLinks,
    effectiveStatus,
    recordIsFrozen,
    effectiveLinkStatus,
    pendingReplacementByTargetId,
    acceptedReplacementsByTargetId,
    supportMetadataProposalsByRecordId,
    proposedRecords,
    proposalDecisions,
    decideProposal,
    rejectRecord,
    restoreRecord,
    setTaskSubstatus,
    acceptSupportMetadataProposal,
    dismissSupportMetadataProposal,
    requestAgentRevision,
    saveProposalDraft,
    deleteRecord,
    createNote,
  };
}

export type WorkspaceGraph = ReturnType<typeof useWorkspaceGraph>;
