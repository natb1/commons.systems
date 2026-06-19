// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route <LegacyRoute> body, and the footer. The client
// router lives in use-router.ts; the data/crypto/file-sync orchestration lives
// in use-app-state.ts. This unit wraps legacy string-rendered route bodies in a
// React shell — Units 3-4 swap the /transactions and /rules arms for real React
// pages.
import { AppShell } from "./AppShell.js";
import { AuthControls } from "./AuthControls.js";
import { Hero } from "./Hero.js";
import { LegacyRoute } from "./LegacyRoute.js";
import { useAppState } from "./use-app-state.js";
import { useRouter } from "./use-router.js";
import type { HydrationSpec } from "./legacy-hydrate.js";
import type { RenderPageOptions } from "./pages/render-options.js";
import { Transactions } from "./pages/Transactions.js";
import { Rules } from "./pages/Rules.js";
import { renderBudgets } from "./pages/budgets.js";
import { renderAccounts } from "./pages/accounts.js";
import { renderAccountsReconcile } from "./pages/accounts-reconcile.js";
import { hydrateBudgetTable, hydrateBudgetChart, hydrateOverridesTable } from "./pages/budgets-hydrate.js";
import { hydrateAccountsCharts } from "./pages/accounts-hydrate.js";
import { hydrateAccountsReconcile } from "./pages/accounts-reconcile-hydrate.js";

interface RouteDef {
  path: string;
  render: (o: RenderPageOptions) => Promise<string | null>;
  specs: HydrationSpec[];
}

// /transactions and /rules are real React pages, not <LegacyRoute>s; they live
// outside ROUTES but are still known paths for routing + Nav `current`.
const TRANSACTIONS_PATH = "/transactions";
const RULES_PATH = "/rules";

// LegacyRoute-backed routes mirror main.ts:132-136 (minus /transactions), with
// per-route hydration specs from main.ts:182-191. The first route is the
// fallback for an unknown path.
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
];

// Known paths preserve the legacy ordering for nav, with /transactions inserted
// after "/" and /rules appended last (its original slot in main.ts:132-136).
const KNOWN_PATHS = [ROUTES[0].path, TRANSACTIONS_PATH, ...ROUTES.slice(1).map((r) => r.path), RULES_PATH];

export function App() {
  const app = useAppState();
  const path = useRouter(KNOWN_PATHS);

  const isTransactions = path === TRANSACTIONS_PATH;
  const isRules = path === RULES_PATH;
  // matchRoute … ?? routes[0] (the legacy router fell back to the first route).
  // For /transactions and /rules there is no LegacyRoute entry; `route` is only
  // used for the LegacyRoute branch and the Nav `current` (overridden below).
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
  const currentPath = isTransactions ? TRANSACTIONS_PATH : isRules ? RULES_PATH : route.path;

  return (
    <AppShell
      current={currentPath}
      navEnd={<AuthControls {...app} />}
      hero={<Hero hidden={app.state.source === "local"} />}
    >
      {/* Keyed by path AND navEpoch: a fresh instance per link navigation
          (path change) AND per data transition (navEpoch bump), so the body
          re-resolves against the current data source — exactly what legacy's
          trailing router.navigate() did. Each instance still renders once, so
          the render-once invariant holds.

          /transactions and /rules are real React pages — same keying so a
          same-path data transition re-mounts them and re-resolves; renderOptions()
          is read at mount and also calls setActiveDataSource for the route,
          matching how LegacyRoute is fed. The other three routes stay legacy.

          Gated on app.initialized: initialize() always ends with a transition()
          that bumps navEpoch 0→1, which would unmount-then-remount a body
          rendered eagerly at navEpoch=0 and wipe its just-hydrated chart/table.
          Holding the body until initialize settles mounts it exactly once at
          navEpoch=1 — matching legacy's single post-initialize router.navigate().
          The AppShell/nav/header/footer/hero still render immediately. */}
      {!app.initialized ? null : isTransactions ? (
        <Transactions
          key={`${TRANSACTIONS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : isRules ? (
        <Rules
          key={`${RULES_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : (
        <LegacyRoute
          key={`${route.path}:${app.navEpoch}`}
          render={() => route.render(app.renderOptions())}
          specs={route.specs}
        />
      )}
    </AppShell>
  );
}
