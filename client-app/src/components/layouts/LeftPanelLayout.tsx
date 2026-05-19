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

const LeftPanelLayout = ({ children }: LeftPanelLayoutProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updatePanelHeightOffset = useCallback(() => {
    const bodyScrollDelta = Math.min(
      maxBodyScrollDeltaRem,
      pixelsToRem(window.scrollY),
    );
    const panelOffsetRem =
      maxBodyScrollDeltaRem - bodyScrollDelta + stickyTopRem + bottomPaddingRem;

    panelRef.current?.style.setProperty(
      "--left-panel-height-offset",
      `${panelOffsetRem}rem`,
    );
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
    maxHeight: "calc(100dvh - var(--left-panel-height-offset))",
  } as CSSProperties;

  return (
    <div className="w-64 min-w-64 flex flex-col /border gap-2">
      {/* <div className="flex flex-col gap-1 h-14">
        <p className="text-3xl /font-noto-serif-jp font-bj-cree">CaseOS</p>
        <p className="text-xs font-inconsolata">
          AI-Powered Case Intelligence Workspace
        </p>
      </div> */}
      <AppLogo LeftPanelLayout={true} />
      {/* border rounded-2xl bg-white/40 backdrop-blur-sm border-black/15 shadow-md */}
      <div
        ref={panelRef}
        style={panelStyle}
        className="sticky top-7 h-max rounded-2xl border border-black/15 shadow-md overflow-hidden transition-[max-height] duration-50 ease-out"
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
