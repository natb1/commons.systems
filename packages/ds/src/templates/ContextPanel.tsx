import type { ReactNode } from "react";

export interface ContextPanelProps {
  open: boolean;
  id: string;
  "aria-label"?: string;
  children: ReactNode;
}

export interface ContextPanelToggleProps {
  open: boolean;
  onToggle: () => void;
  controls: string;
  "aria-label"?: string;
}

export function ContextPanel(props: ContextPanelProps) {
  const { open, id, "aria-label": ariaLabel, children } = props;

  return (
    <aside
      id={id}
      className={["sidebar", "context-panel", open ? "open" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel ?? "Context"}
    >
      {children}
    </aside>
  );
}

export function ContextPanelToggle(props: ContextPanelToggleProps) {
  const { open, onToggle, controls, "aria-label": ariaLabel } = props;

  return (
    <button
      type="button"
      className="panel-toggle"
      aria-label={ariaLabel ?? "Toggle context panel"}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      {"▸"}
    </button>
  );
}
