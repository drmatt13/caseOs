import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useCallback,
  useRef,
  useState,
  useContext,
} from "react";
import AppLogo from "#/components/AppLogo";
import useWindowWidthCategory from "#/hooks/useWindowWidthCategory";

// context
import { MenuContext } from "#/context/MenuContext";
import { XIcon } from "lucide-react";

interface LeftPanelLayoutProps {
  children: ReactNode;
}

const pixelsToRem = (px: number) => px / 16;
const maxBodyScrollDeltaRem = 5.25;
const stickyTopRem = 1.75;
const bottomPaddingRem = 1.8;
const initialPanelOffsetRem =
  maxBodyScrollDeltaRem + stickyTopRem + bottomPaddingRem;
const scrollUpSlowTransitionDurationMs = 90;
const scrollUpFastTransitionDurationMs = 12;
const scrollDownSlowTransitionDurationMs = 55;
const scrollDownFastTransitionDurationMs = 30;
const slowScrollVelocityPxPerMs = 0.1;
const fastScrollVelocityPxPerMs = 0.9;
const scrollVelocityDurationCurve = 1;
const scrollUpTransitionTimingFunction = "cubic-bezier(.65,.8,0,.9)";
const scrollDownTransitionTimingFunction = "cubic-bezier(0.3, 0.6, 0.75, 1)";
const shouldLogScrollVelocity = true;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;
const inverseLerp = (start: number, end: number, value: number) =>
  clamp((value - start) / (end - start), 0, 1);
const getScrollVelocityProgress = (scrollVelocityPxPerMs: number) => {
  const velocityProgress = inverseLerp(
    slowScrollVelocityPxPerMs,
    fastScrollVelocityPxPerMs,
    scrollVelocityPxPerMs,
  );

  return Math.pow(velocityProgress, scrollVelocityDurationCurve);
};
const getTransitionDurationMs = (
  scrollVelocityPxPerMs: number,
  scrollDirection: "up" | "down",
) => {
  const curvedVelocityProgress = getScrollVelocityProgress(
    scrollVelocityPxPerMs,
  );
  const slowTransitionDurationMs =
    scrollDirection === "down"
      ? scrollDownSlowTransitionDurationMs
      : scrollUpSlowTransitionDurationMs;
  const fastTransitionDurationMs =
    scrollDirection === "down"
      ? scrollDownFastTransitionDurationMs
      : scrollUpFastTransitionDurationMs;

  return lerp(
    slowTransitionDurationMs,
    fastTransitionDurationMs,
    curvedVelocityProgress,
  );
};
const getPanelOffsetRem = () => {
  const bodyScrollDelta = Math.min(
    maxBodyScrollDeltaRem,
    pixelsToRem(window.scrollY),
  );

  return (
    maxBodyScrollDeltaRem - bodyScrollDelta + stickyTopRem + bottomPaddingRem
  );
};

const LeftPanelLayout = ({ children }: LeftPanelLayoutProps) => {
  const { menuOpen, setMenuOpen } = useContext(MenuContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const windowWidthCategory = useWindowWidthCategory();
  const animationFrameRef = useRef<number | null>(null);
  const previousScrollSampleRef = useRef({
    scrollY: 0,
    time: 0,
  });

  const updatePanelHeightOffset = useCallback((animate: boolean) => {
    const panel = panelRef.current;

    if (!panel) return;

    const panelOffsetRem = getPanelOffsetRem();

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
    const velocityProgress = getScrollVelocityProgress(scrollVelocityPxPerMs);
    const scrollSpeedLabel =
      scrollVelocityPxPerMs <= slowScrollVelocityPxPerMs
        ? "slow"
        : scrollVelocityPxPerMs >= fastScrollVelocityPxPerMs
          ? "fast"
          : "middle";

    if (shouldLogScrollVelocity && scrollDistancePx > 0) {
      console.log("[left-panel-scroll]", {
        speed: scrollSpeedLabel,
        direction: scrollDirection,
        velocityPxPerMs: Number(scrollVelocityPxPerMs.toFixed(2)),
        progress: Number(velocityProgress.toFixed(2)),
        transitionDurationMs: Number(transitionDurationMs.toFixed(2)),
      });
    }

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

  useEffect(() => {
    if (windowWidthCategory !== "large") {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      return;
    }

    const handleResize = () => {
      updatePanelHeightOffset(false);
    };

    updatePanelHeightOffset(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll, updatePanelHeightOffset, windowWidthCategory]);

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

  return (
    <div
      className={`${windowWidthCategory === "small" ? `absolute top-0 left-0 transition-transform shadow ${!menuOpen ? "-translate-x-full ease-out duration-300" : "ease-in duration-150"}` : `md:relative`} z-10 w-64 min-w-64 flex flex-col gap-2`}
    >
      {windowWidthCategory === "large" && <AppLogo LeftPanelLayout={true} />}
      <div
        ref={panelRef}
        style={windowWidthCategory === "large" ? panelStyle : undefined}
        className="sticky top-0 max-h-dvh lg:top-7 h-dvh lg:h-max lg:rounded-2xl pl-2 lg:pl-0 bg-black/10 lg:bg-transparent backdrop-blur-lg md:backdrop-blur-sm lg:backdrop-blur-none md:border-r lg:border border-black/5 lg:border-black/15 lg:shadow-md overflow-hidden"
      >
        {windowWidthCategory === "small" && (
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => {
              setMenuOpen(false);
            }}
            className="absolute top-0 right-0 p-1 m-1 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
        <div className="overflow-y-auto max-h-[inherit] overflow-x-hidden">
          <div className="font-serif text-xs lg:bg-white/40 lg:backdrop-blur-sm pt-5 pb-4 pl-2 pr-4 lg:px-4 flex flex-col gap-2">
            {windowWidthCategory !== "large" && (
              <div className="mb-2">
                <AppLogo LeftPanelLayout={true} />
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanelLayout;
