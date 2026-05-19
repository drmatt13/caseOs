import type { ReactNode } from "react";

interface WorkPanelLayoutProps {
  children: ReactNode;
}

const WorkPanelLayout = ({ children }: WorkPanelLayoutProps) => {
  return (
    <div className="min-w-0 flex-1 flex justify-center lg:block h-max lg:rounded-2xl bg-white/20 lg:backdrop-blur-sm lg:bg-white/40 backdrop-blur-sm lg:border border-black/15 lg:shadow-md">
      <div className="w-full max-w-160 lg:max-w-full pt-5 pb-5 lg:pb-4 lg:py-4 px-4 min-h-dvh lg:min-h-auto">
        {children}
      </div>
    </div>
  );
};

export default WorkPanelLayout;
