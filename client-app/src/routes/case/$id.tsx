import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  FileText,
  Filter,
  GitBranch,
  Link2,
  MessageSquare,
  PencilLine,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import WorkPanelLayout from "#/components/layouts/WorkPanelLayout";
import WorkspaceMenu from "#/components/menus/WorkspaceMenu";
import UserPanel from "#/components/UserPanel";
import LoadingSpinner from "#/components/LoadingSpinner";
import Button from "#/components/Button";
import { requireAuth } from "#/lib/auth";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import type { ViewTypes } from "#/types/caseWorkspace";
import {
  demoActivity,
  demoCase,
  demoDocuments,
  demoRecords,
  demoUserId,
  type DemoRecord,
  type DemoRecordParty,
  type DemoRecordStatus,
} from "#/lib/caseWorkspaceDemo";

export const Route = createFileRoute("/case/$id")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

type ProposalDecision = {
  status: "accepted" | "rejected";
  reason?: string;
  suggestedEdit?: string;
};

type SelectedRecordStatuses = DemoRecordStatus[];

const statusClassName: Record<DemoRecordStatus, string> = {
  accepted: "border-green-200 bg-green-50 text-green-800",
  proposed: "border-blue-200 bg-blue-50 text-blue-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  supersession_pending: "border-amber-200 bg-amber-50 text-amber-800",
  superseded: "border-black/10 bg-black/5 text-black/55",
};

const statusLabels: Record<DemoRecordStatus, string> = {
  accepted: "Accepted",
  proposed: "Proposed",
  rejected: "Rejected",
  supersession_pending: "Supersession pending",
  superseded: "Superseded",
};

const partyClassName: Record<DemoRecordParty, string> = {
  plaintiff: "border-rose-200 bg-rose-50 text-rose-800",
  defense: "border-sky-200 bg-sky-50 text-sky-800",
};

const partyLabels: Record<DemoRecordParty, string> = {
  plaintiff: "Plaintiff",
  defense: "Defense",
};

const viewLabels: Record<ViewTypes, string> = {
  agent_config: "Case Agent",
  case_summary: "Case Summary",
  arguments: "Arguments",
  case_notes: "Case Notes",
  facts: "Facts",
  issues: "Issues",
  legal_precedent: "Legal Precedent",
  objectives: "Objectives",
  posture: "Posture",
  tasks: "Tasks",
  testimony: "Testimony",
  timeline: "Timeline",
  documents_index: "Documents",
};

const singularViewLabels: Partial<Record<ViewTypes, string>> = {
  arguments: "argument",
  case_notes: "case note",
  facts: "fact",
  issues: "issue",
  legal_precedent: "precedent",
  objectives: "objective",
  posture: "posture update",
  tasks: "task",
  testimony: "testimony note",
  timeline: "timeline event",
};

const createLabels: Partial<Record<ViewTypes, string>> = {
  arguments: "Create argument",
  case_notes: "Create case note",
  facts: "Create fact",
  issues: "Create issue",
  legal_precedent: "Create precedent",
  objectives: "Create objective",
  posture: "Create posture update",
  tasks: "Create task",
  testimony: "Create testimony note",
  timeline: "Create timeline event",
};

const viewDescriptions: Partial<Record<ViewTypes, string>> = {
  arguments:
    "Organize claims, defenses, counterarguments, and trial theories with source support.",
  case_notes:
    "Capture working thoughts, questions, hearing notes, and strategy observations.",
  facts:
    "Track factual assertions, disputed points, source support, and proof gaps.",
  issues:
    "Frame the legal, factual, procedural, and strategic questions driving the case.",
  legal_precedent:
    "Manage authorities, cite-check status, jurisdiction, and relevance to active issues.",
  objectives:
    "Keep desired outcomes, priorities, settlement posture, and risk-aware goals visible.",
  posture:
    "Summarize where the case stands procedurally and what that means for next work.",
  tasks:
    "Turn case strategy into accountable work items, blockers, and preparation steps.",
  testimony:
    "Shape witness modules, anticipated testimony, impeachment points, and examination themes.",
};

