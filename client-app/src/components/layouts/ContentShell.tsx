import { PanelLeftOpen } from "lucide-react";
import { type ReactNode, useContext, useEffect, useRef } from "react";
import useWindowWidthCategory from "#/hooks/useWindowWidthCategory";

// context
import { MenuContext } from "#/context/MenuContext";

interface ContentShellProps {
  children: ReactNode;
  persistLoadingHeight?: boolean;
}

const contentShellLoadingHeightStorageKeyPrefix =
  "lawstruct.contentShell.loadingHeight";
const getContentShellLoadingHeightStorageKey = (windowWidthCategory: string) =>
  `${contentShellLoadingHeightStorageKeyPrefix}.${windowWidthCategory}`;

const ContentShell = ({
  children,
  persistLoadingHeight = true,
}: ContentShellProps) => {
  const { setMenuOpen } = useContext(MenuContext);
  const windowWidthCategory = useWindowWidthCategory();
  const containerForLoadingHeightRef = useRef<HTMLDivElement>(null);
  const lastStoredLoadingHeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (!persistLoadingHeight) {
      return;
    }

    const container = containerForLoadingHeightRef.current;

    if (!container) {
      return;
    }

    let measurementAnimationFrame: number | null = null;
    lastStoredLoadingHeightRef.current = null;

    const writeLoadingHeight = () => {
      measurementAnimationFrame = null;

      const containerStyle = window.getComputedStyle(container);
      const paddingTop = Number.parseFloat(containerStyle.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(containerStyle.paddingBottom) || 0;
      const height = Math.ceil(
        container.getBoundingClientRect().height - paddingTop - paddingBottom,
      );

      if (!Number.isFinite(height) || height <= 0) {
        return;
      }

      if (lastStoredLoadingHeightRef.current === height) {
        return;
      }

      lastStoredLoadingHeightRef.current = height;

      try {
        window.sessionStorage.setItem(
          getContentShellLoadingHeightStorageKey(windowWidthCategory),
          String(height),
        );
      } catch {
        // Session storage is only used to smooth route-loading layout.
      }
    };

    const scheduleLoadingHeightWrite = () => {
      if (measurementAnimationFrame !== null) {
        return;
      }

      measurementAnimationFrame =
        window.requestAnimationFrame(writeLoadingHeight);
    };

    scheduleLoadingHeightWrite();
    window.addEventListener("resize", scheduleLoadingHeightWrite);
    window.addEventListener("load", scheduleLoadingHeightWrite);

    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(scheduleLoadingHeightWrite)
        : null;

    resizeObserver?.observe(container);

    return () => {
      window.removeEventListener("resize", scheduleLoadingHeightWrite);
      window.removeEventListener("load", scheduleLoadingHeightWrite);
      resizeObserver?.disconnect();

      if (measurementAnimationFrame !== null) {
        window.cancelAnimationFrame(measurementAnimationFrame);
      }
    };
  }, [persistLoadingHeight, windowWidthCategory]);

  return (
    <div className="relative min-w-0 flex-1 flex justify-center lg:block h-max lg:rounded-2xl bg-white/40 backdrop-blur-sm lg:border border-black/15 lg:shadow-md">
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
      <div
        ref={containerForLoadingHeightRef}
        className="w-full pt-16 sm:pt-14 pb-6 md:pt-5 md:pb-5 lg:pb-4 lg:pt-4 px-6 sm:px-12 md:px-4 min-h-dvh lg:min-h-auto"
      >
        {children}
      </div>
    </div>
  );
};

export default ContentShell;
