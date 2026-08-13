import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { pageData } from "./page-data.js";

const mount = document.getElementById("plan-view-root");
if (mount === null) {
  // Boundary validation, not a fallback: the mount point is emitted by the same
  // build that emits this bundle, so its absence means the assembler changed
  // and the page would otherwise render blank with no explanation.
  throw new Error("plan-view: #plan-view-root missing — the page assembler did not emit it");
}
createRoot(mount).render(<App data={pageData} />);
