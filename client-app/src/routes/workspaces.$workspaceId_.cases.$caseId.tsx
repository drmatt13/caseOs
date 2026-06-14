import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CornerDownRight,
  FileText,
  Filter,
  GitBranch,
  Image as ImageIcon,
  Link2,
  Lock,
  PencilLine,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";

import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import ActiveWorkspaceMenu, {
  type ViewCount,
} from "#/components/menus/ActiveWorkspaceMenu";
import UserPanel from "#/components/UserPanel";
import PageLoading from "#/components/PageLoading";
import Button from "#/components/Button";
import TextAreaField from "#/components/TextAreaField";
import { requireAuth } from "#/lib/auth";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";
import GetUserError from "#/components/errors/GetUserError";

import type {
  CaseDocument,
  GraphLink,
  LinkStatus,
  RecordStatus,
  TimelineEventRecord,
  TypedCaseRecord,
} from "#/types/caseRecords";
import {
  RECORD_TYPE_VIEW,
  VIEW_RECORD_TYPE,
  type RecordViewType,
  type WorkspaceViewType,
} from "#/types/caseWorkspace";
import {
  ATTENTION_SUBSTATUSES,
  LINK_TYPE_INBOUND_LABELS,
  LINK_TYPE_LABELS,
  RECORD_DISPLAY_STATUS_CARD_CLASSES,
  RECORD_DISPLAY_STATUS_CLASSES,
  RECORD_DISPLAY_STATUS_LABELS,
  RECORD_PARTY_CLASSES,
  RECORD_STATUS_LABELS,
  RECORD_SUBSTATUS_LABELS,
  RECORD_TYPE_LABELS,
  SINGULAR_VIEW_LABELS,
  SUPPORT_STATUS_LABELS,
  VIEW_DESCRIPTIONS,
  VIEW_LABELS,
  type RecordDisplayStatus,
  recordPartyLabel,
} from "#/lib/caseRecordPresentation";
import {
  demoActivity,
  demoAgentInstructions,
  demoAgentThread,
  demoCase,
  demoCaseContext,
  demoDocuments,
  demoLinks,
  demoRecords,
  demoUserId,
  DEMO_CASE_ID,
  DEMO_WORKSPACE_ID,
} from "#/lib/caseWorkspaceDemo";

