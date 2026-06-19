import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  type?: "checkbox" | "radio";
}

export function Checkbox(props: CheckboxProps) {
  const { label, type = "checkbox", className, style, ...rest } = props;

  const labelResting: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    cursor: "pointer",
  };

  const inputResting: CSSProperties = {
    accentColor: "var(--accent)",
    width: "1rem",
    height: "1rem",
  };

  return (
    <label
      className={["cs-checkbox", className].filter(Boolean).join(" ")}
      style={{ ...labelResting, ...style }}
    >
      <input {...rest} type={type} style={inputResting} />
      {label}
    </label>
  );
}
