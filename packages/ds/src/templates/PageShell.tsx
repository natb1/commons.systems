import type { ReactNode } from "react";
import { Nav } from "../navigation/Nav.tsx";
import type { NavLink } from "../navigation/nav-link.ts";
import { Footer } from "./Footer.tsx";

export interface PageShellProps {
  wordmark: ReactNode;
  className?: string;
  tagline?: ReactNode;
  navLinks: NavLink[];
  current?: string;
  navEnd?: ReactNode;
  /** Rendered as a direct child of `<header>`, a sibling of `<Nav>`.
   * Distinct from `navEnd`, which is the `<Nav>` `end` slot rendered inside `<nav>`. */
  headerEnd?: ReactNode;
  hero?: ReactNode;
  children: ReactNode;
}

export function PageShell(props: PageShellProps) {
  const { wordmark, className, tagline, navLinks, current, navEnd, headerEnd, hero, children } = props;

  return (
    <div className={["page", className].filter(Boolean).join(" ")}>
      <header>
        <h1>{wordmark}</h1>
        {tagline && <p>{tagline}</p>}
        <Nav links={navLinks} current={current} end={navEnd} />
        {headerEnd}
      </header>
      {hero}
      <div className="content-grid">{children}</div>
      <Footer />
    </div>
  );
}
