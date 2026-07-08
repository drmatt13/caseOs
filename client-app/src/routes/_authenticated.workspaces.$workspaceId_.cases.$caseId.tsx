import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

import ActiveWorkspaceMenu from "#/components/menus/ActiveWorkspaceMenu";
import PageError from "#/components/errors/PageError";
import PageContentLoading from "#/components/ui/PageContentLoading";
import { useAuthenticatedLayoutEffect } from "#/components/layouts/AuthenticatedLayoutContext";
import { isNotFoundError } from "#/lib/errors";
import {
  caseDisplayName,
  caseForumLabel,
  caseIdentifierDisplayLabel,
} from "#/lib/caseContext";
import { useWorkspaceQuery } from "#/api/workspace/hooks";

import type { RecordViewType } from "#/types/caseWorkspace";
import { recordPartyLabel } from "#/lib/caseRecordPresentation";

import { useCaseWorkspace } from "#/components/features/case-workspace/useCaseWorkspace";
import { ShowProposedLinksContext } from "#/components/features/case-workspace/showProposedLinksContext";
import { WorkspaceCapabilitiesContext } from "#/components/features/case-workspace/workspaceCapabilitiesContext";
import { resolveCapabilities } from "#/lib/permissions";
import RecordInspector from "#/components/features/case-workspace/RecordInspector";
import RecordCreateModal from "#/components/features/case-workspace/RecordCreateModal";
import GenerateRecordModal from "#/components/features/case-workspace/GenerateRecordModal";
import GlobalSearchView from "#/components/features/case-workspace/views/GlobalSearchView";
import OverviewView from "#/components/features/case-workspace/views/OverviewView";
import AgentView from "#/components/features/case-workspace/views/AgentView";
import ReviewView from "#/components/features/case-workspace/views/ReviewView";
import DocumentsView from "#/components/features/case-workspace/views/DocumentsView";
import PeopleView from "#/components/features/case-workspace/views/PeopleView";
import TimelineView from "#/components/features/case-workspace/views/TimelineView";
import RecordsView from "#/components/features/case-workspace/views/RecordsView";

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId_/cases/$caseId")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { workspaceId, caseId } = Route.useParams();

  // Get the workspace from the workspaceId param
  const {
    data: workspace,
    isPending: getWorkspacePending,
    error: getWorkspaceError,
    refetch: refetchWorkspace,
  } = useWorkspaceQuery(workspaceId);

  // get the case for the current workspace
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
    createTarget,
    openCreate,
    closeCreate,
    generateTarget,
    openGenerate,
    closeGenerate,
    showProposedLinksValue,
    viewCounts,
    globalSearchResults,
    pendingProposalCount,
  } = useCaseWorkspace(caseId);

  // // Scroll to top when the active view changes
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

  const userCapabilities = useMemo(
    () =>
      workspace
        ? resolveCapabilities(workspace.currentUserMembership.role)
        : null,
    [workspace],
  );

  const caseName = caseDisplayName(demo.caseContext);
  const caseIdentifier = caseIdentifierDisplayLabel(demo.caseContext);
  const caseForum = caseForumLabel(demo.caseContext);

  useAuthenticatedLayoutEffect(
    () => ({
      navigationActiveItemKey: workspace ? activeView : undefined,
      navigationContent:
        workspace && userCapabilities ? (
          <>
            <div className="text-sm flex gap-1.5 items-center">
              <Link to="/workspaces/$workspaceId" params={{ workspaceId }}>
                <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
                  <ArrowLeft className="w-3 h-3" />
                </div>
              </Link>
              <p className="truncate">{caseName}</p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-lg border border-black/22 lg:border-black/15 bg-white/25 lg:bg-black/3 py-1.75 pl-8 pr-2 text-sm placeholder:text-black/65 text-black/75 outline-none transition focus:border-black/30 focus:bg-white/50 lg:focus:bg-white/75"
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
          </>
        ) : null,
      navigationLoading: getWorkspacePending,
      showWorkspaceSettings: userCapabilities?.manageWorkspace ?? false,
    }),
    // getWorkspacePending must be a dep: on a query error, pending flips false
    // with workspace still undefined — without it the effect wouldn't re-fire
    // and the nav skeleton would be stuck on.
    [
      activeView,
      caseName,
      getWorkspacePending,
      globalSearch,
      pendingProposalCount,
      userCapabilities?.manageWorkspace,
      viewCounts,
      workspace,
      workspaceId,
    ],
  );

  if (getWorkspacePending) {
    return <PageContentLoading />;
  }

  // Workspace doesn't exist / no access → not-found page, never log out.
  if (isNotFoundError(getWorkspaceError)) {
    return (
      <PageError
        title="Workspace not found"
        message="This workspace doesn't exist or you no longer have access."
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  // Workspace failed to load → recoverable, never log out.
  if (getWorkspaceError) {
    return (
      <PageError
        title="Couldn't load this workspace"
        message="Something went wrong loading this workspace. Please try again."
        onRetry={() => void refetchWorkspace()}
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  // No error but no data (defensive — the query throws NotFoundError instead).
  if (!workspace) {
    return (
      <PageError
        title="Workspace not found"
        message="This workspace doesn't exist or you no longer have access."
        actionLabel="Go home"
        actionTo="/"
      />
    );
  }

  if (!userCapabilities) {
    return null;
  }

  return (
    <ShowProposedLinksContext.Provider value={showProposedLinksValue}>
      <WorkspaceCapabilitiesContext.Provider value={userCapabilities}>
        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/15 pb-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/15 bg-white/75 px-2.5 py-1 text-xs text-black/65">
                  {caseIdentifier}
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
              <h1 className="truncate text-2xl font-semibold">{caseName}</h1>
              <p className="mt-1 text-sm text-black/70">
                {caseForum} · {recordPartyLabel("ours", clientRole)} side
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
            <PeopleView
              graph={graph}
              onOpenRecord={openRecord}
              onCreateRecord={openCreate}
              onGenerateRecord={openGenerate}
            />
          ) : activeView === "timeline" ? (
            <TimelineView
              graph={graph}
              panelSearch={panelSearch}
              setPanelSearch={setPanelSearch}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              onOpenRecord={openRecord}
              onCreateRecord={openCreate}
              onGenerateRecord={openGenerate}
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
              onCreateRecord={openCreate}
              onGenerateRecord={openGenerate}
            />
          )}
        </div>

        {createPortal(
          <>
            {/* Hosted outside ContentShell: a backdrop-blur ancestor would otherwise
            trap this fixed overlay's containing block. Mirrors AppModal. */}
          <RecordInspector
            stack={inspectorStack}
            graph={graph}
            onOpenRecord={openRecord}
            onBack={inspectorBack}
            onClose={closeInspector}
          />

          <RecordCreateModal
            target={createTarget}
            graph={graph}
            onClose={closeCreate}
            onCreated={(record) => {
              closeCreate();
              openRecord(record.id);
            }}
          />

          <GenerateRecordModal
            target={generateTarget}
            onClose={closeGenerate}
          />
          </>,
          document.body,
        )}
      </WorkspaceCapabilitiesContext.Provider>
    </ShowProposedLinksContext.Provider>
  );
}
