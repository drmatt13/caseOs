import { type CSSProperties, useContext, useEffect, useRef } from "react";
import AppLogo from "#/components/AppLogo";
import { XIcon } from "lucide-react";

// context
import { MenuContext } from "#/context/MenuContext";

import useWindowWidthCategory from "#/hooks/useWindowWidthCategory";

const navigationPanelLoadingHeightStorageKeyPrefix =
  "lawstruct.navigationPanel.loadingHeight";
const getNavigationPanelLoadingHeightStorageKey = (
  windowWidthCategory: string,
) => `${navigationPanelLoadingHeightStorageKeyPrefix}.${windowWidthCategory}`;

const readNavigationPanelLoadingHeight = (windowWidthCategory: string) => {
  try {
    const storedHeight = window.sessionStorage.getItem(
      getNavigationPanelLoadingHeightStorageKey(windowWidthCategory),
    );
    const parsedHeight = Number(storedHeight);

    return Number.isFinite(parsedHeight) && parsedHeight > 0
      ? parsedHeight
      : null;
  } catch {
    return null;
  }
};

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-black/5 ${className}`} />
);

const NavigationPanel = () => {
  const windowWidthCategory = useWindowWidthCategory();
  const { menuOpen, setMenuOpen } = useContext(MenuContext);
  const previousWindowWidthCategoryRef = useRef(windowWidthCategory);
  const storedLoadingHeight =
    readNavigationPanelLoadingHeight(windowWidthCategory);
  const loadingHeightStyle = {
    maxHeight: "calc(100dvh - 11.15rem)",
    height:
      storedLoadingHeight === null
        ? "calc(50dvh)"
        : `${storedLoadingHeight - 47.5}px`,
  } as CSSProperties;

  const shouldAnimateSmallMenu =
    windowWidthCategory === "small" &&
    previousWindowWidthCategoryRef.current === "small";

  const smallMenuPositionClassName =
    windowWidthCategory === "small"
      ? [
          "fixed top-0 left-0 shadow",
          shouldAnimateSmallMenu ? "transition-transform" : "",
          !menuOpen ? "-translate-x-full" : "",
          shouldAnimateSmallMenu
            ? !menuOpen
              ? "ease-out duration-300"
              : "ease-in duration-150"
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "md:relative";

  useEffect(() => {
    if (
      previousWindowWidthCategoryRef.current === "small" &&
      windowWidthCategory === "medium"
    ) {
      setMenuOpen(false);
    }

    previousWindowWidthCategoryRef.current = windowWidthCategory;
  }, [setMenuOpen, windowWidthCategory]);

  return (
    <div
      className={`${smallMenuPositionClassName} z-[1000] w-64 min-w-64 lg:flex flex-col gap-2`}
    >
      {windowWidthCategory !== "large" && (
        <>
          <div className="pointer-events-none fixed left-0 top-0 z-0 w-64 h-screen bg-neutral-400/40 backdrop-blur-lg lg:bg-transparent" />
        </>
      )}
      {windowWidthCategory === "large" && <AppLogo NavigationPanel={true} />}
      <div className="sticky top-0 z-10 max-h-dvh lg:top-7 h-dvh lg:h-max lg:rounded-2xl pl-2 lg:pl-0 lg:border lg:border-black/15 lg:shadow-md lg:overflow-hidden">
        {menuOpen && (
          <div className="pointer-events-none absolute right-0 translate-x-full w-[200vw] h-full" />
        )}
        <div className="overflow-y-hidden max-h-[inherit] overflow-x-hidden">
          {windowWidthCategory === "small" && (
            <div className="h-0 flex justify-end pointer-events-none">
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="p-1 m-1 cursor-pointer pointer-events-auto"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <div
            style={{}}
            className="font-serif text-sm lg:bg-white/40 lg:backdrop-blur-sm pt-5 pb-4 pl-2 pr-4 lg:px-4 flex flex-col gap-2"
          >
            {windowWidthCategory !== "large" && (
              <div className="mb-2">
                <AppLogo NavigationPanel={true} />
              </div>
            )}

            <div
              style={{
                ...loadingHeightStyle,
              }}
            >
              <div className="flex flex-col gap-3">
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-9 w-4/5" />
                <SkeletonBlock className="h-9 w-full" />
                <SkeletonBlock className="h-9 w-11/12" />
                <div className="mt-3 flex flex-col gap-2">
                  <SkeletonBlock className="h-8 w-full" />
                  <SkeletonBlock className="h-8 w-5/6" />
                  <SkeletonBlock className="h-8 w-11/12" />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <SkeletonBlock className="h-8 w-full" />
                  <SkeletonBlock className="h-8 w-5/6" />
                  <SkeletonBlock className="h-8 w-11/12" />
                  <SkeletonBlock className="h-8 w-5/6" />
                  <SkeletonBlock className="h-8 w-11/12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;
