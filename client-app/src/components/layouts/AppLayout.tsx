import { type ReactNode, useEffect } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  useEffect(() => {
    const previousOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = "scroll";

    return () => {
      document.body.style.overflowY = previousOverflowY;
    };
  }, []);

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden">
      <div className="/absolute fixed inset-x-0 top-0 -z-10 h-svh overflow-hidden /bg-black">
        <img
          // src="/3bbac7c2-1835-48be-8a6d-d9788a25e9aa.png"
          src="/2c45b176-a993-4c95-8ee6-01f684898607.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 /h-[45svh] min-h-56 /max-h-128 w-full object-cover object-top mask-[linear-gradient(to_bottom,black_0%,rgb(0_0_0/0.25)_25%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,rgb(0_0_0/0.25)_25%,transparent_100%)]"
        />
      </div>
      <div className="mx-auto /h-dvh flex flex-row gap-6 pb-16 px-8 font-sans max-w-4xl w-full pt-16 z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
