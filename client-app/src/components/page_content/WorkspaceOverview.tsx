import { BriefcaseBusiness, FileText, Scale, Users } from "lucide-react";
import Button from "#/components/Button";

const WorkspaceDashboard = () => {
  // const {
  // data: userResult,
  // isPending: userPending,
  // error: userError,
  // } = useCurrentUserQuery();

  // useGetWorkspaceQuery would go here to fetch workspaces for the user and set them in state
  // For example:
  // const { data: getWorkspaceResult, isPending: getWorkspacePending, error: getWorkspaceError } = useGetWorkspacesQuery();

  return (
    <div className="flex /flex-1 flex-col items-center justify-center lg:px-6 pt-6 pb-2 text-center">
      <div className="mb-4 flex aspect-square items-center justify-center rounded-full border border-black/10 bg-black/6 p-4">
        <BriefcaseBusiness className="h-7 w-7 text-black/75" />
      </div>

      <p className="text-xl font-bold">
        {true ? "Create your first workspace" : "No workspace access yet"}
      </p>
      <p className="mt-2 max-w-xl text-md leading-6 text-black/65">
        {true
          ? "Set up a shared space for cases, members, documents, and workspace-level decisions."
          : "Ask a workspace owner for an invite, or upgrade your account to create one."}
      </p>

      <div className="mt-7 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg bg-black/5 p-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-sm font-medium">No members yet</p>
            <p className="mt-1 text-sm leading-5 text-black/55">
              Invite collaborators once your workspace is ready.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-black/5 p-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-sm font-medium">No shared cases yet</p>
            <p className="mt-1 text-sm leading-5 text-black/55">
              Cases can be grouped under one operating space.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-black/5 p-3">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-black/65" />
          <div>
            <p className="text-sm font-medium">No workspace context</p>
            <p className="mt-1 text-sm leading-5 text-black/55">
              Team notes and decisions will live here.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 max-w-sm text-sm leading-5 text-black/55">
        Workspace creation is available on Pro and Enterprise plans. You can
        still join a workspace by accepting an invite.
      </p>
    </div>
  );
};

export default WorkspaceDashboard;
