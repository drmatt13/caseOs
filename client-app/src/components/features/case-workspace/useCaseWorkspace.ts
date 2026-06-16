import { useMemo, useState } from "react";

import type { ViewCount } from "#/components/menus/ActiveWorkspaceMenu";
import { RECORD_TYPE_VIEW, type WorkspaceViewType } from "#/types/caseWorkspace";
import { getCaseDemo } from "#/demo/caseDemos";

import { useWorkspaceGraph } from "./useWorkspaceGraph";
import { recordMatchesSearch, type RecordFilterStatus } from "./helpers";
import { DEFAULT_VISIBLE_STATUSES } from "./RecordFilters";

// All local UI state and derivations for the case workspace route: the active
// view, the search boxes, the status filter, the inspector traversal stack, and
// the derived view counts / global-search results. Called once from the route
// component, so every piece of state lives in the same component instance — this
// is a pure readability extraction with identical behavior to inlining it.
export function useCaseWorkspace(caseId: string) {
  const demo = useMemo(() => getCaseDemo(caseId), [caseId]);
  const clientRole = demo.caseContext.representation.clientRole;
  const graph = useWorkspaceGraph(demo);

  const [activeView, setActiveView] = useState<WorkspaceViewType>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [panelSearch, setPanelSearch] = useState("");
  // Replaced records are hidden by default so the views show only live work.
  const [selectedStatuses, setSelectedStatuses] = useState<RecordFilterStatus[]>(
    DEFAULT_VISIBLE_STATUSES,
  );
  // Graph traversal: a stack of record ids opened in the inspector drawer.
  const [inspectorStack, setInspectorStack] = useState<string[]>([]);
  // Sticky inspector preference for accepted records as graph traversal moves
  // from one inspected record to the next.
  const [showProposedLinks, setShowProposedLinks] = useState(true);
  const [showRejectedRecords, setShowRejectedRecords] = useState(true);
  const showProposedLinksValue = useMemo(
    () => ({
      show: showProposedLinks,
      setShow: setShowProposedLinks,
      showRejected: showRejectedRecords,
      setShowRejected: setShowRejectedRecords,
    }),
    [showProposedLinks, showRejectedRecords],
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

  const inspectorBack = () => setInspectorStack((stack) => stack.slice(0, -1));
  const closeInspector = () => setInspectorStack([]);

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
      // Frozen records are reference-only — not live work, so they don't tally
      // into either badge (the entry is still created for the view).
      if (!graph.recordIsFrozen(record)) {
        if (status === "PROPOSED") entry.proposed += 1;
        else if (status === "ACCEPTED" || status === "PENDING_REPLACEMENT")
          entry.accepted += 1;
      }
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
      accepted: demo.documents.length,
      proposed: documentRecordCounts.proposed,
    };
    return counts;
    // graph.effectiveStatus is recreated each render; records is the real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.records, demo.documents.length]);

  const globalSearchResults = useMemo(
    () =>
      globalSearch.trim().length === 0
        ? []
        : graph.records.filter((record) =>
            recordMatchesSearch(record, globalSearch, clientRole),
          ),
    [globalSearch, graph.records, clientRole],
  );

  return {
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
    pendingProposalCount: graph.proposedRecords.length,
  };
}