const routeFallbackUser = {
  id: demoUserId,
  email: "matthew.sweeney001@gmail.com",
  billingEmail: "matthew.sweeney001@gmail.com",
  displayName: "Matthew Sweeney",
  firstName: "Matthew",
  lastName: "Sweeney",
  hasHadActiveSubscription: true,
  profilePicture:
    "https://lh3.googleusercontent.com/a/ACg8ocJr13lEuSBUqIM5uAnNndbPe1lqOqszPECLE74iG_PafQE-Y-GZ=s96-c",
  updatedAt: new Date().toISOString(),
  userName: null,
  accountTier: "PRO" as const,
  accountStatus: "ACTIVE" as const,
  subscriptionStatus: "ACTIVE" as const,
};

function recordMatchesSearch(record: DemoRecord, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    viewLabels[record.type],
    record.title,
    record.miniDescription,
    record.content,
    record.category,
    record.typeStatus,
    record.party ? partyLabels[record.party] : "",
    record.createdBy,
    record.updatedAt,
    record.date ?? "",
    record.priority ?? "",
    record.sources.join(" "),
    record.linkedRecords.join(" "),
    record.supersedes?.title ?? "",
    record.supersedes?.summary ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function RouteComponent() {
  const { id } = Route.useParams();
  const [activeView, setActiveView] = useState<ViewTypes>("case_summary");
  const [selectedStatuses, setSelectedStatuses] =
    useState<SelectedRecordStatuses>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [panelSearch, setPanelSearch] = useState("");
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [proposalDecisions, setProposalDecisions] = useState<
    Record<string, ProposalDecision>
  >({});
  const [caseNotes, setCaseNotes] = useState<DemoRecord[]>([]);
  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>([]);

  const { data: userResult, isPending } = useCurrentUserQuery();
  const user = userResult?.currentUser.user ?? routeFallbackUser;
  const workspaceRecords = useMemo(
    () =>
      [...caseNotes, ...demoRecords].filter(
        (record) => !deletedRecordIds.includes(record.id),
      ),
    [caseNotes, deletedRecordIds],
  );

  const filteredRecords = useMemo(() => {
    return workspaceRecords.filter((record) => {
      const effectiveStatus =
        proposalDecisions[record.id]?.status ?? record.status;
      const matchesView = record.type === activeView;
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(effectiveStatus);
      const matchesSearch = recordMatchesSearch(record, panelSearch);

      return matchesView && matchesStatus && matchesSearch;
    });
  }, [
    activeView,
    panelSearch,
    proposalDecisions,
    selectedStatuses,
    workspaceRecords,
  ]);

  const globalSearchResults = useMemo(
    () =>
      globalSearch.trim().length === 0
        ? []
        : workspaceRecords.filter((record) =>
            recordMatchesSearch(record, globalSearch),
          ),
    [globalSearch, workspaceRecords],
  );

  const handleSelectView = (view: ViewTypes) => {
    setActiveView(view);
    setPanelSearch("");
    setShowProposalReview(false);
  };

  const proposedCount = workspaceRecords.filter(
    (record) => record.status === "proposed" && !proposalDecisions[record.id],
  ).length;

  const proposedRecords = useMemo(
    () =>
      workspaceRecords.filter(
        (record) =>
          record.status === "proposed" && !proposalDecisions[record.id],
      ),
    [proposalDecisions, workspaceRecords],
  );

  const pendingSupersessionByTargetId = useMemo(() => {
    return proposedRecords.reduce<Record<string, DemoRecord>>(
      (nextMap, proposal) => {
        if (proposal.supersedes) {
          nextMap[proposal.supersedes.id] = proposal;
        }

        return nextMap;
      },
      {},
    );
  }, [proposedRecords]);

  const viewCounts = useMemo(() => {
    const counts = workspaceRecords.reduce<Partial<Record<ViewTypes, number>>>(
      (nextCounts, record) => {
        nextCounts[record.type] = (nextCounts[record.type] ?? 0) + 1;
        return nextCounts;
      },
      {},
    );

    counts.documents_index = demoDocuments.length;
    counts.case_summary = 1;
    counts.agent_config = 1;

    return counts;
  }, [workspaceRecords]);

  const handleCreateCaseNote = (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setCaseNotes((notes) => [
      {
        id: `note-local-${Date.now()}`,
        type: "case_notes",
        title: trimmedContent.split("\n")[0].slice(0, 72),
        miniDescription: "New working case note captured in the workspace.",
        content: trimmedContent,
        category: "Case note",
        status: "accepted",
        typeStatus: "Pinned note",
        createdBy: "Human",
        updatedAt: "Just now",
        sources: [],
        linkedRecords: [],
      },
      ...notes,
    ]);
  };

  const handleDeleteRecord = (recordId: string) => {
    setDeletedRecordIds((ids) =>
      ids.includes(recordId) ? ids : [...ids, recordId],
    );
    setProposalDecisions((decisions) => {
      const nextDecisions = { ...decisions };
      delete nextDecisions[recordId];
      return nextDecisions;
    });
  };

  const handleProposalDecision = (
    recordId: string,
    decision: ProposalDecision,
  ) => {
    setProposalDecisions((decisions) => ({
      ...decisions,
      [recordId]: decision,
    }));
  };

  if (isPending && !userResult) {
    return (
      <div className="w-full h-dvh flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user} settings={true} showTier={true} />
        <div className="text-xs flex gap-1.5 items-center">
          <Link to="/">
            <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
              <ArrowLeft className="w-3 h-3" />
            </div>
          </Link>
          <p className="truncate">{demoCase.title}</p>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50" />
          <input
            className="w-full rounded-lg border border-black/15 lg:border-black/10 bg-white/25 lg:bg-black/3 py-2.5 pl-8 pr-2 text-xs placeholder:text-black/55 text-black/75 outline-none transition focus:border-black/30 focus:bg-white/50 lg:focus:bg-white/70"
            placeholder="Search workspace"
            value={globalSearch}
            onChange={(event) => {
              setGlobalSearch(event.target.value);
              setShowProposalReview(false);
            }}
          />
        </label>
        <WorkspaceMenu
          activeView={activeView}
          onSelectView={handleSelectView}
          counts={viewCounts}
        />
      </LeftPanelLayout>

      <WorkPanelLayout>
        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] text-black/65">
                  {demoCase.caseNumber}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] text-red-800 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-900"
                  onClick={() => {
                    setGlobalSearch("");
                    setPanelSearch("");
                    setShowProposalReview(true);
                  }}
                >
                  {proposedCount} proposals need review
                </button>
              </div>
              <h1 className="truncate text-xl font-semibold">
                {demoCase.title}
              </h1>
              <p className="mt-1 text-xs text-black/60">
                {demoCase.court} · Workspace id: {id}
              </p>
            </div>
          </header>

          {showProposalReview ? (
            <ProposalReviewView
              records={proposedRecords}
              proposalDecisions={proposalDecisions}
              pendingSupersessionByTargetId={pendingSupersessionByTargetId}
              onClearReview={() => setShowProposalReview(false)}
              onProposalDecision={handleProposalDecision}
              onDeleteRecord={handleDeleteRecord}
            />
          ) : globalSearch.trim().length > 0 ? (
            <GlobalSearchView
              query={globalSearch}
              records={globalSearchResults}
              proposalDecisions={proposalDecisions}
              pendingSupersessionByTargetId={pendingSupersessionByTargetId}
              onClearSearch={() => setGlobalSearch("")}
              onProposalDecision={handleProposalDecision}
              onDeleteRecord={handleDeleteRecord}
            />
          ) : activeView === "case_summary" ? (
            <CaseSummaryView records={workspaceRecords} />
          ) : null}
          {!showProposalReview &&
            globalSearch.trim().length === 0 &&
            activeView === "agent_config" && <AgentConfigView />}
          {!showProposalReview &&
            globalSearch.trim().length === 0 &&
            activeView === "documents_index" && <DocumentsView />}
          {!showProposalReview &&
            globalSearch.trim().length === 0 &&
            activeView === "timeline" && (
              <TimelineView
                records={filteredRecords}
                panelSearch={panelSearch}
                setPanelSearch={setPanelSearch}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                proposalDecisions={proposalDecisions}
                pendingSupersessionByTargetId={pendingSupersessionByTargetId}
                onProposalDecision={handleProposalDecision}
                onDeleteRecord={handleDeleteRecord}
              />
            )}
          {!showProposalReview &&
            globalSearch.trim().length === 0 &&
            !["case_summary", "agent_config", "documents_index"].includes(
              activeView,
            ) &&
            activeView !== "timeline" && (
              <RecordsView
                activeView={activeView}
                filteredRecords={filteredRecords}
                panelSearch={panelSearch}
                setPanelSearch={setPanelSearch}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                proposalDecisions={proposalDecisions}
                pendingSupersessionByTargetId={pendingSupersessionByTargetId}
                onProposalDecision={handleProposalDecision}
                onCreateCaseNote={handleCreateCaseNote}
                onDeleteRecord={handleDeleteRecord}
              />
            )}
        </div>
      </WorkPanelLayout>
    </AppLayout>
  );
}

