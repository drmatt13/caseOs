import { useContext } from "react";
import { Mail, MessageSquare, Settings } from "lucide-react";
import { AppModalContext } from "#/context/AppModalContext";
import { useMyInvitationsQuery } from "#/api/invitations/hooks";

interface ContentHeaderBarProps {
  showWorkspaceSettings?: boolean;
}

const headerActionClassName =
  "relative text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100";

const ContentHeaderBar = ({
  showWorkspaceSettings = false,
}: ContentHeaderBarProps) => {
  const { setModal } = useContext(AppModalContext);
  const { data: invitations } = useMyInvitationsQuery();
  const inviteCount = invitations?.length ?? 0;

  return (
    <div className="flex flex-row justify-between text-sm px-4 sm:px-0 border-b border-black/20 pb-3">
      <div className="flex gap-1.5">
        <button
          type="button"
          className={headerActionClassName}
          onClick={() => setModal("my invitations")}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Invites</span>
          {inviteCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#282828] px-1 text-xs font-semibold text-white">
              {inviteCount}
            </span>
          )}
        </button>
        <button type="button" className={headerActionClassName}>
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messages</span>
        </button>
      </div>
      {showWorkspaceSettings && (
        <button
          type="button"
          aria-label="Workspace settings"
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
        >
          <Settings className="w-5 h-5 text-black" />
        </button>
      )}
    </div>
  );
};

export default ContentHeaderBar;
