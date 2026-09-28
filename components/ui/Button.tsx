import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as SharedButton, buttonClassName } from "@/components/Button";

export type ButtonVariant = "primary" | "secondary";

const variants = {
  primary: "primary",
  secondary: "outline",
} as const;

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return buttonClassName({
    variant: variants[variant],
    size: "small",
    className: extra,
  });
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <SharedButton
      type={type}
      size="small"
      variant={variants[variant]}
      className={className}
      {...props}
    >
      {children}
    </SharedButton>
  );
}
