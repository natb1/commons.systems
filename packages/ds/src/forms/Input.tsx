import { useId } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  wrapStyle?: CSSProperties;
}

export function Input(props: InputProps) {
  const {
    label,
    helper,
    error,
    wrapStyle,
    className,
    style,
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

  const input = (
    <input
      {...rest}
      id={id}
      aria-invalid={!!error || undefined}
      className={["cs-input", className].filter(Boolean).join(" ")}
      style={{ ...fieldResting, ...style }}
    />
  );

  if (!(label || helper || error)) {
    return input;
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
      {input}
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
