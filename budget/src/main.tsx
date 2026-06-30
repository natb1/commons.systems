import "missing.css";
import "@commons-systems/ds/tokens/colors.css";
import "@commons-systems/ds/tokens/typography.css";
import "@commons-systems/ds/tokens/spacing.css";
import "@commons-systems/ds/tokens/effects.css";
import "./style/theme.css";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

// createRoot (not hydrateRoot): the body is a single <div id="root"> in
// index.html; the React tree is mounted client-side. (Unit 6 reworks the
// prerender step; ds token CSS imports land in Unit 5.)
createRoot(document.getElementById("root")!).render(<App />);
