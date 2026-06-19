import type { CSSProperties, ElementType, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
}

export function Card(props: CardProps) {
  const { as: Tag = "div", interactive, className, style, ...rest } = props;

  const isInteractive = interactive || Tag === "a" || !!rest.onClick;

  const resting: CSSProperties = {
    backgroundColor: "var(--surface)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: "var(--radius-none)",
    padding: "var(--space-4)",
    transition: "var(--transition-color)",
  };

  return (
    <Tag
      {...rest}
      className={[
        "cs-card",
        isInteractive ? "cs-card--interactive" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...resting, ...style }}
    />
  );
}
