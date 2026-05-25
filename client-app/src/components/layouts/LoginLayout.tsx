import type { ReactNode } from "react";
import LoginLeftMenu from "../menus/LoginLeftMenu";
import PageBackgroundLayout from "./PageBackgroundLayout";

interface LoginLayoutProps {
  children: ReactNode;
}

const LoginLayout = ({ children }: LoginLayoutProps) => {
  return (
    <PageBackgroundLayout className="min-h-dvh gap-6 pb-10 pt-20 px-8 xl:px-0 max-w-max xl:max-w-5xl">
      <div className="flex gap-4">
        <LoginLeftMenu />
        {children}
      </div>
    </PageBackgroundLayout>
  );
};

export default LoginLayout;
