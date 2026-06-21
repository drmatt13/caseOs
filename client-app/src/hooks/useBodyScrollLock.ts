import { useEffect } from "react";

// Reference-counted scroll lock shared across every modal in the app.
//
// Multiple modals can be open at once (e.g. the settings AppModal stacked over an
// open RecordInspector), and each one independently calls this hook. The
// module-level counter means the page is frozen while *any* consumer is locked
// and only restored once the last one releases. Everything is transient — applied
// while a modal is open and fully reverted on close, with no permanent CSS.
//
// Preserving `position: sticky` (the NavigationPanel relies on it):
//   We lock `overflow: hidden` on `body`, NOT on `html`. Because `html` stays
//   `overflow: visible`, the browser propagates body's `hidden` to the viewport —
//   freezing the page scroll — while body's *own* used overflow stays `visible`.
//   So neither `html` nor `body` becomes a scroll container: the sticky panel's
//   scroll container is still the viewport, and since `overflow: hidden` keeps the
//   current scroll offset, the panel stays exactly where it is. Locking `html`
//   instead would turn the root into a scroll container, forcing any currently
//   stuck sticky element to re-resolve and snap (the jump we saw before).
//
// No layout shift:
//   Hiding the scrollbar frees the space it occupied. We re-reserve exactly that
//   much on `html` so the right edge never moves:
//     - when supported, `scrollbar-gutter: stable` keeps the viewport's content
//       width constant (so fixed chrome stays put too) without making `html` a
//       scroll container (it doesn't touch overflow, so sticky is safe);
//     - otherwise we fall back to an equivalent `padding-right` on `body`.
//   We only reserve when a scrollbar was actually present (`scrollbarWidth > 0`).
//   On overlay-scrollbar devices and pages too short to scroll the measurement is
//   `0`, so we reserve nothing and nothing shifts.
const supportsScrollbarGutter =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("scrollbar-gutter", "stable");

let lockCount = 0;
let savedBodyOverflow = "";
let savedBodyPaddingRight = "";
let savedRootScrollbarGutter = "";

const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      const root = document.documentElement;
      const { body } = document;

      // Measure the scrollbar's footprint before we hide it.
      const scrollbarWidth = window.innerWidth - root.clientWidth;

      savedBodyOverflow = body.style.overflow;
      savedBodyPaddingRight = body.style.paddingRight;
      savedRootScrollbarGutter = root.style.scrollbarGutter;

      body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        if (supportsScrollbarGutter) {
          root.style.scrollbarGutter = "stable";
        } else {
          const currentPaddingRight =
            parseFloat(getComputedStyle(body).paddingRight) || 0;
          body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
        }
      }
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        const root = document.documentElement;
        const { body } = document;
        body.style.overflow = savedBodyOverflow;
        body.style.paddingRight = savedBodyPaddingRight;
        root.style.scrollbarGutter = savedRootScrollbarGutter;
      }
    };
  }, [locked]);
};

export default useBodyScrollLock;
