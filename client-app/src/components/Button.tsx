// import React from 'react'

interface ButtonProps {
  style?: "primary" | "secondary";
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({
  style = "primary",
  text = "",
  onClick = () => {},
  disabled = false,
}: ButtonProps) => {
  const baseClassName = "px-4 py-2 text-white rounded transition-colors";
  const variantClassName = style === "primary" ? "bg-blue-500" : "bg-mist-500";
  const stateClassName = disabled
    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
    : style === "primary"
      ? "hover:bg-blue-600 cursor-pointer"
      : "hover:bg-mist-600 cursor-pointer";
  const className = `${baseClassName} ${variantClassName} ${stateClassName}`;

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};

export default Button;
