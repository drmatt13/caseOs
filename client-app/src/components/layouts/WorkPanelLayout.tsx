import { PanelLeftOpen } from "lucide-react";
import { type ReactNode, useContext } from "react";

// context
import { MenuContext } from "#/context/MenuContext";

interface WorkPanelLayoutProps {
  children: ReactNode;
}

const WorkPanelLayout = ({ children }: WorkPanelLayoutProps) => {
  const { setMenuOpen } = useContext(MenuContext);

  return (
    <div className="relative min-w-0 flex-1 flex justify-center lg:block h-max lg:rounded-2xl bg-white/20 lg:backdrop-blur-sm lg:bg-white/40 backdrop-blur-sm lg:border border-black/15 lg:shadow-md">
      <div className="md:hidden absolute top-4 left-4">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
        >
          <PanelLeftOpen className="w-5 h-5 text-black" />
        </button>
      </div>
      <div className="w-full md:max-w-160 lg:max-w-full! pt-16 sm:pt-14 pb-6 md:pt-5 md:pb-5 lg:pb-4 lg:pt-4 px-4 sm:px-12 md:px-4 min-h-dvh lg:min-h-auto">
        {children}
      </div>
    </div>
  );
};

export default WorkPanelLayout;
