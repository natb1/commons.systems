// Pure, side-effect-free presentational shell shared by the client App.tsx and
// the server prerender.ts (SSG). It must import ONLY React + the ds Nav +
// NAV_LINKS — NOT firebase, use-app-state, use-router, AuthControls, Hero,
// Transactions, LegacyRoute, or any CSS — so it can render under `tsx` in Node
// (renderToStaticMarkup) without tripping a browser global or a top-level
// firebase side effect.
//
// Both callers compose the exact same shell structure:
//   <div className="page">
//     <header><h1>Budget</h1> + ds <Nav .../></header>
//     <hero content-grid>      (live <Hero/> on the client; empty placeholder
//                               on the server, matching today's first paint
//                               where the hero fills on mount)
//     <div className="content-grid">{children}</div>   (the route body)
//     <footer> commons.systems + CC-BY-SA badge
//   </div>
import type { ReactNode } from "react";
import { Nav } from "@commons-systems/ds";
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
    <div className="page">
      <header>
        <h1>Budget</h1>
        {/* ds Nav renders its own <nav>, so it goes directly under <header>
            rather than nested in another <nav> (which would double-nest). */}
        <Nav links={[...NAV_LINKS]} current={current} end={navEnd} />
      </header>
      {hero ?? <div id="hero-container" className="content-grid" />}
      <div className="content-grid">{children}</div>
      <footer>
        <p>Created with <a href="https://github.com/natb1/commons.systems" target="_blank" rel="noopener">commons.systems</a> | &copy; 2026 RUMOR.ML <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" className="cc-badge" /></a></p>
      </footer>
    </div>
  );
}
