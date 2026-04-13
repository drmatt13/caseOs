// import React from 'react'

import { useState } from "react";

interface ButtonProps {
  style?: "primary" | "secondary";
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  rainbow?: boolean;
  icon?: "sparkles";
  submit?: boolean;
}

import { Sparkles } from "lucide-react";

const Button = ({
  style = "primary",
  text = "",
  onClick = () => {},
  disabled = false,
  rainbow = false,
  icon = undefined,
  submit = false,
}: ButtonProps) => {
  const [suppressHover, setSuppressHover] = useState(false);
  const isRainbowPrimary = rainbow && style === "primary" && !disabled;
  const baseClassName = `${icon ? "pl-3.5 pr-4" : "px-4"} relative isolate inline-flex items-center justify-center py-2 rounded border transition-colors overflow-visible`;
  const variantClassName =
    style === "primary"
      ? "border-transparent bg-[#282828] text-white"
      : "border-black/10 bg-mist-300/60 text-black/75 shadow-sm";
  const stateClassName = disabled
    ? "border-transparent bg-gray-300 text-gray-600 cursor-not-allowed"
    : suppressHover
      ? "cursor-pointer"
      : style === "primary"
        ? "hover:bg-black cursor-pointer"
        : "hover:bg-mist-300 hover:text-black cursor-pointer";
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
      onClick={() => {
        setSuppressHover(true);
        onClick();
      }}
      onMouseLeave={() => setSuppressHover(false)}
      disabled={disabled}
      type={submit ? "submit" : "button"}
    >
      <span
        className={
          isRainbowPrimary
            ? "relative z-20 inline-flex items-center gap-2"
            : "relative z-0 inline-flex items-center gap-2"
        }
      >
        {icon === "sparkles" && <Sparkles className="h-4 w-4" />}
        {text}
      </span>
    </button>
  );
};

export default Button;
