import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";

import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import ActiveWorkspaceMenu, {
  type ViewCount,
} from "#/components/menus/ActiveWorkspaceMenu";
import UserPanel from "#/components/layouts/UserPanel";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import { requireAuth } from "#/lib/auth";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

import type { RecordStatus } from "#/types/caseRecords";
import {
  RECORD_TYPE_VIEW,
  type RecordViewType,
  type WorkspaceViewType,
} from "#/types/caseWorkspace";
import { recordPartyLabel } from "#/lib/caseRecordPresentation";
import {
  demoCase,
  demoCaseContext,
  demoDocuments,
} from "#/lib/caseWorkspaceDemo";

import { useWorkspaceGraph } from "#/components/features/case-workspace/useWorkspaceGraph";
import { ShowProposedLinksContext } from "#/components/features/case-workspace/showProposedLinksContext";
import { clientRole, recordMatchesSearch } from "#/components/features/case-workspace/helpers";
import { DEFAULT_VISIBLE_STATUSES } from "#/components/features/case-workspace/RecordFilters";
import RecordInspector from "#/components/features/case-workspace/RecordInspector";
import GlobalSearchView from "#/components/features/case-workspace/views/GlobalSearchView";
import OverviewView from "#/components/features/case-workspace/views/OverviewView";
import AgentView from "#/components/features/case-workspace/views/AgentView";
import ReviewView from "#/components/features/case-workspace/views/ReviewView";
import DocumentsView from "#/components/features/case-workspace/views/DocumentsView";
import PeopleView from "#/components/features/case-workspace/views/PeopleView";
import TimelineView from "#/components/features/case-workspace/views/TimelineView";
import RecordsView from "#/components/features/case-workspace/views/RecordsView";

export const Route = createFileRoute("/workspaces/$workspaceId_/cases/$caseId")(
  {
    beforeLoad: requireAuth,
    component: RouteComponent,
  },
);

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
    setInspectorStack((stack) => {
      const existingIndex = stack.indexOf(recordId);
      if (existingIndex >= 0) return stack.slice(0, existingIndex + 1);
      return stack[stack.length - 1] === recordId
        ? stack
        : [...stack, recordId];
    });
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
