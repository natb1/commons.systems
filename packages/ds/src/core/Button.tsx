import { forwardRef } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, CSSProperties> = {
  sm: { padding: "0.3rem 0.65rem", fontSize: "var(--text-sm)" },
  md: { padding: "0.5rem 0.95rem", fontSize: "var(--text-base)" },
  lg: { padding: "0.65rem 1.25rem", fontSize: "var(--text-lg)" },
};

const variantStyles: Record<
  NonNullable<ButtonProps["variant"]>,
  CSSProperties
> = {
  primary: {
    backgroundColor: "var(--accent)",
    color: "var(--text-on-accent)",
    borderColor: "var(--accent)",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--fg)",
    borderColor: "var(--border)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--accent)",
    borderColor: "transparent",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref,
) {
  const {
    variant = "secondary",
    size = "md",
    icon,
    type = "button",
    className,
    style,
    children,
    ...rest
  } = props;

  const resting: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    fontFamily: "var(--font-mono)",
    fontWeight: "var(--weight-bold)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: "var(--radius-none)",
    transition: "var(--transition-color)",
    cursor: "pointer",
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={["cs-btn", `cs-btn--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...resting, ...style }}
    >
      {icon}
      {children}
    </button>
  );
});
