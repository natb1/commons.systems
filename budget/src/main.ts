import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderBudgets } from "./pages/budgets.js";
import { renderRules } from "./pages/rules.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import type { RenderPageOptions } from "./pages/render-options.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { hydrateCategorySankey } from "./pages/home-chart.js";
import { hydrateBudgetTable, hydrateBudgetChart } from "./pages/budgets-hydrate.js";
import { hydrateRulesTable } from "./pages/rules-hydrate.js";
import { trackPageView } from "./firebase.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { parseUploadedJson, toParsedData, UploadValidationError } from "./upload.js";
import { storeParsedData, clearAll, hasData, getMeta } from "./idb.js";
import { FirestoreSeedDataSource, IdbDataSource, type DataSource } from "./data-source.js";
import { setActiveDataSource } from "./active-data-source.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app") as HTMLElement;
if (!app) throw new Error("#app element not found");

export type AppState =
  | { source: "seed" }
  | { source: "local"; groupName: string };

let state: AppState = { source: "seed" };

navEl.links = [{ href: "/", label: "budgets" }, { href: "/transactions", label: "transactions" }, { href: "/rules", label: "rules" }];
navEl.showAuth = false;

// File upload UI
const uploadContainer = document.createElement("div");
uploadContainer.className = "nav-upload";
uploadContainer.innerHTML = `<label class="upload-label" tabindex="0">Load data<input type="file" accept=".json" class="upload-input" hidden></label>`;
const authContainer = navEl.querySelector(".nav-auth");
if (authContainer) {
  authContainer.appendChild(uploadContainer);
}

const uploadInput = uploadContainer.querySelector(".upload-input") as HTMLInputElement;
const uploadLabel = uploadContainer.querySelector(".upload-label") as HTMLLabelElement;

// Group name + clear button (shown when local data is loaded)
const localInfoContainer = document.createElement("div");
localInfoContainer.className = "nav-local-info";
localInfoContainer.hidden = true;
localInfoContainer.innerHTML = `<span class="local-group-name"></span><button class="clear-data">Clear data</button>`;
if (authContainer) {
  authContainer.appendChild(localInfoContainer);
}

const groupNameSpan = localInfoContainer.querySelector(".local-group-name") as HTMLSpanElement;
const clearButton = localInfoContainer.querySelector(".clear-data") as HTMLButtonElement;

// Error display
const errorEl = document.createElement("p");
errorEl.className = "upload-error";
errorEl.hidden = true;
if (authContainer) {
  authContainer.appendChild(errorEl);
}

function showUploadError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearUploadError(): void {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function updateNav(): void {
  if (state.source === "local") {
    uploadContainer.hidden = true;
    localInfoContainer.hidden = false;
    groupNameSpan.textContent = state.groupName;
  } else {
    uploadContainer.hidden = false;
    localInfoContainer.hidden = true;
  }
}

function createDataSource(): DataSource {
  if (state.source === "local") {
    return new IdbDataSource();
  }
  return new FirestoreSeedDataSource();
}

function renderOptions(): RenderPageOptions {
  const ds = createDataSource();
  setActiveDataSource(ds);
  return {
    authorized: state.source === "local",
    groupName: state.source === "local" ? state.groupName : "",
    dataSource: ds,
  };
}

const router = createHistoryRouter(
  app,
  [
    { path: "/", render: () => renderBudgets(renderOptions()) },
    { path: "/transactions", render: () => renderHome(renderOptions()) },
    { path: "/rules", render: () => renderRules(renderOptions()) },
  ],
  {
    onNavigate: ({ path }) => trackPageView(path),
    formatError: (error) => {
      if (error instanceof DataIntegrityError || error instanceof RangeError)
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

function transition(next: AppState): void {
  state = next;
  updateNav();
  clearUploadError();
  router.navigate();
}

// Hydrate interactive containers (tables, chart) whenever they appear in the DOM.
// Multiple code paths trigger renders (navigation, auth state changes), so an
// observer catches all of them. Sets dataset.hydrated to "true" on success or
// "error" on failure to prevent retry loops.
// Observer runs for page lifetime: each render replaces page content, so
// containers start unhydrated and need re-initialization.
function hydrateTable(
  selector: string,
  hydrate: (el: HTMLElement) => void,
  errorLabel?: string,
): void {
  const table = app.querySelector(selector) as HTMLElement | null;
  if (!table || table.dataset.hydrated) return;
  try {
    hydrate(table);
    table.dataset.hydrated = "true";
  } catch (error) {
    table.dataset.hydrated = "error";
    if (error instanceof TypeError || error instanceof ReferenceError) {
      setTimeout(() => { throw error; }, 0);
      return;
    }
    console.error("Hydration error:", error);
    table.querySelectorAll("input, select").forEach((el) => {
      (el as HTMLInputElement | HTMLSelectElement).disabled = true;
    });
    const msg = document.createElement("p");
    msg.textContent = error instanceof DataIntegrityError
      ? "A data error occurred. Please contact support."
      : errorLabel
        ? `${errorLabel} is temporarily unavailable. Try refreshing the page.`
        : "Editing is temporarily unavailable. Try refreshing the page.";
    table.appendChild(msg);
  }
}

const observer = new MutationObserver(() => {
  hydrateTable("#category-sankey", hydrateCategorySankey, "Chart rendering");
  hydrateTable("#transactions-table", hydrateTransactionTable);
  hydrateTable("#budgets-chart", hydrateBudgetChart);
  hydrateTable("#budgets-table", hydrateBudgetTable);
  hydrateTable("#rules-table", hydrateRulesTable);
});
observer.observe(app, { childList: true, subtree: true });

// File upload handler
async function handleFileUpload(file: File): Promise<void> {
  clearUploadError();
  try {
    const text = await file.text();
    const parsed = parseUploadedJson(text);
    const data = toParsedData(parsed);
    await storeParsedData(data);
    transition({ source: "local", groupName: parsed.groupName });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      showUploadError(error.message);
      return;
    }
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    console.error("Upload failed:", error);
    showUploadError("Upload failed. Please try again.");
  }
}

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (file) {
    handleFileUpload(file).catch((error) => {
      console.error("Unhandled upload error:", error);
    });
  }
  // Reset so the same file can be re-uploaded
  uploadInput.value = "";
});

// Allow keyboard activation of the label
uploadLabel.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    uploadInput.click();
  }
});

// Clear data handler
clearButton.addEventListener("click", async () => {
  try {
    await clearAll();
    transition({ source: "seed" });
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
});

// Startup: check for existing local data
async function initialize(): Promise<void> {
  const hasLocalData = await hasData();
  if (hasLocalData) {
    const meta = await getMeta();
    if (meta) {
      transition({ source: "local", groupName: meta.groupName });
      return;
    }
  }
  transition({ source: "seed" });
}

initialize().catch((error) => {
  console.error("Initialization error:", error);
  transition({ source: "seed" });
});
