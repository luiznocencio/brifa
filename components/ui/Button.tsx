"use client";
import type { ButtonHTMLAttributes } from "react";

type Variant = "filled" | "soft" | "outlined" | "ghost" | "danger";
type Size = "medium" | "large" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Tamanhos alinhados aos control-* do Disrupy (32 / 44 / 56).
const SIZE_CLASSES: Record<Size, string> = {
  medium: "h-8 px-3 gap-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-label-md)]",
  large: "h-11 px-4 gap-2 rounded-[var(--radius-md)] text-[length:var(--text-body-sm)]",
  xl: "h-14 px-6 gap-2.5 rounded-[var(--radius-sm)] text-[length:var(--text-body-md)]",
};

// Variantes espelhando components/Button/Button.jsx do Disrupy.
const VARIANT_CLASSES: Record<Variant, string> = {
  filled:
    "bg-[var(--color-brand)] text-[color:var(--text-on-brand)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-pressed)]",
  soft: "bg-[var(--color-brand-soft)] text-[color:var(--text-brand)] hover:bg-[var(--color-brand-100)]",
  outlined:
    "bg-transparent text-[color:var(--text-default)] shadow-[var(--shadow-hairline)] hover:bg-[var(--overlay-hover)]",
  ghost: "bg-transparent text-[color:var(--text-default)] hover:bg-[var(--overlay-hover)]",
  danger:
    "bg-[var(--color-danger)] text-[color:var(--text-on-brand)] hover:bg-[var(--color-danger-strong)]",
};

export function Button({
  variant = "filled",
  size = "medium",
  className = "",
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center whitespace-nowrap border-none",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
        disabled ? "cursor-not-allowed opacity-[.4]" : "cursor-pointer",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: "var(--fw-semibold)",
        letterSpacing: "0.01em",
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    />
  );
}

export default Button;
