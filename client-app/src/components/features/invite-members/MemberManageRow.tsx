import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { MembershipRole } from "#/api/generated/graphql";
import type { WorkspaceDetailMember } from "#/api/workspace/model";
import AdminRoleWarning from "#/components/features/invite-members/AdminRoleWarning";
import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import { cn, fieldClass, fieldDisabledClass } from "#/components/ui/form";
import { workspaceRoleOptions } from "#/lib/workspaceRoles";

type MemberManageRowProps = {
  member: WorkspaceDetailMember;
  // Owner row or the current user's own row — shown read-only (a member cannot
  // be demoted below Owner, and no one may change/remove their own membership).
  locked: boolean;
  // Muted hint on locked rows: "Owner" or "You".
  lockedLabel?: string;
  onRoleChange: (role: MembershipRole) => void;
  onRemove: () => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
};

const memberName = (member: WorkspaceDetailMember): string =>
  `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() ||
  member.user.email ||
  "Member";

const MemberAvatar = ({ member }: { member: WorkspaceDetailMember }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = `${member.user.firstName?.[0] ?? ""}${
    member.user.lastName?.[0] ?? ""
  }`;

  if (member.user.profilePicture && !imageFailed) {
    return (
      <img
        src={member.user.profilePicture}
        alt={memberName(member)}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring ring-black/20"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/15 text-xs">
      {initials}
    </div>
  );
};

const MemberIdentity = ({ member }: { member: WorkspaceDetailMember }) => (
  <div className="flex min-w-0 flex-1 items-center gap-2">
    <MemberAvatar member={member} />
    <div className="flex min-w-0 flex-col">
      <p className="truncate text-sm">{memberName(member)}</p>
      {member.user.email && (
        <p className="truncate text-xs text-black/55">{member.user.email}</p>
      )}
    </div>
  </div>
);

// One accepted-member row in the Manage Members modal. Locked rows (owner / self)
// render read-only. Editable rows expose a role picker + remove control, each with
// an inline confirm step: promoting to Admin stages the change behind a warning +
// Confirm/Cancel; removal asks before firing. Demotions and other role changes
// apply immediately on select.
const MemberManageRow = ({
  member,
  locked,
  lockedLabel,
  onRoleChange,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: MemberManageRowProps) => {
  // The Admin role staged behind the confirm step (null when not promoting).
  const [stagedAdminRole, setStagedAdminRole] = useState<MembershipRole | null>(
    null,
  );
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const busy = isUpdating || isRemoving;

  const handleSelect = (next: MembershipRole) => {
    if (next === member.role) {
      setStagedAdminRole(null);
      return;
    }

    // Promoting to Admin is the one role change that requires confirmation.
    if (next === "ADMIN") {
      setStagedAdminRole("ADMIN");
      return;
    }

    setStagedAdminRole(null);
    onRoleChange(next);
  };

  const confirmPromotion = () => {
    if (!stagedAdminRole) {
      return;
    }

    // Keep the role staged through the pending mutation so the picker stays on
    // "Admin" and the confirm row shows "Saving"; the confirm row hides itself
    // once the refetched member.role catches up (see `showPromotionConfirm`).
    onRoleChange(stagedAdminRole);
  };

  // Visible only while the staged Admin promotion hasn't yet landed (covers the
  // pending mutation, and auto-clears after the workspace refetch).
  const showPromotionConfirm =
    stagedAdminRole !== null && stagedAdminRole !== member.role;

  if (locked) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/50 px-2.5 py-1.5">
        <MemberIdentity member={member} />
        <div className="flex shrink-0 items-center gap-2">
          {lockedLabel && (
            <span className="text-xs text-black/45">{lockedLabel}</span>
          )}
          <WorkspaceRoleBadge role={member.role} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white/50 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <MemberIdentity member={member} />
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label={`Role for ${memberName(member)}`}
            value={stagedAdminRole ?? member.role}
            disabled={busy || confirmingRemoval}
            onChange={(event) =>
              handleSelect(event.target.value as MembershipRole)
            }
            className={cn(
              fieldClass("sm"),
              "w-36",
              (busy || confirmingRemoval) && fieldDisabledClass,
            )}
          >
            {workspaceRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label={`Remove ${memberName(member)}`}
            title={`Remove ${memberName(member)}`}
            disabled={busy || confirmingRemoval}
            onClick={() => setConfirmingRemoval(true)}
            className="rounded-lg p-1.5 text-red-700 transition-colors duration-150 ease-in hover:bg-red-600/10 hover:duration-100 hover:ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showPromotionConfirm && (
        <div className="flex flex-col gap-2">
          <AdminRoleWarning size="sm" />
          <div className="flex items-center justify-end gap-2">
            <Button
              text="Cancel"
              style="ghost"
              size="sm"
              onClick={() => setStagedAdminRole(null)}
              disabled={isUpdating}
            />
            <Button
              text={isUpdating ? "Saving" : "Make Admin"}
              style="primary"
              size="sm"
              onClick={confirmPromotion}
              disabled={isUpdating}
            />
          </div>
        </div>
      )}

      {confirmingRemoval && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-black/65">
            Remove {memberName(member)} from this workspace?
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              text="Cancel"
              style="ghost"
              size="sm"
              onClick={() => setConfirmingRemoval(false)}
              disabled={isRemoving}
            />
            <Button
              text={isRemoving ? "Removing" : "Remove"}
              style="danger"
              size="sm"
              onClick={onRemove}
              disabled={isRemoving}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManageRow;
