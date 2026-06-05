import { Mail, MessageSquare, Settings } from "lucide-react";

interface ContentHeaderBarProps {
  showWorkspaceSettings?: boolean;
}

const headerActionClassName =
  "text-sm p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100";

const ContentHeaderBar = ({
  showWorkspaceSettings = false,
}: ContentHeaderBarProps) => (
  <div className="flex flex-row justify-between text-sm px-4 sm:px-0 border-b border-black/15 pb-3">
    <div className="flex gap-1.5">
      <button type="button" className={headerActionClassName}>
        <Mail className="w-3.5 h-3.5" />
        <span>Invites</span>
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

export default ContentHeaderBar;
