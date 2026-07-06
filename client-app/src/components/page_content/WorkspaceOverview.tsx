import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  Mail,
  PlusIcon,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useContext } from "react";
import type { AccountTier } from "#/api/generated/graphql";
import type { WorkspaceListItem } from "#/api/workspace/hooks";
import { AppModalContext } from "#/context/AppModalContext";

interface WorkspaceOverviewProps {
  accountTier: AccountTier;
  workspaces: WorkspaceListItem[];
}

const accountTierLabels = {
  FREE: "Free",
  TRIAL: "Trial",
  SOLO: "Solo",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
} satisfies Record<AccountTier, string>;

const workspaceActionClassName =
  "inline-flex items-center justify-center gap-2 rounded border border-transparent bg-[#282828] px-2 py-2 text-sm text-white transition-colors ease-in duration-150 hover:bg-black hover:ease-out hover:duration-100";

const secondaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded border border-black/10 bg-black/10 px-2 py-2 text-sm text-black/75 shadow-sm transition-colors ease-in duration-150 hover:bg-gray-300 hover:text-black hover:ease-out hover:duration-100";

const formatUpdatedAt = (updatedAt: string | null) => {
  if (!updatedAt) return "Updated recently";

  const parsedDate = new Date(updatedAt);
  if (Number.isNaN(parsedDate.getTime())) return "Updated recently";

  return `Updated ${parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const getBestFitWorkspace = (workspaces: WorkspaceListItem[]) =>
  [...workspaces].sort((first, second) => {
    const firstTime = first.updatedAt ? new Date(first.updatedAt).getTime() : 0;
    const secondTime = second.updatedAt
      ? new Date(second.updatedAt).getTime()
      : 0;

    return secondTime - firstTime;
  })[0];

interface BestFitWorkspaceProps {
  workspaces: WorkspaceListItem[];
}

const BestFitWorkspace = ({ workspaces }: BestFitWorkspaceProps) => {
  const bestFitWorkspace = getBestFitWorkspace(workspaces);
  const otherWorkspaces = workspaces
    .filter((workspace) => workspace.id !== bestFitWorkspace.id)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex flex-col gap-1.5">
        <p className="text-xl font-bold">Workspace overview</p>
        <p className="max-w-2xl text-md leading-6 text-black/65">
          Pick up where work was last active, or create a new workspace for a
          separate team, matter, or operating group.
        </p>
      </div>

      <div className="rounded-lg border border-black/15 bg-black/6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/60">
              <Sparkles className="h-5 w-5 text-black/70" />
            </div>
            <p className="text-sm font-medium text-black/65">Best fit</p>
            <p className="mt-1 truncate text-lg font-bold">
              {bestFitWorkspace.name}
            </p>
            <p className="mt-1 text-sm text-black/65">
              {formatUpdatedAt(bestFitWorkspace.updatedAt)}
            </p>
          </div>
          <Link
            to="/workspaces/$workspaceId"
            params={{ workspaceId: bestFitWorkspace.id }}
            className={workspaceActionClassName}
          >
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {otherWorkspaces.map((workspace) => (
          <Link
            key={workspace.id}
            to="/workspaces/$workspaceId"
            params={{ workspaceId: workspace.id }}
            className="rounded-lg bg-black/6 p-3 transition-colors ease-in duration-150 hover:bg-black/10 hover:ease-out hover:duration-100"
          >
            <p className="truncate text-sm font-medium">{workspace.name}</p>
            <p className="mt-1 text-sm text-black/65">
              {formatUpdatedAt(workspace.updatedAt)}
            </p>
          </Link>
        ))}
        {/* <Link to="/workspaces/new" className={secondaryActionClassName}>
          <PlusIcon className="h-4 w-4" />
          New workspace
        </Link> */}
      </div>
    </div>
  );
};

const WorkspaceOverview = ({
  accountTier,
  workspaces,
}: WorkspaceOverviewProps) => {
  const { setModal } = useContext(AppModalContext);
  const hasWorkspaces = workspaces.length > 0;
  const canCreateWorkspace = accountTier !== "FREE";
  const emptyStateTitle = canCreateWorkspace
    ? "Create your first workspace"
    : "No workspace access yet";
  const emptyStateDescription = canCreateWorkspace
    ? "Your subscription is active. Create a workspace to start organizing cases, members, documents, and shared decisions."
    : `You are currently on the ${accountTierLabels[accountTier]} plan. Upgrade when you are ready to create your own workspace, or accept an invite to join an existing one.`;

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      {hasWorkspaces ? (
        <BestFitWorkspace workspaces={workspaces} />
      ) : (
        <div className="flex flex-col items-center justify-center lg:px-6 pt-6 pb-2 text-center">
          <div className="mb-4 flex aspect-square items-center justify-center rounded-full border border-black/15 bg-black/8 p-4">
            <BriefcaseBusiness className="h-7 w-7 text-black/75" />
          </div>

          <p className="text-xl font-bold">{emptyStateTitle}</p>
          <p className="mt-2 max-w-xl text-md leading-6 text-black/65">
            {emptyStateDescription}
          </p>

          <div className="mt-7 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-lg bg-black/6 p-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-sm font-medium">Build a team space</p>
                <p className="mt-1 text-sm leading-5 text-black/65">
                  {canCreateWorkspace
                    ? "Start with a shared space for your team, matters, and operating context."
                    : "Create a workspace when your subscription includes workspace access."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-black/6 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-sm font-medium">Join from invites</p>
                <p className="mt-1 text-sm leading-5 text-black/65">
                  Accepted invites give you access without creating your own
                  workspace.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-black/6 p-3">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
              <div>
                <p className="text-sm font-medium">
                  Keep case context together
                </p>
                <p className="mt-1 text-sm leading-5 text-black/65">
                  Workspaces keep case work, people, and decisions in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {canCreateWorkspace ? (
              <Link to="/workspaces/new" className={workspaceActionClassName}>
                <PlusIcon className="h-4 w-4" />
                Create workspace
              </Link>
            ) : (
              <button
                type="button"
                className={workspaceActionClassName}
                onClick={() => setModal("manage subscription")}
              >
                <Building2 className="h-4 w-4" />
                View subscription options
              </button>
            )}
            <button
              type="button"
              className={secondaryActionClassName}
              onClick={() => setModal("my invitations")}
            >
              <Mail className="h-4 w-4" />
              Check invites
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceOverview;
