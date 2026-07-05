import { useEffect } from "react";
import { PageShell } from "@commons-systems/ds";

import { trackPageView } from "./firebase.js";
import { Dashboard } from "./Dashboard.js";

export function App() {
  // Dashboard renders unauthenticated from a local encrypted snapshot — no
  // auth state to thread through, so office-hours has no in-app nav links and
  // no NavControls (the auth control). The header needs no click-interception
  // (unlike audio).
  useEffect(() => {
    trackPageView("/");
  }, []);

  return (
    <PageShell wordmark="Office Hours" navLinks={[]}>
      <main id="app">
        <Dashboard />
      </main>
    </PageShell>
  );
}
