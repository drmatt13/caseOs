import { XIcon } from "lucide-react";
import type { MembershipRole } from "#/api/generated/graphql";
import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import {
  SelectField,
  TextInputField,
} from "#/components/features/create-workspace/fields";
import {
  ASSIGNABLE_ROLE_META,
  workspaceRoleOptions,
} from "#/lib/workspaceRoles";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A reference legend describing what each assignable role can do. Shared by the
// create-workspace wizard and the Onboard Members modal so the descriptions stay
// in one place (WORKSPACE_ROLE_META).
export const RoleDescriptions = () => (
  <div className="grid gap-2 rounded-xl border border-black/10 bg-white/40 p-3 sm:grid-cols-2">
    {ASSIGNABLE_ROLE_META.map((meta) => (
      <div key={meta.value} className="flex flex-col gap-1">
        <WorkspaceRoleBadge role={meta.value} />
        <p className="text-sm text-black/60">{meta.shortDescription}</p>
      </div>
    ))}
  </div>
);

type InviteEntryRowProps = {
  email: string;
  role: MembershipRole;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: MembershipRole) => void;
  onAdd: () => void;
  canAdd: boolean;
  addLabel?: string;
  isSubmitting?: boolean;
};

// The email + role + add row. Controlled, so the create-workspace wizard can
// batch into local state while the Onboard modal fires a mutation per add.
export const InviteEntryRow = ({
  email,
  role,
  onEmailChange,
  onRoleChange,
  onAdd,
  canAdd,
  addLabel = "Add",
  isSubmitting = false,
}: InviteEntryRowProps) => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
    <TextInputField
      label="Invite Users"
      value={email}
      type="email"
      onChange={(event) => onEmailChange(event.target.value)}
      placeholder="teammate@example.com"
    />
    <SelectField
      label="Assign Role"
      value={role}
      onChange={onRoleChange}
      options={workspaceRoleOptions}
      className="sm:self-end"
    />
    <Button
      text={isSubmitting ? "Sending" : addLabel}
      style="secondary"
      onClick={onAdd}
      disabled={!canAdd || isSubmitting}
      minWidth="sm"
    />
  </div>
);

type InvitePendingRowProps = {
  email: string;
  role: MembershipRole;
  onRemove?: () => void;
};

// One row in a list of pending invites — email + role badge + optional remove.
export const InvitePendingRow = ({
  email,
  role,
  onRemove,
}: InvitePendingRowProps) => (
  <div className="flex items-center justify-between rounded-xl bg-white/50 border border-black/10 px-3 py-2 text-sm">
    <span className="truncate">{email}</span>
    <div className="flex shrink-0 items-center gap-2">
      <WorkspaceRoleBadge role={role} />
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${email}`}
          title={`Remove ${email}`}
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
          onClick={onRemove}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);
