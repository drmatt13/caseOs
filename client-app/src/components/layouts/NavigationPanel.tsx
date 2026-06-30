import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  // useState,
  useContext,
} from "react";
import AppLogo from "#/components/layouts/AppLogo";
import useWindowWidthCategory from "#/hooks/useWindowWidthCategory";
import {
  getAnchoredScrollTop,
  getNavigationPanelLoadingHeightStorageKey,
  getPanelOffsetRem,
  getTransitionDurationMs,
  initialPanelOffsetRem,
  scrollDownTransitionTimingFunction,
  scrollUpSlowTransitionDurationMs,
  scrollUpTransitionTimingFunction,
} from "#/components/layouts/navigationPanelMetrics";

// context
import { MenuContext } from "#/context/MenuContext";
import { XIcon } from "lucide-react";

interface NavigationPanelProps {
  children: ReactNode;
  // Key of the currently-selected nav item (e.g. the active workspace view). When
  // it changes, the panel keeps the matching `[data-nav-item]` row visible as it
  // collapses on scroll-to-top. Optional — omit it and the behavior is a no-op.
  activeItemKey?: string;
}

const NavigationPanel = ({ children, activeItemKey }: NavigationPanelProps) => {
  const { menuOpen, setMenuOpen } = useContext(MenuContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerForLoadingHeightRef = useRef<HTMLDivElement>(null);
  const windowWidthCategory = useWindowWidthCategory();
  const previousWindowWidthCategoryRef = useRef(windowWidthCategory);
  const animationFrameRef = useRef<number | null>(null);
  const anchorFrameRef = useRef<number | null>(null);
  const previousActiveItemKeyRef = useRef(activeItemKey);
  const lastWrittenScrollTopRef = useRef<number | null>(null);
  const lastStoredLoadingHeightRef = useRef<number | null>(null);
  const previousScrollSampleRef = useRef({
    scrollY: 0,
    time: 0,
  });

  const updatePanelHeightOffset = useCallback((animate: boolean) => {
    const panel = panelRef.current;

    if (!panel) return;

    // The main content column is the panel wrapper's sibling in the flex row.
    // We want the scroll the body has on its own, independent of the sticky
    // panel's height (which feeds back into document.scrollHeight). So measure
    // the content column's bottom in document space plus the frame's bottom
    // padding — that's where the page ends regardless of how tall the panel is —
    // and see how far it runs past the viewport. Using the content column (not
    // document.scrollHeight) is what keeps the panel's own growth out of the gate.
    const contentColumn = panel.parentElement
      ?.nextElementSibling as HTMLElement | null;
    const frame = panel.parentElement?.parentElement ?? null;
    const framePaddingBottom = frame
      ? Number.parseFloat(window.getComputedStyle(frame).paddingBottom) || 0
      : 0;
    const bodyContentOverflowPx = contentColumn
      ? contentColumn.getBoundingClientRect().bottom +
        window.scrollY +
        framePaddingBottom -
        window.innerHeight
      : document.documentElement.scrollHeight - window.innerHeight;

    const panelOffsetRem = getPanelOffsetRem(bodyContentOverflowPx);

    if (!animate) {
      panel.style.setProperty(
        "--left-panel-height-offset",
        `${panelOffsetRem}rem`,
      );
      panel.style.setProperty("--left-panel-transition-property", "none");
      previousScrollSampleRef.current = {
        scrollY: window.scrollY,
        time: performance.now(),
      };
      return;
    }

    const now = performance.now();
    const previousScrollSample = previousScrollSampleRef.current;
    const elapsedMs =
      previousScrollSample.time === 0
        ? 1
        : Math.max(1, now - previousScrollSample.time);
    const scrollDistancePx =
      previousScrollSample.time === 0
        ? 0
        : Math.abs(window.scrollY - previousScrollSample.scrollY);
    const scrollDirection =
      window.scrollY > previousScrollSample.scrollY ? "down" : "up";
    const scrollVelocityPxPerMs = scrollDistancePx / elapsedMs;
    const transitionDurationMs = getTransitionDurationMs(
      scrollVelocityPxPerMs,
      scrollDirection,
    );
    // const velocityProgress = getScrollVelocityProgress(scrollVelocityPxPerMs);
    // const scrollSpeedLabel =
    //   scrollVelocityPxPerMs <= slowScrollVelocityPxPerMs
    //     ? "slow"
    //     : scrollVelocityPxPerMs >= fastScrollVelocityPxPerMs
    //       ? "fast"
    //       : "middle";

    // if (shouldLogScrollVelocity && scrollDistancePx > 0) {
    //   console.log("[left-panel-scroll]", {
    //     speed: scrollSpeedLabel,
    //     direction: scrollDirection,
    //     velocityPxPerMs: Number(scrollVelocityPxPerMs.toFixed(2)),
    //     progress: Number(velocityProgress.toFixed(2)),
    //     transitionDurationMs: Number(transitionDurationMs.toFixed(2)),
    //   });
    // }

    panel.style.setProperty(
      "--left-panel-height-offset",
      `${panelOffsetRem}rem`,
    );
    panel.style.setProperty("--left-panel-transition-property", "max-height");
    panel.style.setProperty(
      "--left-panel-transition-duration",
      `${transitionDurationMs}ms`,
    );
    panel.style.setProperty(
      "--left-panel-transition-timing-function",
      scrollDirection === "down"
        ? scrollDownTransitionTimingFunction
        : scrollUpTransitionTimingFunction,
    );
    previousScrollSampleRef.current = {
      scrollY: window.scrollY,
      time: now,
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updatePanelHeightOffset(true);
    });
  }, [updatePanelHeightOffset]);

  const stopAnchorLoop = useCallback(() => {
    if (anchorFrameRef.current !== null) {
      window.cancelAnimationFrame(anchorFrameRef.current);
      anchorFrameRef.current = null;
    }
    lastWrittenScrollTopRef.current = null;
  }, []);

  useEffect(() => {
    if (windowWidthCategory !== "large") {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      stopAnchorLoop();

      return;
    }

    const handleResize = () => {
      updatePanelHeightOffset(false);
    };

    updatePanelHeightOffset(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    // Content can grow/shrink after mount (e.g. async data) without a scroll or
    // resize event, which would change whether the body overflows. Watch the
    // content column so the expansion gate stays in sync with it.
    const contentColumn = panelRef.current?.parentElement
      ?.nextElementSibling as HTMLElement | null;
    const contentResizeObserver =
      contentColumn && "ResizeObserver" in window
        ? new ResizeObserver(handleResize)
        : null;

    contentResizeObserver?.observe(contentColumn as HTMLElement);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      contentResizeObserver?.disconnect();

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      stopAnchorLoop();
    };
  }, [
    handleScroll,
    stopAnchorLoop,
    updatePanelHeightOffset,
    windowWidthCategory,
  ]);

  // When the selected nav item changes, the route scrolls the body back to top,
  // which collapses this panel from the bottom and shrinks its inner scroll
  // viewport. Keep the just-selected row visible through that collapse: capture
  // its geometry now (before the collapse starts), then drive the inner scrollTop
  // each frame to hold it in view ("anchor-and-lift"). A layout effect on a child
  // runs before the parent route's passive scroll-to-top effect, so this capture
  // happens while the panel is still expanded and the row still on screen.
  useLayoutEffect(() => {
    const previousActiveItemKey = previousActiveItemKeyRef.current;
    previousActiveItemKeyRef.current = activeItemKey;

    // Only act on a genuine selection change, only where the collapse exists
    // (large), and only when the body is actually scrolled (else nothing
    // collapses — covers initial mount and selecting while already at top).
    if (
      activeItemKey == null ||
      activeItemKey === previousActiveItemKey ||
      windowWidthCategory !== "large" ||
      window.scrollY <= 0
    ) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const item = container.querySelector<HTMLElement>(
      `[data-nav-item="${CSS.escape(activeItemKey)}"]`,
    );
    if (!item) return;

    // Capture once — the menu doesn't reflow during the collapse, only the
    // viewport height changes, so these stay valid for the whole animation.
    const containerTop = container.getBoundingClientRect().top;
    const itemRect = item.getBoundingClientRect();
    const yRelInitial = itemRect.top - containerTop; // distance below viewport top
    const itemTopInContent = yRelInitial + container.scrollTop; // in scroll content
    const itemHeight = itemRect.height;

    const topMargin = 8;
    const bottomMargin = 12;
    const maxDurationMs = 1200;
    const startTime = performance.now();

    let previousViewportH = -1;
    let stableFrames = 0;

    stopAnchorLoop();

    const step = () => {
      if (!container.isConnected) {
        stopAnchorLoop();
        return;
      }

      // Yield to the user: if scrollTop moved away from what we last wrote, a
      // wheel/drag/keyboard interrupted us — stop fighting them.
      if (
        lastWrittenScrollTopRef.current !== null &&
        Math.abs(container.scrollTop - lastWrittenScrollTopRef.current) > 2
      ) {
        stopAnchorLoop();
        return;
      }

      const viewportH = container.clientHeight;
      const maxScroll = container.scrollHeight - viewportH;

      container.scrollTop = getAnchoredScrollTop({
        itemTopInContent,
        itemHeight,
        yRelInitial,
        viewportH,
        maxScroll,
        topMargin,
        bottomMargin,
      });
      lastWrittenScrollTopRef.current = container.scrollTop;

      // The panel's max-height keeps transitioning for a few frames after the
      // body reaches the top, so wait for the height to settle, not just scrollY.
      stableFrames =
        Math.abs(viewportH - previousViewportH) <= 1 ? stableFrames + 1 : 0;
      previousViewportH = viewportH;

      const settled = window.scrollY === 0 && stableFrames >= 2;
      if (settled || performance.now() - startTime > maxDurationMs) {
        stopAnchorLoop();
        return;
      }

      anchorFrameRef.current = window.requestAnimationFrame(step);
    };

    anchorFrameRef.current = window.requestAnimationFrame(step);

    return stopAnchorLoop;
  }, [activeItemKey, stopAnchorLoop, windowWidthCategory]);

  useEffect(() => {
    const container = containerForLoadingHeightRef.current;

    if (!container) {
      return;
    }

    let measurementAnimationFrame: number | null = null;
    lastStoredLoadingHeightRef.current = null;

    const writeLoadingHeight = () => {
      measurementAnimationFrame = null;

      const height = Math.ceil(container.getBoundingClientRect().height);

      if (!Number.isFinite(height) || height <= 0) {
        return;
      }

      if (lastStoredLoadingHeightRef.current === height) {
        return;
      }

      lastStoredLoadingHeightRef.current = height;

      try {
        window.sessionStorage.setItem(
          getNavigationPanelLoadingHeightStorageKey(windowWidthCategory),
          String(height),
        );
      } catch {
        // Session storage is an enhancement for smoother route transitions.
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
  }, [windowWidthCategory]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;

      if (!panel || panel.contains(event.target as Node)) return;

      setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, {
        capture: true,
      });
    };
  }, [menuOpen, setMenuOpen]);

  const panelStyle = {
    "--left-panel-height-offset": `${initialPanelOffsetRem}rem`,
    "--left-panel-transition-property": "none",
    "--left-panel-transition-duration": `${scrollUpSlowTransitionDurationMs}ms`,
    "--left-panel-transition-timing-function": scrollUpTransitionTimingFunction,
    maxHeight: "calc(100dvh - var(--left-panel-height-offset))",
    transitionProperty: "var(--left-panel-transition-property)",
    transitionDuration: "var(--left-panel-transition-duration)",
    transitionTimingFunction: "var(--left-panel-transition-timing-function)",
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
      <div
        ref={panelRef}
        style={windowWidthCategory === "large" ? panelStyle : undefined}
        className="sticky top-0 z-10 max-h-dvh lg:top-7 h-dvh lg:h-max lg:rounded-2xl pl-2 lg:pl-0 lg:border lg:border-black/22 lg:shadow-md lg:overflow-hidden"
      >
        {menuOpen && (
          <div className="pointer-events-none absolute right-0 translate-x-full w-[200vw] h-full" />
        )}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[inherit] overflow-x-hidden"
        >
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
            ref={containerForLoadingHeightRef}
            className="font-serif text-sm lg:bg-white/40 lg:backdrop-blur-sm pt-5 pb-4 pl-2 pr-4 lg:px-4 flex flex-col gap-2"
          >
            {windowWidthCategory !== "large" && (
              <div className="mb-2">
                <AppLogo NavigationPanel={true} />
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;
