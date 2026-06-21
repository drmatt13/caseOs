import {
  AlertCircle,
  Bot,
  CircleHelp,
  Clock,
  Compass,
  Folder,
  Gavel,
  Inbox,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Mic,
  NotebookPen,
  Scale,
  SquareCheckBig,
  Target,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { VIEW_LABELS } from "#/lib/caseRecordPresentation";
import {
  WORKSPACE_MENU_GROUPS,
  type WorkspaceViewType,
} from "#/types/caseWorkspace";

const viewIcons: Record<WorkspaceViewType, LucideIcon> = {
  agent: Bot,
  overview: LayoutDashboard,
  review: Inbox,
  objectives: Target,
  claims: Scale,
  posture: Compass,
  theories: Lightbulb,
  issues: AlertCircle,
  questions: CircleHelp,
  arguments: Gavel,
  tasks: SquareCheckBig,
  facts: ListChecks,
  timeline: Clock,
  testimony: Mic,
  precedent: Landmark,
  notes: NotebookPen,
  documents: Folder,
  people: Users,
};

// Per-view counts split by lifecycle so each item can show how many records are
// authoritative (accepted) vs awaiting review (proposed).
export interface ViewCount {
  accepted: number;
  proposed: number;
}

interface ActiveWorkspaceMenuProps {
  activeView: WorkspaceViewType;
  onSelectView: (view: WorkspaceViewType) => void;
  counts?: Partial<Record<WorkspaceViewType, ViewCount>>;
  // Pending proposal count; rendered as the (blue) review badge.
  reviewCount?: number;
}

// Gray = accepted/authoritative, blue = proposed/awaiting review.
function CountBadge({ count, tone }: { count: number; tone: "gray" | "blue" }) {
  if (count <= 0) return null;
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-xs font-mono border ${
        tone === "blue"
          ? "bg-blue-200/75 text-blue-800 border-blue-300"
          : "bg-black/10 text-black/70 border-black/15"
      }`}
    >
      {count}
    </span>
  );
}

const ActiveWorkspaceMenu = ({
  activeView,
  onSelectView,
  counts = {},
  reviewCount = 0,
}: ActiveWorkspaceMenuProps) => {
  return (
    <div className="flex flex-col gap-0.5">
      {WORKSPACE_MENU_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`}>
          {group.label && (
            <p className="px-2 pb-1 pt-3 text-[0.65rem] font-medium uppercase tracking-wider text-black/55">
              {group.label}
            </p>
          )}
          {group.views.map((view) => {
            const Icon = viewIcons[view];
            const count = counts[view];

            return (
              <div
                key={view}
                data-nav-item={view}
                aria-current={activeView === view ? "page" : undefined}
                className={`p-2 h-8 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100 ${
                  activeView === view
                    ? "bg-black/14 font-medium"
                    : "hover:bg-black/10"
                }`}
                onClick={() => onSelectView(view)}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="truncate">{VIEW_LABELS[view]}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {view === "review" ? (
                    // Review queue only surfaces what's awaiting review (blue).
                    <CountBadge count={reviewCount} tone="blue" />
                  ) : (
                    <>
                      {/* <CountBadge count={count?.proposed ?? 0} tone="blue" /> */}
                      <CountBadge count={count?.accepted ?? 0} tone="gray" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ActiveWorkspaceMenu;