export const Route = createFileRoute("/workspaces/$workspaceId_/cases/$caseId")(
  {
    beforeLoad: requireAuth,
    component: RouteComponent,
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Local types & helpers
// ─────────────────────────────────────────────────────────────────────────────

type ProposalDecision = {
  status: "accepted" | "rejected";
  reason?: string;
};

// "Show proposed links" is an inspector view preference, not per-record: once
// turned on it should persist as you open record after record in the inspector
// (each inspected record remounts its own RecordLinksPanel).
const ShowProposedLinksContext = createContext<{
  show: boolean;
  setShow: (value: boolean) => void;
}>({ show: false, setShow: () => {} });

const clientRole = demoCaseContext.representation.clientRole;

function formatDate(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isImageDocument(document: CaseDocument) {
  return Boolean(document.mimeType?.startsWith("image/"));
}

// Where in the source file a document record draws from. Images don't paginate,
// so they read as a region rather than a page range.
function documentScopeLabel(
  record: Extract<TypedCaseRecord, { type: "DOCUMENT" }>,
  document: CaseDocument,
) {
  if (record.pageRange) {
    const { start, end } = record.pageRange;
    const pages = start === end ? `Page ${start}` : `Pages ${start}–${end}`;
    return document.pageCount ? `${pages} of ${document.pageCount}` : pages;
  }
  if (isImageDocument(document)) return "Image region";
  return document.pageCount
    ? `Whole file (${document.pageCount} pp.)`
    : "Whole file";
}

// Placeholder affordance to open the underlying file/image. Wired to nothing
// yet — the real viewer will stream the stored object.
function DocumentViewButton({ document }: { document: CaseDocument }) {
  const image = isImageDocument(document);
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-xs text-black/70 transition-colors hover:bg-black/10"
      title={image ? "View image" : "Open document"}
      onClick={(event) => event.stopPropagation()}
    >
      {image ? (
        <ImageIcon className="h-3.5 w-3.5" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      {image ? "View image" : "Open document"}
    </button>
  );
}

function recordMatchesSearch(record: TypedCaseRecord, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();
  if (normalizedSearch.length === 0) return true;

  return [
    RECORD_TYPE_LABELS[record.type],
    record.title,
    record.summary ?? "",
    record.content,
    record.category ?? "",
    record.substatus ? RECORD_SUBSTATUS_LABELS[record.substatus] : "",
    record.party ? recordPartyLabel(record.party, clientRole) : "",
    // A proposed record that replaces reads as "Proposed Replacement"; index
    // that label so the term finds it (raw status alone would only say Proposed).
    record.status === "PROPOSED" && record.replacesIds?.length
      ? RECORD_DISPLAY_STATUS_LABELS.PROPOSED_REPLACEMENT
      : RECORD_STATUS_LABELS[record.status],
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

// ─────────────────────────────────────────────────────────────────────────────
// Workspace data hook: records + graph lookups + simulated lifecycle state
// ─────────────────────────────────────────────────────────────────────────────

// A record is "live" / authoritative once accepted — including while a
// replacement proposal is pending against it.
function isAuthoritative(status: RecordStatus) {
  return status === "ACCEPTED" || status === "PENDING_REPLACEMENT";
}

function useWorkspaceGraph() {
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
      replacedById: undefined,
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
    proposedRecords,
    proposalDecisions,
    decideProposal,
    proposeRevision,
    deleteRecord,
    createNote,
  };
}

type WorkspaceGraph = ReturnType<typeof useWorkspaceGraph>;

// ─────────────────────────────────────────────────────────────────────────────
// Route component
// ─────────────────────────────────────────────────────────────────────────────

function RouteComponent() {
  const { workspaceId, caseId } = Route.useParams();

  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
  } = useWorkspaceQuery(workspaceId, { enabled: Boolean(user) });

  const graph = useWorkspaceGraph();
  const [activeView, setActiveView] = useState<WorkspaceViewType>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [panelSearch, setPanelSearch] = useState("");
  // Replaced records are hidden by default so the views show only live work.
  const [selectedStatuses, setSelectedStatuses] = useState<RecordStatus[]>(
    DEFAULT_VISIBLE_STATUSES,
  );
  // Graph traversal: a stack of record ids opened in the inspector drawer.
  const [inspectorStack, setInspectorStack] = useState<string[]>([]);
  // Sticky inspector preference for accepted records as graph traversal moves
  // from one inspected record to the next.
  const [showProposedLinks, setShowProposedLinks] = useState(false);
  const showProposedLinksValue = useMemo(
    () => ({ show: showProposedLinks, setShow: setShowProposedLinks }),
    [showProposedLinks],
  );

  const openRecord = (recordId: string) => {
    setInspectorStack((stack) =>
      stack[stack.length - 1] === recordId ? stack : [...stack, recordId],
    );
  };

  const handleSelectView = (view: WorkspaceViewType) => {
    setActiveView(view);
    setPanelSearch("");
    setGlobalSearch("");
  };

  const viewCounts = useMemo(() => {
    const counts: Partial<Record<WorkspaceViewType, ViewCount>> = {};
    for (const record of graph.records) {
      const view = RECORD_TYPE_VIEW[record.type];
      const status = graph.effectiveStatus(record);
      const entry = counts[view] ?? { accepted: 0, proposed: 0 };
      if (status === "PROPOSED") entry.proposed += 1;
      else if (status === "ACCEPTED" || status === "PENDING_REPLACEMENT")
        entry.accepted += 1;
      counts[view] = entry;
    }
    // Documents are a special case: the gray badge counts source files (the
    // authoritative documents the tab lists), but each file can also yield
    // DOCUMENT case records that flow through the proposed→accepted lifecycle.
    // The loop above already tallied those into counts.documents; keep its
    // proposed count so extracted records still awaiting review surface in the
    // blue badge rather than being hidden behind the file count.
    const documentRecordCounts = counts.documents ?? {
      accepted: 0,
      proposed: 0,
    };
    counts.documents = {
      accepted: demoDocuments.length,
      proposed: documentRecordCounts.proposed,
    };
    return counts;
    // graph.effectiveStatus is recreated each render; records is the real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.records]);

  const globalSearchResults = useMemo(
    () =>
      globalSearch.trim().length === 0
        ? []
        : graph.records.filter((record) =>
            recordMatchesSearch(record, globalSearch),
          ),
    [globalSearch, graph.records],
  );

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  const pendingProposalCount = graph.proposedRecords.length;

  return (
    <ShowProposedLinksContext.Provider value={showProposedLinksValue}>
      <AppLayout>
        <NavigationPanel>
          <UserPanel user={user} settings={true} showTier={true} />
          <div className="text-sm flex gap-1.5 items-center">
            <Link to="/workspaces/$workspaceId" params={{ workspaceId }}>
              <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
                <ArrowLeft className="w-3 h-3" />
              </div>
            </Link>
            <p className="truncate">{demoCase.title}</p>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50" />
            <input
              className="w-full rounded-lg border border-black/22 lg:border-black/15 bg-white/25 lg:bg-black/3 py-2.5 pl-8 pr-2 text-sm placeholder:text-black/65 text-black/75 outline-none transition focus:border-black/30 focus:bg-white/50 lg:focus:bg-white/75"
              placeholder="Search workspace"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
          </label>
          <ActiveWorkspaceMenu
            activeView={activeView}
            onSelectView={handleSelectView}
            counts={viewCounts}
            reviewCount={pendingProposalCount}
          />
        </NavigationPanel>

        <ContentShell>
          <div className="flex min-w-0 flex-col gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/15 pb-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-black/15 bg-white/75 px-2.5 py-1 text-xs text-black/65">
                    {demoCase.caseNumber}
                  </span>
                  {pendingProposalCount > 0 && (
                    <button
                      type="button"
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800 transition-colors hover:border-amber-300 hover:bg-amber-100"
                      onClick={() => handleSelectView("review")}
                    >
                      {pendingProposalCount} proposals need review
                    </button>
                  )}
                </div>
                <h1 className="truncate text-2xl font-semibold">
                  {demoCase.title}
                </h1>
                <p className="mt-1 text-sm text-black/70">
                  {demoCaseContext.jurisdictionOrCourt} ·{" "}
                  {recordPartyLabel("ours", clientRole)} side · Case id:{" "}
                  {caseId}
                </p>
              </div>
            </header>

            {globalSearch.trim().length > 0 ? (
              <GlobalSearchView
                query={globalSearch}
                records={globalSearchResults}
                graph={graph}
                onClearSearch={() => setGlobalSearch("")}
                onOpenRecord={openRecord}
              />
            ) : activeView === "overview" ? (
              <OverviewView
                graph={graph}
                onOpenRecord={openRecord}
                onSelectView={handleSelectView}
              />
            ) : activeView === "agent" ? (
              <AgentView graph={graph} onOpenRecord={openRecord} />
            ) : activeView === "review" ? (
              <ReviewView graph={graph} onOpenRecord={openRecord} />
            ) : activeView === "documents" ? (
              <DocumentsView graph={graph} onOpenRecord={openRecord} />
            ) : activeView === "people" ? (
              <PeopleView graph={graph} onOpenRecord={openRecord} />
            ) : activeView === "timeline" ? (
              <TimelineView
                graph={graph}
                panelSearch={panelSearch}
                setPanelSearch={setPanelSearch}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                onOpenRecord={openRecord}
              />
            ) : (
              <RecordsView
                activeView={activeView as RecordViewType}
                graph={graph}
                panelSearch={panelSearch}
                setPanelSearch={setPanelSearch}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                onOpenRecord={openRecord}
              />
            )}
          </div>
        </ContentShell>

        {/* Hosted outside ContentShell: a backdrop-blur ancestor would otherwise
          trap this fixed overlay's containing block. Mirrors AppModal. */}
        <RecordInspector
          stack={inspectorStack}
          graph={graph}
          onOpenRecord={openRecord}
          onBack={() => setInspectorStack((stack) => stack.slice(0, -1))}
          onClose={() => setInspectorStack([])}
        />
      </AppLayout>
    </ShowProposedLinksContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared badges & chips
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RecordDisplayStatus }) {
  // Accepted is the authoritative default — it wears no badge. Its absence,
  // alongside Proposed / Proposed Replacement / Pending Replacement, is the
  // signal. Only unsettled states are labeled.
  if (status === "ACCEPTED") return null;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${RECORD_DISPLAY_STATUS_CLASSES[status]}`}
    >
      {RECORD_DISPLAY_STATUS_LABELS[status]}
    </span>
  );
}

function SubstatusBadge({ record }: { record: TypedCaseRecord }) {
  if (!record.substatus) return null;
  const needsAttention = ATTENTION_SUBSTATUSES.includes(record.substatus);

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${
        needsAttention
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-black/15 bg-black/[0.03] text-black/70"
      }`}
    >
      {RECORD_SUBSTATUS_LABELS[record.substatus]}
    </span>
  );
}

function PartyBadge({ record }: { record: TypedCaseRecord }) {
  if (!record.party) return null;

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${RECORD_PARTY_CLASSES[record.party]}`}
    >
      {recordPartyLabel(record.party, clientRole)}
    </span>
  );
}

// Resolve a record to its display status — the lifecycle status, except a
// proposal that would replace an existing record reads as its own "Proposed
// Replacement" state (green badge, purple surface). The single source of truth
// for every status badge, card tint, and inspector wash, so links, cards, and
// the inspector never diverge.
function recordDisplayStatus(
  record: TypedCaseRecord,
  graph: WorkspaceGraph,
): RecordDisplayStatus {
  const status = graph.effectiveStatus(record);
  return status === "PROPOSED" && record.replacesIds?.length
    ? "PROPOSED_REPLACEMENT"
    : status;
}

// Clickable reference to another record — the core graph-traversal affordance.
// The chip stays neutral white; lifecycle is carried entirely by the colored
// status pill on the right, so a list of links reads as one calm column with
// the standing of each target legible at a glance. The left tag is the record
// type (gray, tight radius); the right pill is the lifecycle status (colored,
// full radius). When `isCycle` is set the target is already open higher in the
// inspector path, so the chip is grayed and flagged for a circular dependency.
function RecordChip({
  record,
  graph,
  onOpenRecord,
  isCycle = false,
  pairedReplacement = false,
  showPendingReplacement = false,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  isCycle?: boolean;
  // True only where the replaced counterpart is shown right alongside (the
  // "replaced by" pairing). On a lone chip a Proposed Replacement reads as a
  // plain blue "Proposed" link — without its counterpart the replacement
  // framing is just noise.
  pairedReplacement?: boolean;
  // True inside ReplacementNotice ("This proposal would replace:") —
  // the only context where "Pending Replacement" badge belongs on a link.
  showPendingReplacement?: boolean;
}) {
  let displayStatus = recordDisplayStatus(record, graph);
  if (displayStatus === "PROPOSED_REPLACEMENT" && !pairedReplacement) {
    displayStatus = "PROPOSED";
  }
  // Accepted links wear no pill (their calm absence reads as "settled").
  // Pending-replacement links are also pill-free in general link lists — the
  // amber badge belongs only inside "This proposal would replace:" where the
  // relationship is already framed by the container.
  // Cycle chips always show their "In path".
  const showPill =
    isCycle ||
    (displayStatus !== "ACCEPTED" &&
      (displayStatus !== "PENDING_REPLACEMENT" || showPendingReplacement));

  return (
    <button
      type="button"
      title={
        isCycle
          ? "Already open in this path — following it again would loop"
          : undefined
      }
      className={`group flex w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${
        isCycle
          ? "border-black/15 bg-black/[0.03] opacity-70 cursor-not-allowed"
          : "border-black/15 bg-white/80 hover:border-black/25 hover:bg-white"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenRecord(record.id);
      }}
      disabled={isCycle}
    >
      {/* Left tag: record type — tight radius, gray, reads as a category. */}
      <span className="shrink-0 rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
        {RECORD_TYPE_LABELS[record.type]}
      </span>
      <span
        className={`truncate ${
          isCycle ? "text-black/55" : "text-black/75 group-hover:text-black"
        }`}
      >
        {record.title}
      </span>
      {/* Right pill: lifecycle — full radius + color, matching StatusBadge.
          Accepted shows none; its absence is the "settled" signal. */}
      {isCycle ? (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-black/15 bg-black/[0.04] px-2 py-0.5 text-xs text-black/55">
          <Repeat className="h-3 w-3" />
          In path
        </span>
      ) : showPill ? (
        <span
          className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-xs ${RECORD_DISPLAY_STATUS_CLASSES[displayStatus]}`}
        >
          {RECORD_DISPLAY_STATUS_LABELS[displayStatus]}
        </span>
      ) : null}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 text-black/30 group-hover:text-black/70 ${
          showPill ? "" : "ml-auto"
        }`}
      />
    </button>
  );
}

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
                      replaced by
                    </span>
                    <RecordChip
                      record={replacement}
                      graph={graph}
                      onOpenRecord={onOpenRecord}
                      isCycle={visitedIds?.has(replacement.id)}
                      pairedReplacement
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

function ReplacementNotice({
  record,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  const targets = (record.replacesIds ?? [])
    .map((id) => graph.recordsById.get(id))
    .filter((target): target is TypedCaseRecord => Boolean(target));

  if (targets.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-900">
      <div className="flex items-center gap-1.5 font-medium">
        <GitBranch className="h-3.5 w-3.5" />
        <span>This proposed record would replace:</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {targets.map((target) => (
          <RecordChip
            key={target.id}
            record={target}
            graph={graph}
            onOpenRecord={onOpenRecord}
            isCycle={visitedIds?.has(target.id)}
            showPendingReplacement
          />
        ))}
      </div>
      <p className="mt-2 leading-5 text-green-900/80">
        Accepting it retires the records above and removes their chunks from
        retrieval.
      </p>
    </div>
  );
}

function PendingReplacementNotice({
  proposal,
  graph,
  onOpenRecord,
  visitedIds,
}: {
  proposal: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  visitedIds?: Set<string>;
}) {
  // The record this sits on is itself amber (pending replacement). The lock is
  // the blocking constraint, so the container reads red; the replacement chip
  // carries its own lifecycle pill (the proposal on its way in to replace this).
  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
      <div className="flex items-center gap-1.5 font-medium">
        <Lock className="h-3.5 w-3.5" />
        <span>Record locked while a replacement proposal is pending</span>
      </div>
      <div className="mt-2">
        <RecordChip
          record={proposal}
          graph={graph}
          onOpenRecord={onOpenRecord}
          isCycle={visitedIds?.has(proposal.id)}
          pairedReplacement
        />
      </div>
      <p className="mt-2 leading-5 text-red-900/80">
        Review the proposal before editing, deleting, or rewriting this record.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Record inspector modal (graph traversal)
// Hosted outside ContentShell and styled to match AppModal / EditUserModal:
// a centered card over a blur + tint backdrop, kept mounted so it can animate
// open and closed.
// ─────────────────────────────────────────────────────────────────────────────

function RecordInspector({
  stack,
  graph,
  onOpenRecord,
  onBack,
  onClose,
}: {
  stack: string[];
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const open = stack.length > 0;
  const recordId = stack[stack.length - 1];

  // Keep the last opened record on screen through the close animation,
  // mirroring AppModal's prevModal/visibleModal handling.
  const [displayRecordId, setDisplayRecordId] = useState<string | undefined>(
    recordId,
  );

  useEffect(() => {
    if (recordId) setDisplayRecordId(recordId);
  }, [recordId]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const record = displayRecordId
    ? graph.recordsById.get(displayRecordId)
    : undefined;

  return (
    <div
      className={`fixed inset-0 z-10000 flex items-start justify-center overflow-hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* blur layer */}
      <div
        className={`absolute inset-0 transition-[backdrop-filter] ${
          open
            ? "duration-200 ease-out backdrop-blur-xs"
            : "duration-300 ease-in backdrop-blur-0"
        }`}
      />

      {/* tint layer */}
      <div
        className={`absolute inset-0 bg-black/10 transition-opacity ${
          open
            ? "duration-200 ease-out opacity-100"
            : "duration-300 ease-in opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative top-12 z-20 flex h-max max-h-[calc(100vh-6rem)] w-2xl max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-black/22 bg-white/90 text-md shadow-md backdrop-blur-sm transition-all ${
          open
            ? "duration-100 ease-out scale-100 opacity-100 translate-0"
            : "duration-150 ease-in scale-95 opacity-0 translate-y-8"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-black/15 px-4 py-3">
          {stack.length > 1 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span className="text-sm text-black/55">Record inspector</span>
          )}
          {stack.length > 1 && (
            <span className="text-xs text-black/50">
              {stack.length} records deep
            </span>
          )}
          <button
            type="button"
            aria-label="Close record inspector"
            className="ml-auto rounded-lg p-1.5 text-black/65 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {record && (
          <RecordInspectorBody
            key={record.id}
            record={record}
            graph={graph}
            onOpenRecord={onOpenRecord}
            onClose={onClose}
            // Ancestors already open in this path — used to flag cycles.
            visitedIds={new Set(stack.slice(0, -1))}
          />
        )}
      </div>
    </div>
  );
}

function RecordInspectorBody({
  record,
  graph,
  onOpenRecord,
  onClose,
  visitedIds,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onClose: () => void;
  visitedIds: Set<string>;
}) {
  const status = graph.effectiveStatus(record);
  const displayStatus = recordDisplayStatus(record, graph);
  const sourceDocument =
    record.type === "DOCUMENT"
      ? demoDocuments.find((document) => document.id === record.documentId)
      : undefined;
  const siblingDocumentRecords =
    record.type === "DOCUMENT"
      ? graph.records.filter(
          (candidate) =>
            candidate.type === "DOCUMENT" &&
            candidate.documentId === record.documentId &&
            candidate.id !== record.id,
        )
      : [];
  const replacedBy = record.replacedById
    ? graph.recordsById.get(record.replacedById)
    : undefined;
  const pendingProposal = graph.pendingReplacementByTargetId.get(record.id);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-black/50">
          {RECORD_TYPE_LABELS[record.type]}
        </span>
        <StatusBadge status={displayStatus} />
        <SubstatusBadge record={record} />
        <PartyBadge record={record} />
      </div>

      <h2 className="font-serif text-xl leading-snug">{record.title}</h2>
      {record.summary && (
        <p className="mt-1 text-sm text-black/70">{record.summary}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/50">
        {record.category && <span>Category: {record.category}</span>}
        {record.supportStatus && (
          <span>Support: {SUPPORT_STATUS_LABELS[record.supportStatus]}</span>
        )}
        <span>Version {record.version}</span>
        <span>
          {record.createdBy === "agent" ? "Agent" : "Human"} ·{" "}
          {formatDate(record.createdAt)}
        </span>
        {record.approvedAt && (
          <span>Approved {formatDate(record.approvedAt)}</span>
        )}
      </div>

      {record.type === "PERSON" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {record.roles.map((role) => (
            <span
              key={role}
              className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70"
            >
              {role.replaceAll("_", " ").toLowerCase()}
            </span>
          ))}
          {record.organization && (
            <span className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs text-black/70">
              {record.organization}
            </span>
          )}
        </div>
      )}

      {record.type === "TIMELINE_EVENT" && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white/75 px-2.5 py-1.5 text-sm text-black/70">
          <CalendarDays className="h-4 w-4" />
          {formatDate(record.eventDate)}
        </p>
      )}

      {record.type === "DOCUMENT" && sourceDocument && (
        <div className="mt-3 rounded-lg border border-black/15 bg-white/75 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-black/70">
              {isImageDocument(sourceDocument) ? (
                <ImageIcon className="h-4 w-4 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{sourceDocument.fileName}</span>
            </div>
            <DocumentViewButton document={sourceDocument} />
          </div>
          <p className="mt-1 text-xs text-black/50">
            {documentScopeLabel(record, sourceDocument)} ·{" "}
            {sourceDocument.processingStatus}
          </p>
          {siblingDocumentRecords.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-black/65">
                Other records from this file ({siblingDocumentRecords.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {siblingDocumentRecords.map((sibling) => (
                  <RecordChip
                    key={sibling.id}
                    record={sibling}
                    graph={graph}
                    onOpenRecord={onOpenRecord}
                    isCycle={visitedIds.has(sibling.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-md leading-6 text-black/80">{record.content}</p>

      {/* Replacement state mirrors the case-record card so the inspector reads
          the same way: the amber "would replace" and red "locked, pending
          replacement" containers travel with the record into the drawer. */}
      {status === "PROPOSED" && record.replacesIds?.length && (
        <div className="mt-4">
          <ReplacementNotice
            record={record}
            graph={graph}
            onOpenRecord={onOpenRecord}
            visitedIds={visitedIds}
          />
        </div>
      )}

      {pendingProposal && (
        <div className="mt-4">
          <PendingReplacementNotice
            proposal={pendingProposal}
            graph={graph}
            onOpenRecord={onOpenRecord}
            visitedIds={visitedIds}
          />
        </div>
      )}

      {/* Provenance the notices above don't cover: what replaced a retired
          record, and (for already-settled records) what this one retired.
          A live proposal's "replaces" is shown by the amber notice instead. */}
      {(replacedBy ||
        (status !== "PROPOSED" && record.replacesIds?.length)) && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-black/65">
            <GitBranch className="h-3.5 w-3.5" />
            Version history
          </p>
          <div className="flex flex-col gap-1.5">
            {replacedBy && (
              <div>
                <p className="mb-1 text-xs text-black/55">Replaced by</p>
                <RecordChip
                  record={replacedBy}
                  graph={graph}
                  onOpenRecord={onOpenRecord}
                  isCycle={visitedIds.has(replacedBy.id)}
                />
              </div>
            )}
            {status !== "PROPOSED" &&
              (record.replacesIds ?? [])
                .map((id) => graph.recordsById.get(id))
                .filter((target): target is TypedCaseRecord => Boolean(target))
                .map((target) => (
                  <div key={target.id}>
                    <p className="mb-1 text-xs text-black/55">Replaces</p>
                    <RecordChip
                      record={target}
                      graph={graph}
                      onOpenRecord={onOpenRecord}
                      isCycle={visitedIds.has(target.id)}
                    />
                  </div>
                ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-xs text-black/65">Knowledge graph</p>
        <RecordLinksPanel
          record={record}
          graph={graph}
          onOpenRecord={onOpenRecord}
          visitedIds={visitedIds}
          allowProposedLinksToggle
        />
      </div>

      {status === "PROPOSED" && (
        <ProposalActions
          record={record}
          onDelete={(id) => {
            graph.deleteRecord(id);
            onClose();
          }}
          onDecision={graph.decideProposal}
        />
      )}

      {status === "ACCEPTED" && (
        <AcceptedRecordActions
          record={record}
          onPropose={graph.proposeRevision}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Record card (list views)
// ─────────────────────────────────────────────────────────────────────────────

function RecordCard({
  record,
  graph,
  onOpenRecord,
}: {
  record: TypedCaseRecord;
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = graph.effectiveStatus(record);
  // Display status splits PROPOSED into plain "Proposed" vs "Proposed
  // Replacement" (green badge, purple card); raw `status` still drives logic.
  const displayStatus = recordDisplayStatus(record, graph);
  const decision = graph.proposalDecisions[record.id];
  const pendingProposal = graph.pendingReplacementByTargetId.get(record.id);

  return (
    <article
      className={`rounded-xl border shadow-sm ${RECORD_DISPLAY_STATUS_CARD_CLASSES[displayStatus]}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="relative w-full cursor-pointer p-4 pr-12 text-left"
        onClick={() => setExpanded((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
      >
        {(status === "ACCEPTED" || status === "REJECTED") && (
          <div className="absolute right-3 top-3">
            <RecordSettingsMenu record={record} onDelete={graph.deleteRecord} />
          </div>
        )}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* The green "Proposed Replacement" status now carries the
                replaces signal on its own — no separate badge needed. */}
            <StatusBadge status={displayStatus} />
            <SubstatusBadge record={record} />
            {record.category && (
              <span className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs text-black/65">
                {record.category}
              </span>
            )}
            <PartyBadge record={record} />
          </div>
          <h3 className="text-md font-semibold">{record.title}</h3>
          {record.summary && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/70">
              {record.summary}
            </p>
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-lg p-1 text-black/55">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-black/15 px-4 pb-4 pt-3">
          {record.status === "PROPOSED" && !decision && (
            <ReplacementNotice
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          )}
          {pendingProposal && (
            <PendingReplacementNotice
              proposal={pendingProposal}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          )}
          <p className="text-md leading-6 text-black/75">{record.content}</p>
          <div className="mt-4">
            <RecordLinksPanel
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          </div>
          {status === "ACCEPTED" && (
            <AcceptedRecordActions
              record={record}
              onPropose={graph.proposeRevision}
            />
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
              onClick={() => onOpenRecord(record.id)}
            >
              Open in inspector
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {record.status === "PROPOSED" && !decision && (
            <ProposalActions
              record={record}
              onDelete={graph.deleteRecord}
              onDecision={graph.decideProposal}
            />
          )}
          {decision && <ProposalDecisionNote decision={decision} />}
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Proposal actions
// ─────────────────────────────────────────────────────────────────────────────

function ProposalActions({
  record,
  onDelete,
  onDecision,
}: {
  record: TypedCaseRecord;
  onDelete: (recordId: string) => void;
  onDecision: (recordId: string, decision: ProposalDecision) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestingEdits, setSuggestingEdits] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-black/15 bg-white/75 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-green-800 transition-colors hover:bg-green-100"
          onClick={() => onDecision(record.id, { status: "accepted" })}
          type="button"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-800 transition-colors hover:bg-red-100"
          onClick={() => setRejecting((value) => !value)}
          type="button"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/10"
          onClick={() => onDelete(record.id)}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/10"
          onClick={() => setSuggestingEdits((value) => !value)}
          title="Suggest edits with AI"
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest edits
        </button>
      </div>

      {rejecting && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <TextAreaField
            label="Reason for rejecting this proposal"
            placeholder="Example: unsupported by produced discovery, duplicates an accepted fact, or uses language that overstates the evidence."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-800 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-red-300"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                onDecision(record.id, {
                  status: "rejected",
                  reason: rejectionReason.trim(),
                })
              }
              type="button"
            >
              Save rejection
            </button>
          </div>
        </div>
      )}

      {suggestingEdits && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <TextAreaField
            label="Suggested edit for the agent"
            placeholder="Tell the agent what to preserve, soften, cite, split, or rewrite before you accept it."
            value={editSuggestion}
            onChange={(event) => {
              setEditSuggestion(event.target.value);
              setEditSubmitted(false);
            }}
            rows={3}
            minRows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {editSubmitted ? (
              <span className="text-sm text-blue-800">
                Edit suggestion queued for the agent.
              </span>
            ) : (
              <span className="text-sm text-blue-900/60">
                This keeps the proposal open for review.
              </span>
            )}
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-black/30"
              disabled={!editSuggestion.trim()}
              onClick={() => setEditSubmitted(true)}
              type="button"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Send suggestion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Action surface for accepted (authoritative) records: propose a revision. An
// accepted record can't be edited in place — instead the user drafts a new
// version that becomes a PROPOSED record replacing this one, routed through
// the normal review queue. This is the primary way humans turn an accepted
// record back into a proposal.
function AcceptedRecordActions({
  record,
  onPropose,
}: {
  record: TypedCaseRecord;
  onPropose: (recordId: string, draft: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(record.content);

  return (
    <div
      className="mt-3 rounded-lg border border-black/15 bg-white/75 p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-black/65">
          <GitBranch className="h-4 w-4" />
          <span>Propose a revision</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-black/70 transition-colors hover:bg-black/10"
          onClick={() => {
            setDraft(record.content);
            setOpen((value) => !value);
          }}
        >
          <PencilLine className="h-3.5 w-3.5" />
          {open ? "Cancel" : "Propose revision"}
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <TextAreaField
            label="Revised content"
            placeholder="Edit the content. Submitting creates a proposed record that would replace this one and sends it to the review queue."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            minRows={4}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-black/55">
              Goes to the review queue as a replacement proposal.
            </span>
            <Button
              style="secondary"
              text="Submit proposal"
              icon="sparkles"
              disabled={!draft.trim() || draft.trim() === record.content.trim()}
              onClick={() => {
                onPropose(record.id, draft);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalDecisionNote({ decision }: { decision: ProposalDecision }) {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
        decision.status === "accepted"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <p className="font-medium">
        Proposal {decision.status === "accepted" ? "accepted" : "rejected"}
      </p>
      {decision.reason && (
        <p className="mt-1 leading-5">Reason: {decision.reason}</p>
      )}
    </div>
  );
}

function RecordSettingsMenu({
  record,
  onDelete,
}: {
  record: TypedCaseRecord;
  onDelete: (recordId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuNote, setMenuNote] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const itemLabel =
    SINGULAR_VIEW_LABELS[RECORD_TYPE_VIEW[record.type]] ?? "record";
  const isReplaced = record.status === "REPLACED";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleMenuAction = (
    event: MouseEvent<HTMLButtonElement>,
    note: string,
  ) => {
    event.stopPropagation();
    setMenuNote(note);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="rounded-lg p-1.5 text-black/65 transition-colors hover:bg-black/15"
        title={`Open ${itemLabel} settings`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-20 min-w-52 rounded-xl border border-black/22 bg-white/90 p-1.5 text-sm shadow-md backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          {isReplaced ? (
            <p className="px-2.5 py-2 text-black/50">
              Replaced records are read-only.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-black/70 transition-colors hover:bg-black/10"
                onClick={(event) =>
                  handleMenuAction(
                    event,
                    `Edit mode queued for this ${itemLabel}.`,
                  )
                }
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit {itemLabel}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-black/70 transition-colors hover:bg-black/10"
                onClick={(event) =>
                  handleMenuAction(
                    event,
                    `Suggested edits queued for this ${itemLabel}.`,
                  )
                }
              >
                <Sparkles className="h-3.5 w-3.5" />
                Suggest edits
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-red-700 transition-colors hover:bg-black/10"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(record.id);
                  setOpen(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {itemLabel}
              </button>
            </>
          )}
          {menuNote && !isReplaced && (
            <p className="mt-1 border-t border-black/15 px-2.5 py-2 text-xs leading-4 text-black/50">
              {menuNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search & filters
// ─────────────────────────────────────────────────────────────────────────────

function WorkPanelSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
      <input
        className="w-full rounded-lg border border-black/15 bg-white/65 py-2.5 pl-9 pr-3 text-md text-black/75 outline-none transition focus:border-black/30 focus:bg-white"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const FILTERABLE_STATUSES: RecordStatus[] = [
  "ACCEPTED",
  "PROPOSED",
  "REJECTED",
  "PENDING_REPLACEMENT",
  "REPLACED",
];

// Default view hides replaced records so the lists show only live work; the
// reset control returns to exactly this set.
const DEFAULT_VISIBLE_STATUSES: RecordStatus[] = FILTERABLE_STATUSES.filter(
  (status) => status !== "REPLACED",
);

function StatusFilter({
  selectedStatuses,
  onSelectStatuses,
}: {
  selectedStatuses: RecordStatus[];
  onSelectStatuses: (statuses: RecordStatus[]) => void;
}) {
  const toggleStatus = (status: RecordStatus) => {
    onSelectStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selected) => selected !== status)
        : [...selectedStatuses, status],
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Filter className="h-4 w-4 text-black/50" />
      <button
        type="button"
        title="Reset filters (hide replaced)"
        aria-label="Reset status filters"
        className="inline-flex items-center justify-center rounded-full border p-1.5 transition-colors border-black/15 bg-white/70 text-black/50 hover:bg-black/5 hover:text-black/50"
        onClick={() => onSelectStatuses(DEFAULT_VISIBLE_STATUSES)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      {FILTERABLE_STATUSES.map((status) => {
        const selected = selectedStatuses.includes(status);

        return (
          <button
            key={status}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              selected
                ? "border-black/30 bg-black/10"
                : "border-black/15 bg-white/70 hover:bg-black/5"
            }`}
            onClick={() => toggleStatus(status)}
            type="button"
          >
            {RECORD_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────────────────────────────────────

function GlobalSearchView({
  query,
  records,
  graph,
  onClearSearch,
  onOpenRecord,
}: {
  query: string;
  records: TypedCaseRecord[];
  graph: WorkspaceGraph;
  onClearSearch: () => void;
  onOpenRecord: (recordId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">Workspace Search</h2>
          <p className="mt-1 text-sm text-black/70">
            Searching all case records for "{query.trim()}".
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-black/15 bg-white/75 px-3 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
          onClick={onClearSearch}
        >
          Clear search
        </button>
      </div>

      <div className="grid gap-3">
        {records.length === 0 ? (
          <EmptyState message="No case records match this workspace search." />
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-black/50">
                <span className="rounded-full border border-black/15 bg-white/75 px-2 py-0.5">
                  {RECORD_TYPE_LABELS[record.type]}
                </span>
                <span>{formatDate(record.updatedAt)}</span>
              </div>
              <RecordCard
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/25 bg-white/50 p-8 text-center text-md text-black/65">
      {message}
    </div>
  );
}

function OverviewView({
  graph,
  onOpenRecord,
  onSelectView,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
  onSelectView: (view: WorkspaceViewType) => void;
}) {
  const highPriorityRecords = graph.records.filter(
    (record) =>
      record.priority === "high" &&
      graph.effectiveStatus(record) === "ACCEPTED",
  );
  const attentionRecords = graph.records.filter(
    (record) =>
      record.substatus &&
      ATTENTION_SUBSTATUSES.includes(record.substatus) &&
      graph.effectiveStatus(record) !== "REPLACED" &&
      graph.effectiveStatus(record) !== "REJECTED",
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg">Strategic Snapshot</h2>
              <p className="mt-1 text-sm text-black/70">
                {demoCaseContext.currentPosture}
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-green-700" />
          </div>
          <p className="text-md leading-6 text-black/75">
            {demoCaseContext.objectives.ours}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Metric label="Case health" value={`${demoCase.health}%`} />
            <Metric
              label="Trial readiness"
              value={`${demoCase.trialReadiness}%`}
            />
            <Metric
              label="Pending proposals"
              value={String(graph.proposedRecords.length)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-amber-700" />
              <h2 className="font-serif text-lg">Main Risk</h2>
            </div>
            <p className="mt-2 text-md leading-6 text-black/75">
              {demoCaseContext.objectives.biggestCurrentRisk}
            </p>
          </div>
          <div className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-black/65" />
              <h2 className="font-serif text-lg">Their Objective</h2>
            </div>
            <p className="mt-2 text-md leading-6 text-black/75">
              {demoCaseContext.objectives.theirs}
            </p>
          </div>
        </div>

        {attentionRecords.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg">Needs Attention</h2>
              <button
                type="button"
                className="rounded-lg border border-amber-200 bg-white/80 px-3 py-1.5 text-sm text-amber-800 transition-colors hover:bg-amber-100"
                onClick={() => onSelectView("review")}
              >
                Open review queue
              </button>
            </div>
            <p className="mt-1 text-sm text-black/65">
              Records flagged for source review, missing support, date
              conflicts, or pending replacement.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {attentionRecords.slice(0, 6).map((record) => (
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

        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <h2 className="font-serif text-lg">High-Priority Work</h2>
          <div className="mt-3 flex flex-col gap-1.5">
            {highPriorityRecords.map((record) => (
              <RecordChip
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/15 bg-white/65 p-4">
          <h2 className="font-serif text-lg">Workspace Activity</h2>
          <div className="mt-3 flex flex-col gap-2">
            {demoActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-black/15 bg-white/75 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-black/65">
                  <span>{item.actor}</span>
                  <span>{item.time}</span>
                </div>
                <p className="mt-1.5 text-sm leading-5 text-black/75">
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ReviewView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const replacementProposals = graph.proposedRecords.filter(
    (record) => record.replacesIds?.length,
  );
  const newProposals = graph.proposedRecords.filter(
    (record) => !record.replacesIds?.length,
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS.review}</h2>
        <p className="mt-1 text-sm text-black/70">{VIEW_DESCRIPTIONS.review}</p>
      </div>

      {graph.proposedRecords.length === 0 && (
        <EmptyState message="No pending proposals need review." />
      )}

      {replacementProposals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <GitBranch className="h-4 w-4" />
            Replacement Proposals ({replacementProposals.length})
          </h3>
          <div className="grid gap-3">
            {replacementProposals.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </section>
      )}

      {newProposals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black/65">
            <Sparkles className="h-4 w-4" />
            New proposals ({newProposals.length})
          </h3>
          <div className="grid gap-3">
            {newProposals.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RecordsView({
  activeView,
  graph,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  onOpenRecord,
}: {
  activeView: RecordViewType;
  graph: WorkspaceGraph;
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: RecordStatus[];
  setSelectedStatuses: (statuses: RecordStatus[]) => void;
  onOpenRecord: (recordId: string) => void;
}) {
  const recordType = VIEW_RECORD_TYPE[activeView];
  const singular = SINGULAR_VIEW_LABELS[activeView] ?? "record";

  const filteredRecords = graph.records.filter((record) => {
    if (record.type !== recordType) return false;
    const status = graph.effectiveStatus(record);
    const matchesStatus = selectedStatuses.includes(status);
    return matchesStatus && recordMatchesSearch(record, panelSearch);
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS[activeView]}</h2>
        <p className="mt-1 text-sm text-black/70">
          {VIEW_DESCRIPTIONS[activeView]}
        </p>
      </div>

      {activeView !== "notes" && (
        <div className="flex justify-end">
          <Button style="secondary" text={`Create ${singular}`} icon="plus" />
        </div>
      )}

      <WorkPanelSearch
        value={panelSearch}
        onChange={setPanelSearch}
        placeholder={`Search ${VIEW_LABELS[activeView].toLowerCase()}`}
      />

      <StatusFilter
        selectedStatuses={selectedStatuses}
        onSelectStatuses={setSelectedStatuses}
      />

      {activeView === "notes" && (
        <CaseNoteComposer onCreateCaseNote={graph.createNote} />
      )}

      <div className="grid gap-3">
        {filteredRecords.length === 0 ? (
          <EmptyState
            message={`No ${VIEW_LABELS[activeView].toLowerCase()} match the current filters.`}
          />
        ) : (
          filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              graph={graph}
              onOpenRecord={onOpenRecord}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TimelineView({
  graph,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: RecordStatus[];
  setSelectedStatuses: (statuses: RecordStatus[]) => void;
  onOpenRecord: (recordId: string) => void;
}) {
  const events = graph.records
    .filter((record): record is TimelineEventRecord => {
      if (record.type !== "TIMELINE_EVENT") return false;
      const status = graph.effectiveStatus(record);
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(status);
      return matchesStatus && recordMatchesSearch(record, panelSearch);
    })
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-serif text-lg">{VIEW_LABELS.timeline}</h2>
        <p className="mt-1 text-sm text-black/70">
          {VIEW_DESCRIPTIONS.timeline}
        </p>
      </div>

      <div className="flex justify-end">
        <Button style="secondary" text="Create timeline event" icon="plus" />
      </div>

      <WorkPanelSearch
        value={panelSearch}
        onChange={setPanelSearch}
        placeholder="Search timeline events"
      />

      <StatusFilter
        selectedStatuses={selectedStatuses}
        onSelectStatuses={setSelectedStatuses}
      />

      <div className="relative flex flex-col gap-2 pl-5">
        <div className="absolute left-[.55rem] top-2 bottom-2 w-px bg-black/20" />
        {events.length === 0 ? (
          <EmptyState message="No timeline events match the current filters." />
        ) : (
          events.map((record) => (
            <article key={record.id} className="relative">
              <div className="absolute -left-[1.05rem] top-5 h-2.5 w-2.5 rounded-full border border-white bg-black/45" />
              <div className="mb-1 flex items-center gap-1.5 pl-1 text-xs text-black/65">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(record.eventDate)}
              </div>
              <RecordCard
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function DocumentsView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const documentRecordsByDocumentId = useMemo(() => {
    const map = new Map<string, TypedCaseRecord[]>();
    for (const record of graph.records) {
      if (record.type !== "DOCUMENT") continue;
      map.set(record.documentId, [
        ...(map.get(record.documentId) ?? []),
        record,
      ]);
    }
    return map;
  }, [graph.records]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">{VIEW_LABELS.documents}</h2>
          <p className="mt-1 text-sm text-black/70">
            {VIEW_DESCRIPTIONS.documents}
          </p>
        </div>
        <Button text="Upload document" icon="upload" />
      </div>
      <div className="grid gap-3">
        {demoDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            documentRecords={documentRecordsByDocumentId.get(document.id) ?? []}
            graph={graph}
            onOpenRecord={onOpenRecord}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  documentRecords,
  graph,
  onOpenRecord,
}: {
  document: CaseDocument;
  documentRecords: TypedCaseRecord[];
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-black/15 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isImageDocument(document) ? (
            <ImageIcon className="h-5 w-5 shrink-0 text-black/65" />
          ) : (
            <FileText className="h-5 w-5 shrink-0 text-black/65" />
          )}
          <h3 className="truncate text-md font-semibold">
            {document.fileName}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70">
            {document.processingStatus}
          </span>
          <DocumentViewButton document={document} />
        </div>
      </div>
      <p className="mt-1 text-sm text-black/65">
        <span className="capitalize">
          {document.category.replaceAll("_", " ")}
        </span>
        {document.pageCount ? ` · ${document.pageCount} pages` : ""} · Uploaded{" "}
        {formatDate(document.createdAt)}
      </p>
      {document.description && (
        <p className="mt-3 text-md leading-6 text-black/75">
          {document.description}
        </p>
      )}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-black/65">
          Document records extracted from this file ({documentRecords.length})
        </p>
        {documentRecords.length === 0 ? (
          <p className="text-sm text-black/50">
            No document records yet — processing will propose them.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {documentRecords.map((record) => (
              <RecordChip
                key={record.id}
                record={record}
                graph={graph}
                onOpenRecord={onOpenRecord}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function PeopleView({
  graph,
  onOpenRecord,
}: {
  graph: WorkspaceGraph;
  onOpenRecord: (recordId: string) => void;
}) {
  const people = graph.records.filter((record) => record.type === "PERSON");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg">{VIEW_LABELS.people}</h2>
          <p className="mt-1 text-sm text-black/70">
            {VIEW_DESCRIPTIONS.people}
          </p>
        </div>
        <Button style="secondary" text="Add person" icon="userPlus" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((person) => {
          if (person.type !== "PERSON") return null;
          const involvedIn = (graph.inboundLinks.get(person.id) ?? []).filter(
            (link) => link.type === "INVOLVES",
          );

          return (
            <article
              key={person.id}
              className="rounded-xl border border-black/15 bg-white/70 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-md font-semibold">{person.name}</h3>
                <StatusBadge status={recordDisplayStatus(person, graph)} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {person.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-black/15 bg-white/80 px-2 py-0.5 text-xs capitalize text-black/70"
                  >
                    {role.replaceAll("_", " ").toLowerCase()}
                  </span>
                ))}
                {person.organization && (
                  <span className="rounded-full border border-black/15 bg-black/[0.03] px-2 py-0.5 text-xs text-black/70">
                    {person.organization}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-5 text-black/70">
                {person.content}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-black/50">
                  Involved in {involvedIn.length} record
                  {involvedIn.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
                  onClick={() => onOpenRecord(person.id)}
                >
                  Open
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Case agent view
// ─────────────────────────────────────────────────────────────────────────────

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
        <button
          type="button"
          className="rounded-lg border border-black/15 bg-white/75 px-3 py-1.5 text-sm text-black/65 transition-colors hover:bg-black/10"
          onClick={() => setShowInstructions((value) => !value)}
        >
          {showInstructions ? "Hide instructions" : "Agent instructions"}
        </button>
      </div>

      {showInstructions && (
        <section className="rounded-xl border border-black/15 bg-black/[0.03] p-4">
          <h3 className="text-sm font-medium text-black/70">
            Standing instructions
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {[...demoAgentInstructions, ...proposedInstructions].map(
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
        {demoAgentThread.map((message) => (
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

// ─────────────────────────────────────────────────────────────────────────────
// Small bits
// ─────────────────────────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/15 bg-white/75 p-3">
      <p className="text-xs text-black/65">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
