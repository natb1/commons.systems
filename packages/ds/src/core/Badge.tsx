import type { CSSProperties, HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent" | "success" | "error";
}

const toneTokens = {
  accent: "var(--accent)",
  success: "var(--success)",
  error: "var(--error)",
} as const;

const toneMix = {
  accent: "color-mix(in srgb, var(--accent) 15%, transparent)",
  success: "color-mix(in srgb, var(--success) 15%, transparent)",
  error: "color-mix(in srgb, var(--error) 15%, transparent)",
} as const;

export function Badge(props: BadgeProps) {
  const { variant = "neutral", className, style, children, ...rest } = props;

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "var(--text-xs)",
    fontFamily: "var(--font-mono)",
    padding: "0.1rem 0.45rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--radius-none)",
  };

  const resting: CSSProperties =
    variant === "neutral"
      ? {
          ...base,
          borderColor: "var(--border)",
          color: "var(--fg)",
          backgroundColor: "transparent",
        }
      : {
          ...base,
          borderColor: toneTokens[variant],
          color: toneTokens[variant],
          backgroundColor: toneMix[variant],
        };

  return (
    <span
      {...rest}
      className={["cs-badge", `cs-badge--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...resting, ...style }}
    >
      {children}
    </span>
  );
}
