import { type ReactNode } from "react";
import PageBackgroundLayout from "./PageBackgroundLayout";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <PageBackgroundLayout className="relative flex flex-row lg:gap-6 lg:pt-14 lg:pb-7 lg:px-8 max-w-5xl">
      {children}
    </PageBackgroundLayout>
  );
};

export default AppLayout;
