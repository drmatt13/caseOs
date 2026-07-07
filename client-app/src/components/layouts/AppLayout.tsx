import { type ReactNode } from "react";
import PageBackgroundLayout from "./PageBackgroundLayout";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <PageBackgroundLayout className="relative flex flex-row lg:gap-6 lg:pt-14 lg:pb-7 lg:px-8 lg:w-5xl 2xl:w-6xl 3xl:w-7xl lg:max-w-full">
        {children}
      </PageBackgroundLayout>
    </>
  );
};

export default AppLayout;
