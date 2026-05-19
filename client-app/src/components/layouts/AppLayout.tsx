import { type ReactNode } from "react";
import PageBackgroundLayout from "./PageBackgroundLayout";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <PageBackgroundLayout className="flex flex-row /max-w-250 px-2 lg:gap-6 lg:pt-14 lg:pb-7 lg:px-8">
      {children}
    </PageBackgroundLayout>
  );
};

export default AppLayout;
