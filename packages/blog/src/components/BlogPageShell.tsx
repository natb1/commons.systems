// Thin, side-effect-free adapter that delegates entirely to the ds
// <PageShell> chrome primitive, injecting blog-specific Region nodes as props.
// PageShell owns all the page/header/footer markup; this file declares none of it.
//
// Load-bearing SSG-safety note (shared by the client create-blog-app.ts and the
// server prerender.ts): it must import ONLY React + ds — NOT firebase, CSS, or
// any module that touches browser globals — so it can render under `tsx` in
// Node (renderToStaticMarkup) without tripping a browser global or a top-level
// firebase side effect.
import type { ReactNode } from "react";
import { PageShell, ContextPanel } from "@commons-systems/ds";
import type { NavLink } from "@commons-systems/ds";

export interface BlogPageShellProps {
  wordmark: ReactNode;
  tagline?: ReactNode;
  navLinks: NavLink[];
  current?: string;
  navEnd?: ReactNode;
  hero?: ReactNode;
  panelOpen: boolean;
  panelId: string;
  panelAriaLabel?: string;
  panel: ReactNode;
  children: ReactNode;
}

export function BlogPageShell(props: BlogPageShellProps) {
  const {
    wordmark,
    tagline,
    navLinks,
    current,
    navEnd,
    hero,
    panelOpen,
    panelId,
    panelAriaLabel,
    panel,
    children,
  } = props;

  return (
    <PageShell
      wordmark={wordmark}
      tagline={tagline}
      navLinks={navLinks}
      current={current}
      navEnd={navEnd}
      hero={hero}
    >
      <main id="app">{children}</main>
      <ContextPanel open={panelOpen} id={panelId} aria-label={panelAriaLabel}>
        {panel}
      </ContextPanel>
    </PageShell>
  );
}
