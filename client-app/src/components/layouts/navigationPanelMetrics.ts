// Sizing + scroll math for the sticky NavigationPanel. Extracted so the panel
// component reads as effects + render, and so the session-storage key that the
// live panel writes and the loading skeleton reads stays defined in exactly one
// place (it was previously duplicated in both files). Pure — no React, no
// behavior change.

const navigationPanelLoadingHeightStorageKeyPrefix =
  "lawstruct.navigationPanel.loadingHeight";

// Key under which the panel persists its measured height per breakpoint, so the
// loading skeleton can reserve the same height on the next route load.
export const getNavigationPanelLoadingHeightStorageKey = (
  windowWidthCategory: string,
) => `${navigationPanelLoadingHeightStorageKeyPrefix}.${windowWidthCategory}`;

const pixelsToRem = (px: number) => px / 21;
const maxBodyScrollDeltaRem = 5.25;
const stickyTopRem = 1.75;
const bottomPaddingRem = 1.8;
// Subpixel rounding leaves the panel a few px taller than its slot, which is
// enough to give a content-less body a sliver of scroll. Trim it back only when
// the body shouldn't scroll; when content genuinely overflows we keep the exact
// height so the expanded panel still aligns with the content column.
const overflowGuardRem = pixelsToRem(4);
export const initialPanelOffsetRem =
  maxBodyScrollDeltaRem + stickyTopRem + bottomPaddingRem;
export const scrollUpSlowTransitionDurationMs = 90;
const scrollUpFastTransitionDurationMs = 12;
const scrollDownSlowTransitionDurationMs = 55;
const scrollDownFastTransitionDurationMs = 30;
const slowScrollVelocityPxPerMs = 0.1;
const fastScrollVelocityPxPerMs = 0.9;
const scrollVelocityDurationCurve = 1;
export const scrollUpTransitionTimingFunction = "cubic-bezier(.65,.8,0,.9)";
export const scrollDownTransitionTimingFunction =
  "cubic-bezier(0.3, 0.6, 0.75, 1)";
// const shouldLogScrollVelocity = true;

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
export const getTransitionDurationMs = (
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
// `bodyContentOverflowPx` is the genuine, panel-independent scroll distance: how
// far the content column (plus the page's own padding) extends past the
// viewport. It's a gate, not a cap — the moment there's any real scroll the
// panel expands with scrollY all the way to max, "unzipping" open. The gate is
// only there so a content-less page, whose only potential scroll would come from
// the panel's own growth, never starts that runaway.
export const getPanelOffsetRem = (bodyContentOverflowPx: number) => {
  // Below ~1px is subpixel rounding, not real scroll. Trim the panel by the
  // overflow guard so it doesn't give a content-less body a sliver of its own
  // scroll.
  if (bodyContentOverflowPx < 1) {
    return (
      maxBodyScrollDeltaRem +
      stickyTopRem +
      bottomPaddingRem +
      overflowGuardRem
    );
  }

  const bodyScrollDelta = Math.min(
    maxBodyScrollDeltaRem,
    pixelsToRem(window.scrollY),
  );

  return (
    maxBodyScrollDeltaRem - bodyScrollDelta + stickyTopRem + bottomPaddingRem
  );
};
