import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-svh overflow-hidden">
        <img
          // src="/3bbac7c2-1835-48be-8a6d-d9788a25e9aa.png"
          src="/65a6bf61-3b46-42c2-bcba-d596f9898e90.png"
          alt=""
          aria-hidden="true"
          // className="pointer-events-none absolute inset-x-0 top-0 /h-[45svh] min-h-56 /max-h-128 w-full object-cover object-top mask-[linear-gradient(to_bottom,black_0%,rgb(0_0_0/0.25)_25%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,rgb(0_0_0/0.25)_25%,transparent_100%)]"
          className="pointer-events-none absolute inset-x-0 top-0 /h-[45svh] min-h-56 /max-h-128 w-full h-svh object-cover"
        />
      </div>
      <div className="relative z-10 mx-auto /h-dvh flex flex-row gap-6 pb-16 px-8 font-sans max-w-4xl w-full pt-16">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
