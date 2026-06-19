// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route <LegacyRoute> body, and the footer. The client
// router lives in use-router.ts; the data/crypto/file-sync orchestration lives
// in use-app-state.ts. This unit wraps legacy string-rendered route bodies in a
// React shell — Unit 3 later swaps only the /transactions arm for a real React
// page.
import { Nav } from "@commons-systems/ds";
import { NAV_LINKS } from "./nav-links.js";
import { AuthControls } from "./AuthControls.js";
import { Hero } from "./Hero.js";
import { LegacyRoute } from "./LegacyRoute.js";
import { useAppState } from "./use-app-state.js";
import { useRouter } from "./use-router.js";
import type { HydrationSpec } from "./legacy-hydrate.js";
import type { RenderPageOptions } from "./pages/render-options.js";
import { renderHome } from "./pages/home.js";
import { renderBudgets } from "./pages/budgets.js";
import { renderAccounts } from "./pages/accounts.js";
import { renderAccountsReconcile } from "./pages/accounts-reconcile.js";
import { renderRules } from "./pages/rules.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { hydrateCategorySankey } from "./pages/home-chart.js";
import { hydrateBudgetTable, hydrateBudgetChart, hydrateOverridesTable } from "./pages/budgets-hydrate.js";
import { hydrateRulesTable } from "./pages/rules-hydrate.js";
import { hydrateAccountsCharts } from "./pages/accounts-hydrate.js";
import { hydrateAccountsReconcile } from "./pages/accounts-reconcile-hydrate.js";

interface RouteDef {
  path: string;
  render: (o: RenderPageOptions) => Promise<string | null>;
  specs: HydrationSpec[];
}

// Routes mirror main.ts:132-136, with per-route hydration specs from
// main.ts:182-191. The first route is the fallback for an unknown path.
const ROUTES: RouteDef[] = [
  {
    path: "/",
    render: renderBudgets,
    specs: [
      { selector: "#budgets-chart", hydrate: hydrateBudgetChart },
      { selector: "#budgets-table", hydrate: hydrateBudgetTable },
      { selector: "#overrides-table", hydrate: hydrateOverridesTable },
    ],
  },
  {
    path: "/transactions",
    render: renderHome,
    specs: [
      { selector: "#category-sankey", hydrate: hydrateCategorySankey, errorLabel: "Chart rendering" },
      { selector: "#transactions-table", hydrate: hydrateTransactionTable },
    ],
  },
  {
    path: "/accounts",
    render: renderAccounts,
    specs: [
      { selector: "#accounts-trend-chart", hydrate: hydrateAccountsCharts, errorLabel: "Chart rendering" },
    ],
  },
  {
    path: "/accounts/reconcile",
    render: renderAccountsReconcile,
    specs: [
      { selector: "#reconcile-container", hydrate: hydrateAccountsReconcile },
    ],
  },
  {
    path: "/rules",
    render: renderRules,
    specs: [
      { selector: "#rules-table", hydrate: hydrateRulesTable },
    ],
  },
];

const KNOWN_PATHS = ROUTES.map((r) => r.path);

export function App() {
  const app = useAppState();
  const path = useRouter(KNOWN_PATHS);

  // matchRoute … ?? routes[0] (the legacy router fell back to the first route).
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];

  return (
    <div className="page">
      <header>
        <h1>Budget</h1>
        {/* ds Nav renders its own <nav>, so it goes directly under <header>
            rather than nested in another <nav> (which would double-nest). */}
        <Nav
          links={[...NAV_LINKS]}
          current={route.path}
          end={<AuthControls {...app} />}
        />
      </header>
      <Hero hidden={app.state.source === "local"} />
      <div className="content-grid">
        {/* Keyed by path AND navEpoch: a fresh instance per link navigation
            (path change) AND per data transition (navEpoch bump), so the body
            re-resolves against the current data source — exactly what legacy's
            trailing router.navigate() did. Each instance still renders once, so
            the render-once invariant holds. */}
        <LegacyRoute
          key={`${route.path}:${app.navEpoch}`}
          render={() => route.render(app.renderOptions())}
          specs={route.specs}
        />
      </div>
      <footer>
        <p>Created with <a href="https://github.com/natb1/commons.systems" target="_blank" rel="noopener">commons.systems</a> | &copy; 2026 RUMOR.ML <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" className="cc-badge" /></a></p>
      </footer>
    </div>
  );
}
