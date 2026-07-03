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
  routeChangeSlideDurationMs,
  routeChangeSlideTimingFunction,
  scrollDownTransitionTimingFunction,
  scrollUpSlowTransitionDurationMs,
  scrollUpTransitionTimingFunction,
} from "#/components/layouts/navigationPanelMetrics";
// context
import { MenuContext } from "#/context/MenuContext";
import { XIcon } from "lucide-react";

// The sticky panel's viewport top (getBoundingClientRect().top) as last sampled
// while the previous route was scrolled. It bridges across the panel's unmount/
// remount on navigation (each route renders its own NavigationPanel): the next
// mount reads it as the panel's previous on-screen position and slides down
// from there into place. Module scope (not sessionStorage) on purpose — it must
// NOT survive a full reload (a reload has no previous page to be continuous
// with), and it's sampled only while scrolled so a scroll-to-top, including the
// router's own reset on navigation, can never overwrite it with the resting
// position. `null` means "no previous scrolled position to slide from".
let lastScrolledPanelViewportTop: number | null = null;

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
  // Per-mount consume of the previous route's scrolled position (see the slide
  // effect). A ref pair, not locals, so StrictMode's dev-only double invocation
  // of the mount effect reads the same value both times instead of the second
  // run seeing the already-consumed (null) module slot and skipping the slide.
  const slideFromConsumedRef = useRef(false);
  const slideFromTopRef = useRef<number | null>(null);
  const previousScrollSampleRef = useRef({
    scrollY: 0,
    time: 0,
  });

  // A fresh route mounts a fresh NavigationPanel (each route renders its own),
  // and the router resets the body scroll to the top — which would snap this
  // sticky panel from where it sat on the previous page down to its resting
  // position. Instead, start it translated up at the previous page's on-screen
  // position and animate it home. Mount-only (`[]`): it fires on genuine route
  // changes (which remount the panel), not on same-route search-param changes
  // like the case view tabs, whose collapse is handled by the anchor-and-lift
  // effect below. Web Animations API rather than inline transform/transition so
  // it can't clobber the React-managed `--left-panel-*` vars on this element.
  useLayoutEffect(() => {
    // Consume the previous page's pinned position exactly once for this mount,
    // BEFORE any early return below. The module slot must never survive a mount:
    // otherwise a value sampled navigations ago (e.g. carried across a resize
    // past the breakpoint, where the guards below would have skipped clearing
    // it) can resurface and drive a stale slide when navigating back and forth.
    // The consumed value lives in a ref so StrictMode's double-invoked mount
    // effect reuses it rather than re-reading the now-cleared module slot.
    if (!slideFromConsumedRef.current) {
      slideFromConsumedRef.current = true;
      slideFromTopRef.current = lastScrolledPanelViewportTop;
      lastScrolledPanelViewportTop = null;
      // Purge an offset persisted by an earlier version of this slide. It now
      // lives only in memory (above) and is consumed every navigation, so any
      // lingering session-storage entry is just a stale reference — drop it.
      try {
        window.sessionStorage.removeItem("navigationPanelOffsetTop");
      } catch {
        // Session storage is an optional enhancement; ignore if unavailable.
      }
    }
    const fromTop = slideFromTopRef.current;

    const panel = panelRef.current;
    if (!panel) return;
    if (!window.matchMedia("(width >= 72.5rem)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (fromTop === null) return;

    let slideAnimation: Animation | null = null;
    let teardownScrollWatch: (() => void) | null = null;

    const runSlide = () => {
      const restingTop = panel.getBoundingClientRect().top;
      const offsetPx = restingTop - fromTop;
      // <=1px is not a real move (already at rest, or subpixel noise).
      if (offsetPx <= 1) return;

      slideAnimation = panel.animate(
        [
          { transform: `translateY(${-offsetPx}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: routeChangeSlideDurationMs,
          easing: routeChangeSlideTimingFunction,
        },
      );
    };

    if (window.scrollY <= 0) {
      // Scroll already reset: this layout effect runs before paint, so the
      // slide's first frame (translated up) is what the new route paints.
      runSlide();
    } else {
      // Still scrolled: the panel is sticky-glued at the same inset it held on
      // the previous page, so it currently looks continuous. The router resets
      // scroll to the top in a layout effect that runs after this (child) one;
      // catch that reset on its scroll event — dispatched before the next paint
      // — and start the slide there so the panel never paints at rest first. If
      // no reset arrives (scroll-preserving navigation), give up after 600ms.
      const onScrollReset = () => {
        if (window.scrollY > 0) return;
        teardownScrollWatch?.();
        runSlide();
      };
      const timeout = window.setTimeout(() => teardownScrollWatch?.(), 600);
      teardownScrollWatch = () => {
        window.clearTimeout(timeout);
        window.removeEventListener("scroll", onScrollReset);
        teardownScrollWatch = null;
      };
      window.addEventListener("scroll", onScrollReset, { passive: true });
    }

    return () => {
      teardownScrollWatch?.();
      slideAnimation?.cancel();
    };
    // Mount-only by design; see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Record where the sticky panel sits ONLY WHILE it is pinned at its sticky
  // inset — i.e. the user has scrolled far enough to lift it to the top of the
  // viewport — so the next route's mount can slide it down from there (see the
  // slide effect above). Anywhere else — the transition zone on the way up, or
  // resting at scroll top — clears the sample to null so there is nothing to
  // slide from. This is what makes "scroll down, then back up to the top, then
  // navigate" produce no slide: by the time the panel unpins on the way up, the
  // sample is gone. It also means the router's own scroll-to-top on navigation
  // can't leave a near-resting sample behind. No initial on-mount sample, so a
  // navigation transient never feeds it. Large only, where the panel is sticky.
  useEffect(() => {
    if (windowWidthCategory !== "large") return;

    let sampleFrame: number | null = null;

    const sampleScrolledTop = () => {
      sampleFrame = null;

      const panel = panelRef.current;
      if (!panel) return;

      // The sticky inset (`lg:top-7`) is where the panel pins; read it from the
      // element rather than hardcoding so it tracks the class. Pinned when the
      // panel's viewport top has reached that inset (+1px subpixel tolerance).
      //
      // Require `scrollY > 0` too: the panel is only genuinely pinned when the
      // user is actually scrolled. This is what stops the route-change slide
      // from feeding itself — that animation runs at scroll top and transforms
      // the panel up TO the inset, so `getBoundingClientRect().top` reads as
      // "pinned" mid-slide even though scrollY is 0. Without this guard the
      // sampler stores that transformed position and the very next navigation
      // replays a slide the user never earned (jumps up, animates down).
      const stickyInsetPx =
        Number.parseFloat(window.getComputedStyle(panel).top) || 0;
      const panelTop = panel.getBoundingClientRect().top;
      lastScrolledPanelViewportTop =
        window.scrollY > 0 && panelTop <= stickyInsetPx + 1 ? panelTop : null;
    };

    const scheduleSample = () => {
      if (sampleFrame !== null) return;

      sampleFrame = window.requestAnimationFrame(sampleScrolledTop);
    };

    window.addEventListener("scroll", scheduleSample, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleSample);

      if (sampleFrame !== null) {
        window.cancelAnimationFrame(sampleFrame);
      }
    };
  }, [windowWidthCategory]);

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
