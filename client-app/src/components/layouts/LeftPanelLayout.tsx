import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AppLogo from "../AppLogo";

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

const LeftPanelLayout = ({ children }: LeftPanelLayoutProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousScrollSampleRef = useRef({
    scrollY: 0,
    time: 0,
  });

  const updatePanelHeightOffset = useCallback(() => {
    const panel = panelRef.current;

    if (!panel) return;

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

    const bodyScrollDelta = Math.min(
      maxBodyScrollDeltaRem,
      pixelsToRem(window.scrollY),
    );
    const panelOffsetRem =
      maxBodyScrollDeltaRem - bodyScrollDelta + stickyTopRem + bottomPaddingRem;

    panel.style.setProperty(
      "--left-panel-height-offset",
      `${panelOffsetRem}rem`,
    );
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
      updatePanelHeightOffset();
    });
  }, [updatePanelHeightOffset]);

  useEffect(() => {
    updatePanelHeightOffset();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updatePanelHeightOffset);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePanelHeightOffset);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll, updatePanelHeightOffset]);

  const panelStyle = {
    "--left-panel-height-offset": `${initialPanelOffsetRem}rem`,
    "--left-panel-transition-duration": `${scrollUpSlowTransitionDurationMs}ms`,
    "--left-panel-transition-timing-function": scrollUpTransitionTimingFunction,
    maxHeight: "calc(100dvh - var(--left-panel-height-offset))",
    transitionDuration: "var(--left-panel-transition-duration)",
    transitionTimingFunction: "var(--left-panel-transition-timing-function)",
  } as CSSProperties;

  return (
    <div className="w-64 min-w-64 flex flex-col /border gap-2">
      <AppLogo LeftPanelLayout={true} />
      {/* border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md */}
      <div
        ref={panelRef}
        style={panelStyle}
        className="sticky top-7 h-max rounded-2xl border border-black/15 shadow-md overflow-hidden transition-[max-height]"
      >
        <div className="overflow-y-auto max-h-[inherit]">
          <div className="font-serif text-xs bg-white/40 backdrop-blur-sm pt-6 pb-4 px-4 flex flex-col gap-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanelLayout;