function CaseSummaryView({ records }: { records: DemoRecord[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/10 bg-white/55 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-base">Strategic Snapshot</h2>
              <p className="mt-1 text-xs text-black/60">{demoCase.posture}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-green-700" />
          </div>
          <p className="text-sm leading-6 text-black/75">
            {demoCase.objective}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Metric label="Case health" value={`${demoCase.health}%`} />
            <Metric
              label="Trial readiness"
              value={`${demoCase.trialReadiness}%`}
            />
            <Metric label="Open gaps" value={String(demoCase.unresolvedGaps)} />
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/55 p-4">
          <h2 className="font-serif text-base">High-Value Work Queue</h2>
          <div className="mt-3 grid gap-2">
            {records
              .filter((record) => record.priority === "High")
              .map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-amber-700" />
            <h2 className="font-serif text-base">Main Risk</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-black/75">
            {demoCase.risk}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/55 p-4">
          <h2 className="font-serif text-base">Workspace Activity</h2>
          <div className="mt-3 flex flex-col gap-2">
            {demoActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-black/10 bg-white/70 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-black/55">
                  <span>{item.actor}</span>
                  <span>{item.time}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-black/75">
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
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
      <input
        className="w-full rounded-lg border border-black/10 bg-white/65 py-2.5 pl-9 pr-3 text-sm text-black/75 outline-none transition focus:border-black/30 focus:bg-white"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function GlobalSearchView({
  query,
  records,
  proposalDecisions,
  pendingSupersessionByTargetId,
  onClearSearch,
  onProposalDecision,
  onDeleteRecord,
}: {
  query: string;
  records: DemoRecord[];
  proposalDecisions: Record<string, ProposalDecision>;
  pendingSupersessionByTargetId: Record<string, DemoRecord>;
  onClearSearch: () => void;
  onProposalDecision: (recordId: string, decision: ProposalDecision) => void;
  onDeleteRecord: (recordId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-base">Workspace Search</h2>
          <p className="mt-1 text-xs text-black/60">
            Searching all case records for "{query.trim()}".
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-black/65 transition-colors hover:bg-black/10"
          onClick={onClearSearch}
        >
          Clear search
        </button>
      </div>

      <div className="grid gap-3">
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/40 p-8 text-center text-sm text-black/55">
            No case records match this workspace search.
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] text-black/50">
                <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5">
                  {viewLabels[record.type]}
                </span>
                <span>{record.updatedAt}</span>
              </div>
              <RecordCard
                record={record}
                decision={proposalDecisions[record.id]}
                pendingSupersessionProposal={
                  pendingSupersessionByTargetId[record.id]
                }
                onDelete={onDeleteRecord}
                onProposalDecision={onProposalDecision}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProposalReviewView({
  records,
  proposalDecisions,
  pendingSupersessionByTargetId,
  onClearReview,
  onProposalDecision,
  onDeleteRecord,
}: {
  records: DemoRecord[];
  proposalDecisions: Record<string, ProposalDecision>;
  pendingSupersessionByTargetId: Record<string, DemoRecord>;
  onClearReview: () => void;
  onProposalDecision: (recordId: string, decision: ProposalDecision) => void;
  onDeleteRecord: (recordId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-base">Proposal Review</h2>
          <p className="mt-1 text-xs text-black/60">
            All pending proposed records across the case workspace.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-black/65 transition-colors hover:bg-black/10"
          onClick={onClearReview}
        >
          Close review
        </button>
      </div>

      <div className="grid gap-3">
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/40 p-8 text-center text-sm text-black/55">
            No pending proposals need review.
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] text-black/50">
                <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5">
                  {viewLabels[record.type]}
                </span>
                <span>{record.updatedAt}</span>
              </div>
              <RecordCard
                record={record}
                decision={proposalDecisions[record.id]}
                pendingSupersessionProposal={
                  pendingSupersessionByTargetId[record.id]
                }
                onDelete={onDeleteRecord}
                onProposalDecision={onProposalDecision}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecordsView({
  activeView,
  filteredRecords,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  proposalDecisions,
  pendingSupersessionByTargetId,
  onProposalDecision,
  onCreateCaseNote,
  onDeleteRecord,
}: {
  activeView: ViewTypes;
  filteredRecords: DemoRecord[];
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: SelectedRecordStatuses;
  setSelectedStatuses: (statuses: SelectedRecordStatuses) => void;
  proposalDecisions: Record<string, ProposalDecision>;
  pendingSupersessionByTargetId: Record<string, DemoRecord>;
  onProposalDecision: (recordId: string, decision: ProposalDecision) => void;
  onCreateCaseNote: (content: string) => void;
  onDeleteRecord: (recordId: string) => void;
}) {
  const createLabel = createLabels[activeView];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div>
          <h2 className="font-serif text-base">{viewLabels[activeView]}</h2>
          <p className="mt-1 text-xs text-black/60">
            {viewDescriptions[activeView]}
          </p>
        </div>
      </div>

      {activeView !== "case_notes" && createLabel && (
        <div className="flex justify-end">
          <Button style="secondary" text={createLabel} icon="plus" />
        </div>
      )}

      <WorkPanelSearch
        value={panelSearch}
        onChange={setPanelSearch}
        placeholder={`Search ${viewLabels[activeView].toLowerCase()}`}
      />

      <StatusFilter
        selectedStatuses={selectedStatuses}
        onSelectStatuses={setSelectedStatuses}
      />

      {activeView === "case_notes" && (
        <CaseNoteComposer onCreateCaseNote={onCreateCaseNote} />
      )}

      <div className="grid gap-3">
        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/40 p-8 text-center text-sm text-black/55">
            No {viewLabels[activeView].toLowerCase()} match the current filters.
          </div>
        ) : (
          filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              decision={proposalDecisions[record.id]}
              pendingSupersessionProposal={
                pendingSupersessionByTargetId[record.id]
              }
              onDelete={onDeleteRecord}
              onProposalDecision={onProposalDecision}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatusFilter({
  selectedStatuses,
  onSelectStatuses,
}: {
  selectedStatuses: SelectedRecordStatuses;
  onSelectStatuses: (statuses: SelectedRecordStatuses) => void;
}) {
  const toggleStatus = (status: "all" | DemoRecordStatus) => {
    if (status === "all") {
      onSelectStatuses([]);
      return;
    }

    onSelectStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Filter className="h-4 w-4 text-black/50" />
      {(
        [
          "all",
          "accepted",
          "proposed",
          "rejected",
          "supersession_pending",
          "superseded",
        ] as const
      ).map((status) => {
        const selected =
          status === "all"
            ? selectedStatuses.length === 0
            : selectedStatuses.includes(status);

        return (
          <button
            key={status}
            className={`rounded-full border px-2.5 py-1 capitalize transition-colors ${
              selected
                ? "border-black/30 bg-black/10"
                : "border-black/10 bg-white/60 hover:bg-black/5"
            }`}
            onClick={() => toggleStatus(status)}
          >
            {status === "all" ? "All" : statusLabels[status]}
          </button>
        );
      })}
    </div>
  );
}

function TimelineView({
  records,
  panelSearch,
  setPanelSearch,
  selectedStatuses,
  setSelectedStatuses,
  proposalDecisions,
  pendingSupersessionByTargetId,
  onProposalDecision,
  onDeleteRecord,
}: {
  records: DemoRecord[];
  panelSearch: string;
  setPanelSearch: (value: string) => void;
  selectedStatuses: SelectedRecordStatuses;
  setSelectedStatuses: (statuses: SelectedRecordStatuses) => void;
  proposalDecisions: Record<string, ProposalDecision>;
  pendingSupersessionByTargetId: Record<string, DemoRecord>;
  onProposalDecision: (recordId: string, decision: ProposalDecision) => void;
  onDeleteRecord: (recordId: string) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const sortedRecords = [...records].sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? ""),
  );

  const toggleExpanded = (recordId: string) => {
    setExpandedIds((ids) =>
      ids.includes(recordId)
        ? ids.filter((id) => id !== recordId)
        : [...ids, recordId],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div>
          <h2 className="font-serif text-base">Timeline</h2>
          <p className="mt-1 text-xs text-black/60">
            Chronological case events. Select an event to inspect sources and
            links.
          </p>
        </div>
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
        <div className="absolute left-[.55rem] top-2 bottom-2 w-px bg-black/10" />
        {sortedRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/40 p-8 text-center text-sm text-black/55">
            No timeline events match the current filters.
          </div>
        ) : (
          sortedRecords.map((record) => {
            const expanded = expandedIds.includes(record.id);
            const decision = proposalDecisions[record.id];
            const displayStatus =
              record.status === "proposed" && decision
                ? decision.status
                : record.status;

            return (
              <article key={record.id} className="relative">
                <div className="absolute -left-[1.05rem] top-3 h-2.5 w-2.5 rounded-full border border-white bg-black/35" />
                <div
                  role="button"
                  tabIndex={0}
                  className="relative w-full cursor-pointer rounded-lg border border-black/10 bg-white/65 p-3 pr-10 text-left transition-colors hover:bg-black/[0.04]"
                  onClick={() => toggleExpanded(record.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleExpanded(record.id);
                    }
                  }}
                >
                  {(displayStatus === "accepted" ||
                    displayStatus === "rejected") && (
                    <div className="absolute right-2.5 top-2.5">
                      <RecordSettingsMenu
                        record={record}
                        decision={decision}
                        onDelete={onDeleteRecord}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-black/55">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {record.date ?? "Date unknown"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 capitalize ${statusClassName[displayStatus]}`}
                      >
                        {statusLabels[displayStatus]}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-black/55">
                        {record.typeStatus}
                      </span>
                      <PartyBadge party={record.party} />
                      {record.status === "proposed" && record.supersedes && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                          <GitBranch className="h-3 w-3" />
                          Supersedes existing
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-sm font-medium">
                      {record.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/60">
                      {record.miniDescription}
                    </p>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 rounded-lg p-1 text-black/45">
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-black/45" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-black/45" />
                    )}
                  </span>
                </div>

                {expanded && (
                  <div className="mt-2 rounded-lg border border-black/10 bg-white/55 p-3">
                    <p className="text-sm leading-6 text-black/75">
                      {record.content}
                    </p>
                    {record.status === "proposed" && record.supersedes && (
                      <SupersessionNotice record={record} />
                    )}
                    {pendingSupersessionByTargetId[record.id] && (
                      <SupersessionPendingNotice
                        proposal={pendingSupersessionByTargetId[record.id]}
                      />
                    )}
                    <div className="mt-3 flex flex-col gap-2">
                      <MiniPanel
                        icon={FileCheck2}
                        label="Sources"
                        values={record.sources}
                      />
                      <MiniPanel
                        icon={Link2}
                        label="Linked items"
                        values={record.linkedRecords}
                      />
                    </div>
                    {record.status === "proposed" && !decision && (
                      <ProposalActions
                        record={record}
                        onDelete={onDeleteRecord}
                        onDecision={onProposalDecision}
                      />
                    )}
                    {decision && <ProposalDecisionNote decision={decision} />}
                  </div>
                )}
              </article>
            );
          })
        )}
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
    <div className="rounded-xl border border-black/10 bg-white/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-black/60">
        <PencilLine className="h-4 w-4" />
        <span>New case note</span>
      </div>
      <textarea
        className="min-h-24 w-full resize-y rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
        placeholder="Capture a strategy thought, question, witness point, or hearing note..."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
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

function SupersessionNotice({ record }: { record: DemoRecord }) {
  if (!record.supersedes) {
    return null;
  }

  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <div className="flex items-center gap-1.5 font-medium">
        <GitBranch className="h-3.5 w-3.5" />
        <span>This proposal would supersede another case item</span>
      </div>
      <p className="mt-1 leading-5 text-amber-900/80">
        Proposed replacement for{" "}
        <span className="font-medium">{record.supersedes.title}</span>.
      </p>
      <p className="mt-1 leading-5 text-amber-900/80">
        {record.supersedes.summary}
      </p>
    </div>
  );
}

function PartyBadge({ party }: { party?: DemoRecordParty }) {
  if (!party) {
    return null;
  }

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] ${partyClassName[party]}`}
    >
      {partyLabels[party]}
    </span>
  );
}

function SupersessionPendingNotice({ proposal }: { proposal: DemoRecord }) {
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <div className="flex items-center gap-1.5 font-medium">
        <GitBranch className="h-3.5 w-3.5" />
        <span>Locked while a replacement proposal is pending</span>
      </div>
      <p className="mt-1 leading-5 text-amber-900/80">
        Proposed replacement:{" "}
        <span className="font-medium">{proposal.title}</span>.
      </p>
      <p className="mt-1 leading-5 text-amber-900/80">
        Review the proposal before editing, deleting, or rewriting this record.
      </p>
    </div>
  );
}

function ProposalActions({
  record,
  onDelete,
  onDecision,
}: {
  record: DemoRecord;
  onDelete: (recordId: string) => void;
  onDecision: (recordId: string, decision: ProposalDecision) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestingEdits, setSuggestingEdits] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-black/10 bg-white/70 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-green-800 transition-colors hover:bg-black/15"
          onClick={() => onDecision(record.id, { status: "accepted" })}
          type="button"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-800 transition-colors hover:bg-black/15"
          onClick={() => setRejecting((value) => !value)}
          type="button"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/15"
          onClick={() => onDelete(record.id)}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete proposal
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-black/[0.03] px-2.5 py-1.5 text-black/70 transition-colors hover:bg-black/15"
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
          <label className="text-xs font-medium text-red-900">
            Reason for rejecting this proposal
          </label>
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            placeholder="Example: unsupported by produced discovery, duplicates an accepted fact, or uses language that overstates the evidence."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-red-800 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-red-300"
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
          <label className="flex items-center gap-1.5 text-xs font-medium text-blue-900">
            <Sparkles className="h-3.5 w-3.5" />
            Suggested edit for the agent
          </label>
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="Tell the agent what to preserve, soften, cite, split, or rewrite before you accept it."
            value={editSuggestion}
            onChange={(event) => {
              setEditSuggestion(event.target.value);
              setEditSubmitted(false);
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {editSubmitted ? (
              <span className="text-xs text-blue-800">
                Edit suggestion queued for the agent.
              </span>
            ) : (
              <span className="text-xs text-blue-900/60">
                This keeps the proposal open for review.
              </span>
            )}
            <button
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-800 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:text-blue-300"
              disabled={!editSuggestion.trim()}
              onClick={() => setEditSubmitted(true)}
              type="button"
            >
              Send suggestion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalDecisionNote({ decision }: { decision: ProposalDecision }) {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
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
  record: DemoRecord;
  onDelete: (recordId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuNote, setMenuNote] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const itemLabel = singularViewLabels[record.type] ?? "item";
  const isSuperseded = record.status === "superseded";

  useEffect(() => {
    if (!open) {
      return;
    }

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
          className="absolute right-0 top-8 z-20 min-w-52 rounded-xl border border-black/15 bg-white/90 p-1.5 text-xs shadow-md backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          {isSuperseded ? (
            <p className="px-2.5 py-2 text-black/50">
              Superseded records are read-only.
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
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-red-800 transition-colors hover:bg-black/10"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuNote(`Rejection review queued for this ${itemLabel}.`);
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject {itemLabel}
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
          {menuNote && !isSuperseded && (
            <p className="mt-1 border-t border-black/10 px-2.5 py-2 text-[11px] leading-4 text-black/50">
              {menuNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RecordCard({
  record,
  decision,
  pendingSupersessionProposal,
  onDelete,
  onProposalDecision,
}: {
  record: DemoRecord;
  decision?: ProposalDecision;
  pendingSupersessionProposal?: DemoRecord;
  onDelete: (recordId: string) => void;
  onProposalDecision: (recordId: string, decision: ProposalDecision) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayStatus =
    record.status === "proposed" && decision ? decision.status : record.status;

  return (
    <article className="rounded-xl border border-black/10 bg-white/60 shadow-sm">
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
        {(displayStatus === "accepted" || displayStatus === "rejected") && (
          <div className="absolute right-3 top-3">
            <RecordSettingsMenu
              record={record}
              decision={decision}
              onDelete={onDelete}
            />
          </div>
        )}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusClassName[displayStatus]}`}
            >
              {statusLabels[displayStatus]}
            </span>
            <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] text-black/60">
              {record.typeStatus}
            </span>
            <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[11px] text-black/55">
              {record.category}
            </span>
            <PartyBadge party={record.party} />
            {record.status === "proposed" && record.supersedes && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                <GitBranch className="h-3 w-3" />
                Supersedes existing
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold">{record.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/60">
            {record.miniDescription}
          </p>
        </div>
        <span className="absolute bottom-3 right-3 rounded-lg p-1 text-black/45">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-black/45" />
          ) : (
            <ChevronRight className="h-4 w-4 text-black/45" />
          )}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-black/10 px-4 pb-4 pt-3">
          {record.status === "proposed" && record.supersedes && (
            <SupersessionNotice record={record} />
          )}
          {pendingSupersessionProposal && (
            <SupersessionPendingNotice proposal={pendingSupersessionProposal} />
          )}
          <p className="text-sm leading-6 text-black/75">{record.content}</p>
          <div className="mt-4 flex flex-col gap-2">
            <MiniPanel
              icon={FileCheck2}
              label="Sources"
              values={record.sources}
            />
            <MiniPanel
              icon={Link2}
              label="Linked items"
              values={record.linkedRecords}
            />
          </div>
          {record.status === "proposed" && !decision && (
            <ProposalActions
              record={record}
              onDelete={onDelete}
              onDecision={onProposalDecision}
            />
          )}
          {decision && <ProposalDecisionNote decision={decision} />}
        </div>
      )}
    </article>
  );
}

function DocumentsView() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-base">Documents</h2>
          <p className="mt-1 text-xs text-black/60">
            Indexed files become sources for facts, issues, arguments, and
            timeline events.
          </p>
        </div>
        <Button text="Upload document" icon="upload" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {demoDocuments.map((document) => (
          <article
            key={document.id}
            className="rounded-xl border border-black/10 bg-white/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <FileText className="h-5 w-5 text-black/55" />
              <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[11px] text-black/60">
                {document.status}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{document.fileName}</h3>
            <p className="mt-1 text-xs text-black/55">
              {document.category} · {document.date} · {document.linkedRecords}{" "}
              links
            </p>
            <p className="mt-3 text-sm leading-6 text-black/75">
              {document.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {document.gaps.map((gap) => (
                <span
                  key={gap}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
                >
                  {gap}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AgentConfigView() {
  const instructions = [
    "Draft case objects as proposals first; never silently promote AI output to accepted.",
    "Every strategic claim should cite a source document, note, or case item.",
    "Prefer short, reviewable proposals over long freeform analysis.",
    "Flag missing evidence and unsupported legal citations before trial use.",
  ];
  const [instructionDraft, setInstructionDraft] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [proposedInstructions, setProposedInstructions] = useState<string[]>(
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-black/10 bg-white/60 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h2 className="font-serif text-base">{demoCase.title} Agent</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-black/75">
          Ask for case work in plain language. Agent outputs stay reviewable:
          proposed links, proposed changes, draft summaries, and suggested case
          objects.
        </p>
        <div className="mt-4 rounded-lg border border-black/10 bg-white/75 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-black/60">
            <MessageSquare className="h-4 w-4" />
            <span>Ask Agent</span>
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
            placeholder="Ask the agent to summarize discovery gaps, compare arguments, or draft a focused review queue..."
            value={agentPrompt}
            onChange={(event) => setAgentPrompt(event.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button
              text="Ask Agent"
              icon="sparkles"
              disabled={!agentPrompt.trim()}
              onClick={() => setAgentPrompt("")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
        <h2 className="font-serif text-base">Instructions</h2>
        <div className="mt-3 flex flex-col gap-2">
          {[...instructions, ...proposedInstructions].map((instruction) => (
            <div
              key={instruction}
              className="flex gap-2 rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black/75"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-black/45" />
              <span>{instruction}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-black/10 bg-white/70 p-3">
          <label className="text-xs text-black/60">
            Propose an instruction change
          </label>
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
            placeholder="Example: When reviewing discovery, prioritize missing records controlled by property management."
            value={instructionDraft}
            onChange={(event) => setInstructionDraft(event.target.value)}
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
    </div>
  );
}

function RecordRow({ record }: { record: DemoRecord }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{record.title}</p>
          <p className="mt-1 text-xs text-black/55">
            {record.typeStatus} · {record.miniDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/70 p-3">
      <p className="text-[11px] text-black/55">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MiniPanel({
  icon: Icon,
  label,
  values,
}: {
  icon: LucideIcon;
  label: string;
  values: string[];
}) {
  return (
    <div className="min-w-0 rounded-lg border border-black/10 bg-black/[0.025] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-black/55">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        {values.length > 0 ? (
          values.slice(0, 3).map((value) => (
            <span key={value} className="truncate text-xs text-black/75">
              {value}
            </span>
          ))
        ) : (
          <span className="text-xs text-black/40">None yet</span>
        )}
      </div>
    </div>
  );
}
