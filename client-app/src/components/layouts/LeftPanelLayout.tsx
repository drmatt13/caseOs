import type { ReactNode } from "react";

interface LeftPanelLayoutProps {
  children: ReactNode;
}

const LeftPanelLayout = ({ children }: LeftPanelLayoutProps) => {
  return (
    <div className="w-64 flex flex-col /border gap-4">
      <div className="flex flex-col gap-1 h-14">
        <p className="text-3xl /font-noto-serif-jp font-bj-cree">CaseOS</p>
        <p className="text-xs font-inconsolata">
          AI-Powered Case Intelligence Workspace
        </p>
      </div>
      <div className="sticky top-4 h-max max-h-[calc(100dvh-12.60rem)] rounded-2xl border border-black/15 shadow-md overflow-y-auto">
        <div className="font-serif text-xs bg-white pt-6 pb-4 px-4 flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LeftPanelLayout;
