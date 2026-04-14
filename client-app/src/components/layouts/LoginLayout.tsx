import type { ReactNode } from "react";
import LoginLeftMenu from "../menus/LoginLeftMenu";

interface LoginLayoutProps {
  children: ReactNode;
}

const LoginLayout = ({ children }: LoginLayoutProps) => {
  return (
    <>
      <div className="mx-auto h-dvh flex flex-col gap-6 pb-16 /px-8 font-sans max-w-5xl w-full pt-24">
        <div className="flex gap-6">
          <LoginLeftMenu />
          {children}
        </div>
      </div>
    </>
  );
};

export default LoginLayout;
