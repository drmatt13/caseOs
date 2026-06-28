import { useContext, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MailX, XIcon } from "lucide-react";

import Button from "#/components/ui/Button";
import WorkspaceRoleBadge from "#/components/ui/WorkspaceRoleBadge";
import { AppModalContext } from "#/context/AppModalContext";
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useMyInvitationsQuery,
} from "#/api/invitations/hooks";

const MyInvitationsModal = () => {
  const { requestCloseModal } = useContext(AppModalContext);
  const navigate = useNavigate();
  const { data: invitations, isPending, error } = useMyInvitationsQuery();
  const acceptMutation = useAcceptInvitationMutation();
  const declineMutation = useDeclineInvitationMutation();
  // Track which invitation row is mid-action so only its buttons disable.
  const [activeInvitationId, setActiveInvitationId] = useState<string | null>(
    null,
  );

  const isBusy = acceptMutation.isPending || declineMutation.isPending;

  const handleAccept = async (invitationId: string) => {
    setActiveInvitationId(invitationId);

    try {
      const result = await acceptMutation.mutateAsync(invitationId);
      requestCloseModal();
      await navigate({
        to: "/workspaces/$workspaceId",
        params: { workspaceId: result.workspaceId },
      });
    } catch {
      setActiveInvitationId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setActiveInvitationId(invitationId);

    try {
      await declineMutation.mutateAsync(invitationId);
    } finally {
      setActiveInvitationId(null);
    }
  };

  return (
    <div className="w-lg max-w-[calc(100vw-3rem)] p-1 text-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-lg">Workspace Invitations</p>
          <p className="mt-0.5 text-gray-600">
            Workspaces you've been invited to join.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close modal"
          onClick={requestCloseModal}
          className="cursor-pointer rounded-lg p-1.5 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
        >
          <XIcon className="h-5 w-5 text-black" />
        </button>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          <div className="h-16 rounded-xl bg-black/5" />
          <div className="h-16 rounded-xl bg-black/5" />
        </div>
      ) : error ? (
        <p className="text-gray-600">Could not load your invitations.</p>
      ) : !invitations || invitations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/15 px-4 py-10 text-center">
          <MailX className="h-6 w-6 text-black/40" />
          <p className="text-black/60">You have no pending invitations.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invitations.map((invitation) => {
            const rowBusy = isBusy && activeInvitationId === invitation.id;

            return (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {invitation.workspaceName}
                    </p>
                    <WorkspaceRoleBadge role={invitation.role} />
                  </div>
                  {invitation.invitedByName && (
                    <p className="mt-0.5 truncate text-sm text-black/55">
                      Invited by {invitation.invitedByName}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    style="ghost"
                    size="sm"
                    text="Decline"
                    disabled={isBusy}
                    onClick={() => {
                      void handleDecline(invitation.id);
                    }}
                  />
                  <Button
                    style="primary"
                    size="sm"
                    text={rowBusy && acceptMutation.isPending ? "Joining" : "Accept"}
                    disabled={isBusy}
                    onClick={() => {
                      void handleAccept(invitation.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyInvitationsModal;
