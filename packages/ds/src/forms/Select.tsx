import { useId } from "react";
import type { CSSProperties, ReactNode, SelectHTMLAttributes } from "react";

type Option = string | { value: string; label: string };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  options: Option[];
  wrapStyle?: CSSProperties;
}

function normalize(opt: Option): { value: string; label: string } {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

export function Select(props: SelectProps) {
  const {
    label,
    helper,
    error,
    options,
    wrapStyle,
    className,
    style,
    children,
    id: idProp,
    ...rest
  } = props;

  const generated = useId();
  const id = idProp ?? generated;

  const fieldResting: CSSProperties = {
    width: "100%",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    backgroundColor: "var(--surface)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: error ? "var(--error)" : "var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.4rem 0.6rem",
    color: "var(--fg)",
  };

  const optionEls = options.map((opt) => {
    const { value, label: optLabel } = normalize(opt);
    return (
      <option key={value} value={value}>
        {optLabel}
      </option>
    );
  });

  const control = (
    <select
      {...rest}
      id={id}
      aria-invalid={!!error || undefined}
      className={["cs-select", className].filter(Boolean).join(" ")}
      style={{ ...fieldResting, ...style }}
    >
      {optionEls}
      {children}
    </select>
  );

  if (!(label || helper || error)) {
    return control;
  }

  const wrapResting: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  };

  const labelResting: CSSProperties = {
    fontSize: "var(--text-xs)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-heading)",
    color: "var(--muted)",
  };

  return (
    <div className="cs-field" style={{ ...wrapResting, ...wrapStyle }}>
      {label ? (
        <label htmlFor={id} style={labelResting}>
          {label}
        </label>
      ) : null}
      {control}
      {error || helper ? (
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: error ? "var(--error)" : "var(--muted)",
          }}
        >
          {error ?? helper}
        </span>
      ) : null}
    </div>
  );
}
