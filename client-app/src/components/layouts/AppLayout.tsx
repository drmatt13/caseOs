import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col gap-6 pb-16 px-8 font-sans max-w-4xl w-full pt-16">
      {children}
    </div>
  );
};

export default AppLayout;
