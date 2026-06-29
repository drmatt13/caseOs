import { XIcon } from "lucide-react";
import type { MembershipRole } from "#/api/generated/graphql";
import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import {
  SelectField,
  TextInputField,
  type FieldSize,
} from "#/components/ui/form";
import { TONES } from "#/lib/tones";
import {
  ASSIGNABLE_ROLE_META,
  workspaceRoleOptions,
} from "#/lib/workspaceRoles";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A reference legend describing what each assignable role can do. Shared by the
// create-workspace wizard (md) and the Onboard Members modal (sm) so the
// descriptions stay in one place (WORKSPACE_ROLE_META). Each role is a stacked
// row — the role name in its semantic tone ink (same coloring as record-card
// statuses), with the muted description beneath it.
export const RoleDescriptions = ({ size = "md" }: { size?: FieldSize }) => {
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/40 p-3">
      {ASSIGNABLE_ROLE_META.map((meta) => (
        <div key={meta.value} className="flex flex-col gap-0.5">
          <p className={`${textSize} font-medium ${TONES[meta.tone].ink}`}>
            {meta.label}
          </p>
          <p className={`${textSize} text-black/60`}>{meta.shortDescription}</p>
        </div>
      ))}
    </div>
  );
};

type InviteEntryRowProps = {
  email: string;
  role: MembershipRole;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: MembershipRole) => void;
  onAdd: () => void;
  canAdd: boolean;
  addLabel?: string;
  isSubmitting?: boolean;
  size?: FieldSize;
};

// The email + role + add row. Controlled, so the create-workspace wizard can
// batch into local state while the Onboard modal fires a mutation per add. The
// modal passes size="sm" so its fields match the rest of the modal.
export const InviteEntryRow = ({
  email,
  role,
  onEmailChange,
  onRoleChange,
  onAdd,
  canAdd,
  addLabel = "Add",
  isSubmitting = false,
  size = "md",
}: InviteEntryRowProps) => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
    <TextInputField
      label="Invite Users"
      value={email}
      type="email"
      size={size}
      onChange={(event) => onEmailChange(event.target.value)}
      placeholder="teammate@example.com"
    />
    <SelectField
      label="Assign Role"
      value={role}
      onChange={onRoleChange}
      options={workspaceRoleOptions}
      size={size}
      className="sm:self-end"
    />
    <Button
      text={isSubmitting ? "Sending" : addLabel}
      style="secondary"
      onClick={onAdd}
      disabled={!canAdd || isSubmitting}
      minWidth="sm"
      size={size}
    />
  </div>
);

type InvitePendingRowProps = {
  email: string;
  role: MembershipRole;
  onRemove?: () => void;
  isRemoving?: boolean;
  size?: FieldSize;
};

// One row in a list of pending invites — email + role badge + optional remove.
export const InvitePendingRow = ({
  email,
  role,
  onRemove,
  isRemoving = false,
  size = "md",
}: InvitePendingRowProps) => (
  <div
    className={`flex items-center justify-between rounded-xl bg-white/50 border border-black/10 text-sm ${
      size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2"
    }`}
  >
    <span className="truncate">{email}</span>
    <div className="flex shrink-0 items-center gap-2">
      <WorkspaceRoleBadge role={role} />
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${email}`}
          title={`Remove ${email}`}
          disabled={isRemoving}
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          onClick={onRemove}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);
