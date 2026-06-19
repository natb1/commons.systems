import type { HTMLAttributes, ReactNode, CSSProperties } from "react";

interface NavLink {
  href: string;
  label: string;
  align?: "end";
}

interface NavProps extends HTMLAttributes<HTMLElement> {
  links: NavLink[];
  current?: string;
  end?: ReactNode;
}

export function Nav(props: NavProps) {
  const { links, current, end, className, style, ...rest } = props;

  const resting: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: "var(--space-4)",
    fontFamily: "var(--font-mono)",
  };

  return (
    <nav
      {...rest}
      className={["cs-nav", className].filter(Boolean).join(" ")}
      style={{ ...resting, ...style }}
    >
      {links.map((link) => {
        const isCurrent =
          link.href === current || link.label === current;
        const linkStyle: CSSProperties = {
          color: "var(--accent)",
          ...(isCurrent
            ? { textDecoration: "underline", textDecorationThickness: "2px" }
            : {}),
          ...(link.align === "end" ? { marginLeft: "auto" } : {}),
        };
        return (
          <a
            key={link.href}
            href={link.href}
            className="cs-nav__link"
            style={linkStyle}
            {...(isCurrent ? { "aria-current": "page" as const } : {})}
          >
            {link.label}
          </a>
        );
      })}
      {end != null && <span style={{ marginLeft: "auto" }}>{end}</span>}
    </nav>
  );
}
