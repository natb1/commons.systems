// Thin, side-effect-free adapter that delegates entirely to the ds
// <PageShell> chrome primitive, injecting budget's specifics: the "Budget"
// wordmark, NAV_LINKS, and the budget-specific #hero-container hero
// placeholder default. PageShell owns all the page/header/footer markup; this
// file declares none of it.
//
// Load-bearing SSG-safety note (shared by the client App.tsx and the server
// prerender.ts): it must import ONLY React + ds + NAV_LINKS — NOT firebase,
// use-app-state, use-router, AuthControls, Hero, Transactions, LegacyRoute, or
// any CSS — so it can render under `tsx` in Node (renderToStaticMarkup)
// without tripping a browser global or a top-level firebase side effect.
import type { ReactNode } from "react";
import { PageShell } from "@commons-systems/ds";
import { NAV_LINKS } from "./nav-links.js";

export interface AppShellProps {
  // Active path, for ds Nav highlighting (the `current` link).
  current: string;
  // ds Nav `end` slot: the live <AuthControls/> on the client; omitted on the
  // server (no auth UI is baked into the static first paint).
  navEnd?: ReactNode;
  // The hero island: the live <Hero/> on the client. When omitted (server), an
  // empty <div id="hero-container" className="content-grid"> placeholder is
  // rendered so the baked first paint matches today's behavior, where the hero
  // is filled in on mount.
  hero?: ReactNode;
  // The route body (the <main>).
  children: ReactNode;
}

export function AppShell({ current, navEnd, hero, children }: AppShellProps) {
  return (
    <PageShell
      wordmark="Budget"
      navLinks={[...NAV_LINKS]}
      current={current}
      navEnd={navEnd}
      hero={hero ?? <div id="hero-container" className="content-grid" />}
    >
      {children}
    </PageShell>
  );
}
