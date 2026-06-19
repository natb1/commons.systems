import type { HTMLAttributes, ReactNode, CSSProperties } from "react";

export interface NavLink {
  href: string;
  label: string;
  align?: "end";
}

export interface NavProps extends HTMLAttributes<HTMLElement> {
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

  const startLinks = links.filter((link) => link.align !== "end");
  const endLinks = links.filter((link) => link.align === "end");
  const hasEndGroup = endLinks.length > 0 || end != null;

  const renderLink = (link: NavLink) => {
    const isCurrent = link.href === current;
    const linkStyle: CSSProperties = {
      color: "var(--accent)",
      ...(isCurrent
        ? { textDecoration: "underline", textDecorationThickness: "2px" }
        : {}),
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
  };

  return (
    <nav
      {...rest}
      className={["cs-nav", className].filter(Boolean).join(" ")}
      style={{ ...resting, ...style }}
    >
      {startLinks.map(renderLink)}
      {hasEndGroup && (
        <span
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--space-4)",
            marginLeft: "auto",
          }}
        >
          {endLinks.map(renderLink)}
          {end != null && <span>{end}</span>}
        </span>
      )}
    </nav>
  );
}
