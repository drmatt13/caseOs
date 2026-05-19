import type { ReactNode } from "react";
import LoginLeftMenu from "../menus/LoginLeftMenu";
import PageBackgroundLayout from "./PageBackgroundLayout";

interface LoginLayoutProps {
  children: ReactNode;
}

const LoginLayout = ({ children }: LoginLayoutProps) => {
  return (
    <PageBackgroundLayout className="min-h-dvh flex flex-col gap-6 pb-10 /px-8 pt-22">
      <div className="flex gap-6">
        <LoginLeftMenu />
        {children}
      </div>
    </PageBackgroundLayout>
  );
};

export default LoginLayout;
