import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface MetricProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: "favorable" | "unfavorable";
}

export function Metric(props: MetricProps) {
  const { label, value, delta, deltaTone, className, style, ...rest } = props;

  const resting: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
    backgroundColor: "var(--surface)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-4)",
    minWidth: "10rem",
    fontFamily: "var(--font-mono)",
  };

  const labelStyle: CSSProperties = {
    fontSize: "var(--text-xs)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-heading)",
    opacity: 0.7,
  };

  const valueStyle: CSSProperties = {
    fontSize: "var(--text-xl)",
    fontWeight: "var(--weight-bold)",
    fontVariantNumeric: "tabular-nums",
  };

  const deltaColor =
    deltaTone === "favorable"
      ? "var(--favorable)"
      : deltaTone === "unfavorable"
        ? "var(--unfavorable)"
        : "var(--muted)";

  const deltaStyle: CSSProperties = {
    fontSize: "var(--text-sm)",
    color: deltaColor,
  };

  return (
    <div
      {...rest}
      className={["cs-metric", className].filter(Boolean).join(" ")}
      style={{ ...resting, ...style }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
      {delta !== undefined && <span style={deltaStyle}>{delta}</span>}
    </div>
  );
}
