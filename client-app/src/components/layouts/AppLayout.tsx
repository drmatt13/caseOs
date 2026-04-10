import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return <div className="flex gap-6 pb-16 px-8 font-sans">{children}</div>;
};

export default AppLayout;
