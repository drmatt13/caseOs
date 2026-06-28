import type { MembershipRole } from "#/api/generated/graphql";
import { TONES } from "#/lib/tones";
import { WORKSPACE_ROLE_META } from "#/lib/workspaceRoles";

type WorkspaceRoleBadgeProps = {
  role: MembershipRole;
  className?: string;
};

// Roles map to the same semantic tones as the rest of the app, so "the same
// idea is the same color" holds across surfaces (e.g. Owner == the `special`
// tone used for elevated records). Labels + tones come from WORKSPACE_ROLE_META.
const WorkspaceRoleBadge = ({
  role,
  className = "",
}: WorkspaceRoleBadgeProps) => {
  const meta = WORKSPACE_ROLE_META[role];

  return (
    <div
      className={`${TONES[meta.tone].badgeInteractive} border inline-flex w-fit shrink-0 items-center px-2 py-0.5 rounded-full text-xs transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100 ${className}`}
    >
      {meta.label}
    </div>
  );
};

export default WorkspaceRoleBadge;
