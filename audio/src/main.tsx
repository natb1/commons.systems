import "missing.css";
import "@commons-systems/ds/tokens/colors.css";
import "@commons-systems/ds/tokens/typography.css";
import "@commons-systems/ds/tokens/spacing.css";
import "@commons-systems/ds/tokens/effects.css";
import "./style/theme.css";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

createRoot(document.getElementById("root")!).render(<App />);
