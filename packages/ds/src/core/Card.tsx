import type { CSSProperties, ElementType, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
}

export function Card(props: CardProps) {
  const { as: Tag = "div", interactive, className, style, ...rest } = props;

  const isInteractive = interactive || Tag === "a" || !!rest.onClick;

  // Accessibility/safety defaults applied to the rendered element, each only
  // when the consumer did not already supply it. Kept in a separate object
  // because `type` is not part of HTMLAttributes<HTMLElement>.
  const extraProps: { type?: "button"; tabIndex?: number; role?: string } = {};

  // A bare <button> defaults to type="submit", which submits an enclosing
  // form on click. Default it to "button" unless the consumer set a type.
  if (Tag === "button" && (rest as { type?: unknown }).type === undefined) {
    extraProps.type = "button";
  }

  // When interactivity is auto-detected on a non-interactive element (e.g. the
  // default <div>), make it keyboard-focusable and expose a button role so the
  // onClick handler and :focus styles are reachable by keyboard users. Native
  // interactive elements (a, button, input, select, textarea) already provide
  // this. Respect any values the consumer supplied.
  const nativelyInteractive =
    Tag === "a" ||
    Tag === "button" ||
    Tag === "input" ||
    Tag === "select" ||
    Tag === "textarea";
  if (isInteractive && !nativelyInteractive) {
    if (rest.tabIndex === undefined) {
      extraProps.tabIndex = 0;
    }
    if (rest.role === undefined) {
      extraProps.role = "button";
    }
  }

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
      {...extraProps}
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
