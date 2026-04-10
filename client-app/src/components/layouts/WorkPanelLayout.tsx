import type { ReactNode } from "react";

interface WorkPanelLayoutProps {
  children: ReactNode;
}

const WorkPanelLayout = ({ children }: WorkPanelLayoutProps) => {
  return (
    <div className="flex-1 min-w-0 max-w-full py-4 px-4 /border /h-[80vh] h-max bg-white rounded-2xl border border-black/15 shadow-md">
      {children}
    </div>
  );
};

export default WorkPanelLayout;
