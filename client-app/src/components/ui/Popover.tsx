import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useState, type ReactNode } from "react";

// A small, self-contained click-to-open popover built on @floating-ui — the
// same primitives the app's SettingsPopup uses, but with LOCAL state so any
// number can coexist on a page (link-explanation popovers, inline hints, etc.).
// Deliberately does NOT touch the global PopupContext, which is reserved for the
// app's singleton popups.
//
// The reference is rendered as a real <button> so it works as a sibling control
// (e.g. alongside another button) and is keyboard-accessible. Its click is
// stopped from propagating so opening the popover never triggers a parent
// card/row open handler underneath it.
function Popover({
  trigger,
  triggerLabel,
  triggerClassName,
  children,
  placement = "top",
  className,
}: {
  // Visual content of the reference button (typically an icon).
  trigger: ReactNode;
  // Accessible label for the reference button.
  triggerLabel: string;
  triggerClassName?: string;
  children: ReactNode;
  placement?: Placement;
  // Classes for the floating content surface (caller supplies the tone wash).
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        aria-label={triggerLabel}
        className={triggerClassName}
        {...getReferenceProps({
          onClick: (event) => event.stopPropagation(),
        })}
      >
        {trigger}
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={className}
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default Popover;
