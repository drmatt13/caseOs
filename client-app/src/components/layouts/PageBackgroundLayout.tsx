import type { ReactNode } from "react";

interface PageBackgroundLayoutProps {
  children: ReactNode;
  className?: string;
}

const PageBackgroundLayout = ({
  children,
  className = "",
}: PageBackgroundLayoutProps) => {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div className="/hidden block lg:block pointer-events-none fixed inset-x-0 top-0 z-0 h-svh overflow-hidden">
        <img
          src="/65a6bf61-3b46-42c2-bcba-d596f9898e90.webp"
          alt="app_background"
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 min-h-64 min-w-340 w-full h-svh object-cover object-top-left"
        />
      </div>
      <div className={`relative z-10 mx-auto font-sans w-full ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageBackgroundLayout;
