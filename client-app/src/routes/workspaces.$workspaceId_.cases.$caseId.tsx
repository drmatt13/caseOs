import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useRef } from "react";

import AppLayout from "#/components/layouts/AppLayout";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import ContentShell from "#/components/layouts/ContentShell";
import ActiveWorkspaceMenu from "#/components/menus/ActiveWorkspaceMenu";
import UserPanel from "#/components/layouts/UserPanel";
import PageLoading from "#/components/ui/PageLoading";
import GetUserError from "#/components/errors/GetUserError";
import { requireAuth } from "#/lib/auth";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

import type { RecordViewType } from "#/types/caseWorkspace";
import { recordPartyLabel } from "#/lib/caseRecordPresentation";

import { useCaseWorkspace } from "#/components/features/case-workspace/useCaseWorkspace";
import { ShowProposedLinksContext } from "#/components/features/case-workspace/showProposedLinksContext";
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

  const {
    demo,
    clientRole,
    graph,
    activeView,
    handleSelectView,
    globalSearch,
    setGlobalSearch,
    panelSearch,
    setPanelSearch,
    selectedStatuses,
    setSelectedStatuses,
    inspectorStack,
    openRecord,
    inspectorBack,
    closeInspector,
    showProposedLinksValue,
    viewCounts,
    globalSearchResults,
    pendingProposalCount,
  } = useCaseWorkspace(caseId);
  const previousActiveViewRef = useRef(activeView);

  useEffect(() => {
    if (previousActiveViewRef.current === activeView) {
      return;
    }

    previousActiveViewRef.current = activeView;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeView]);

  if (getUserPending || getWorkspacePending) {
    return <PageLoading />;
  }

  if (getUserError || !user || getWorkspaceError || !workspace) {
    return <GetUserError />;
  }

  const canManageWorkspace =
    workspace.currentUserMembership?.role === "OWNER" ||
    workspace.currentUserMembership?.role === "ADMIN";

  return (
    <ShowProposedLinksContext.Provider value={showProposedLinksValue}>
      <AppLayout>
        <NavigationPanel activeItemKey={activeView}>
          <UserPanel user={user} settings={true} showTier={true} />
          <div className="text-sm flex gap-1.5 items-center">
            <Link to="/workspaces/$workspaceId" params={{ workspaceId }}>
              <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
                <ArrowLeft className="w-3 h-3" />
              </div>
            </Link>
            <p className="truncate">{demo.meta.title}</p>
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

        <ContentShell showWorkspaceSettings={canManageWorkspace}>
          <div className="flex min-w-0 flex-col gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/15 pb-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-black/15 bg-white/75 px-2.5 py-1 text-xs text-black/65">
                    {demo.meta.caseNumber}
                  </span>
                  {pendingProposalCount > 0 && (
                    <button
                      type="button"
                      className="rounded-full border border-amber-600/35 bg-amber-50/60 px-2.5 py-1 text-xs text-amber-900 transition-colors hover:border-amber-700/45 hover:bg-amber-100/70"
                      onClick={() => handleSelectView("review")}
                    >
                      {pendingProposalCount} proposals need review
                    </button>
                  )}
                </div>
                <h1 className="truncate text-2xl font-semibold">
                  {demo.meta.title}
                </h1>
                <p className="mt-1 text-sm text-black/70">
                  {demo.caseContext.jurisdictionOrCourt} ·{" "}
                  {recordPartyLabel("ours", clientRole)} side
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
              <OverviewView graph={graph} onOpenRecord={openRecord} />
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
          onBack={inspectorBack}
          onClose={closeInspector}
        />
      </AppLayout>
    </ShowProposedLinksContext.Provider>
  );
}
