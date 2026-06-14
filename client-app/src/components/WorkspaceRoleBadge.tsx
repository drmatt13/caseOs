import { TONES } from "#/lib/tones";

export type WorkspaceRoleBadgeRole =
  | "Owner"
  | "Admin"
  | "Contributor"
  | "Read Only";

type WorkspaceRoleBadgeProps = {
  role: WorkspaceRoleBadgeRole;
  className?: string;
};

// Roles map to the same semantic tones as the rest of the app, so "the same
// idea is the same color" holds across surfaces (e.g. Owner == the `special`
// tone used for elevated records). See lib/tones.ts.
const roleBadgeColors: Record<WorkspaceRoleBadgeRole, string> = {
  Owner: TONES.special.badgeInteractive,
  Admin: TONES.positive.badgeInteractive,
  Contributor: TONES.info.badgeInteractive,
  "Read Only": TONES.neutral.badgeInteractive,
};

const WorkspaceRoleBadge = ({
  role,
  className = "",
}: WorkspaceRoleBadgeProps) => (
  <div
    className={`${roleBadgeColors[role]} border inline-flex w-fit shrink-0 items-center px-2 py-0.5 rounded-full text-xs transition-colors ease-in duration-150 group-hover:ease-out group-hover:duration-100 ${className}`}
  >
    {role}
  </div>
);

export default WorkspaceRoleBadge;
