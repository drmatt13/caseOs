import { useEffect, useState, type MouseEvent } from "react";

import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ImageUp,
  Mail,
  PlusIcon,
  RotateCcw,
  Save,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

// Named icons kept for ergonomic call sites (`icon="save"`). Callers that need
// an icon outside this set can pass a Lucide component directly (`icon={Trash2}`).
const buttonIcons = {
  briefcase: BriefcaseBusiness,
  check: Check,
  continue: ArrowRight,
  mail: Mail,
  plus: PlusIcon,
  reset: RotateCcw,
  save: Save,
  sparkles: Sparkles,
  upload: ImageUp,
  userPlus: UserPlus,
} as const;

type ButtonIconName = keyof typeof buttonIcons;

interface ButtonProps {
  style?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  text?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  rainbow?: boolean;
  icon?: ButtonIconName | LucideIcon;
  title?: string;
  submit?: boolean;
  fullWidth?: boolean;
  minWidth?: "sm" | "md" | "lg" | "xl";
  initiallyDisabled?: boolean;
}

const minWidthClasses = {
  sm: "min-w-24",
  md: "min-w-28",
  lg: "min-w-36",
  xl: "min-w-44",
} as const;

const Button = ({
  style = "primary",
  size = "md",
  text = "",
  onClick = () => {},
  disabled = false,
  rainbow = false,
  icon = undefined,
  title = undefined,
  submit = false,
  fullWidth = false,
  minWidth,
  initiallyDisabled = false,
}: ButtonProps) => {
  const [suppressHover, setSuppressHover] = useState(false);
  const [initialDisabled, setInitialDisabled] = useState(initiallyDisabled);
  const isDisabled = disabled || initialDisabled;
  const isRainbowPrimary = rainbow && style === "primary" && !isDisabled;
  const Icon = icon ? (typeof icon === "string" ? buttonIcons[icon] : icon) : null;

  useEffect(() => {
    if (initialDisabled) {
      setInitialDisabled(false);
    }
  }, [initialDisabled]);

  const widthClassName = fullWidth
    ? "w-full"
    : minWidth
      ? `${minWidthClasses[minWidth]} shrink-0`
      : "shrink-0";
  // sm trims the padding/height for dense in-context action rows (e.g. proposal
  // review controls); md is the default page/modal button. Label stays text-sm
  // either way so the type never shrinks below the readable baseline.
  const sizingClassName =
    size === "sm"
      ? `py-1.5 ${icon ? "pl-2.5 pr-3" : "px-3"}`
      : `py-2 ${icon ? "pl-3.5 pr-4" : "px-4"}`;
  const iconSizeClassName = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const gapClassName = size === "sm" ? "gap-1.5" : "gap-2";

  const baseClassName = `${widthClassName} ${sizingClassName} relative isolate text-sm inline-flex items-center justify-center whitespace-nowrap rounded border transition-colors ease-in duration-150 hover:ease-out hover:duration-100 overflow-visible`;
  const variantClassName =
    style === "primary"
      ? "border-transparent bg-[#282828] text-white"
      : style === "danger"
        ? "border-red-600/35 bg-transparent text-red-700"
        : style === "ghost"
          ? "border-transparent bg-transparent text-black/70"
          : "border-black/10 bg-black/10 text-black/75 shadow-sm";
  const stateClassName = isDisabled
    ? "border-transparent bg-gray-300 !text-gray-400 cursor-not-allowed"
    : suppressHover
      ? "cursor-pointer"
      : style === "primary"
        ? "hover:bg-black cursor-pointer"
        : style === "danger"
          ? "hover:border-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
          : style === "ghost"
            ? "hover:bg-black/10 hover:text-black cursor-pointer"
            : "hover:bg-gray-300 hover:text-black cursor-pointer";
  const rainbowClassName = isRainbowPrimary
    ? "bg-transparent before:pointer-events-none before:absolute before:bottom-[-.15rem] before:left-1/2 before:z-0 before:h-2 before:w-[94%] before:-translate-x-1/2 before:rounded-full before:bg-[linear-gradient(90deg,hsl(var(--color-rainbow-1)),hsl(var(--color-rainbow-5)),hsl(var(--color-rainbow-3)),hsl(var(--color-rainbow-4)),hsl(var(--color-rainbow-2)))] before:bg-[length:200%_100%] before:opacity-80 before:blur-sm before:content-[''] before:animate-rainbow after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:bg-[#1a1a1a] after:transition-colors after:content-[''] hover:after:bg-black"
    : "";
  const className = [
    baseClassName,
    variantClassName,
    stateClassName,
    rainbowClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      title={title}
      onClick={(event) => {
        setSuppressHover(true);
        onClick(event);
      }}
      onMouseLeave={() => setSuppressHover(false)}
      disabled={isDisabled}
      type={submit ? "submit" : "button"}
    >
      <span
        className={
          isRainbowPrimary
            ? `relative z-20 inline-flex items-center ${gapClassName} whitespace-nowrap`
            : `relative z-0 inline-flex items-center ${gapClassName} whitespace-nowrap`
        }
      >
        {Icon && <Icon className={iconSizeClassName} />}
        {text}
      </span>
    </button>
  );
};

export default Button;
