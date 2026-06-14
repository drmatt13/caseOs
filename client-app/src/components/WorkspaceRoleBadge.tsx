export type WorkspaceRoleBadgeRole =
  | "Owner"
  | "Admin"
  | "Contributor"
  | "Read Only";

type WorkspaceRoleBadgeProps = {
  role: WorkspaceRoleBadgeRole;
  className?: string;
};

const roleBadgeColors: Record<WorkspaceRoleBadgeRole, string> = {
  Owner:
    "border-purple-200 bg-purple-50 text-purple-800/80 group-hover:text-purple-900/70 group-hover:border-purple-900/25",
  Admin:
    "border-emerald-300/40 bg-green-50 text-green-800/85 group-hover:text-green-900/65 group-hover:border-green-900/25",
  Contributor:
    "border-blue-200 bg-blue-50 text-blue-800/85 group-hover:text-blue-900/70 group-hover:border-blue-900/25",
  "Read Only":
    "border-black/10 bg-black/5 text-black/65 group-hover:bg-gray-200/82.5 group-hover:text-black/60 group-hover:border-black/20",
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
