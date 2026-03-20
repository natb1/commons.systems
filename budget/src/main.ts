import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderBudgets } from "./pages/budgets.js";
import { renderAccounts } from "./pages/accounts.js";
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
import { storeParsedData, clearAll, getMeta } from "./idb.js";
import { FirestoreSeedDataSource, IdbDataSource, type DataSource } from "./data-source.js";
import { setActiveDataSource } from "./active-data-source.js";
import { exportToJson } from "./export.js";
import { isEncrypted, decrypt, encrypt } from "./crypto.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app") as HTMLElement;
if (!app) throw new Error("#app element not found");

export type AppState =
  | { source: "seed" }
  | { source: "local"; groupName: string };

let state: AppState = { source: "seed" };
let importPassword: string | null = null;

navEl.links = [{ href: "/", label: "budgets" }, { href: "/transactions", label: "transactions" }, { href: "/accounts", label: "accounts" }, { href: "/rules", label: "rules" }];
navEl.showAuth = false;

// File upload UI
const uploadContainer = document.createElement("div");
uploadContainer.className = "nav-upload";
uploadContainer.innerHTML = `<label class="upload-label" tabindex="0">Load data<input type="file" accept=".json,.benc" class="upload-input" hidden></label>`;
const authContainer = navEl.querySelector(".nav-auth");
if (!authContainer) throw new Error(".nav-auth container not found in nav element");
authContainer.appendChild(uploadContainer);

const uploadInput = uploadContainer.querySelector(".upload-input") as HTMLInputElement;
const uploadLabel = uploadContainer.querySelector(".upload-label") as HTMLLabelElement;

// Group name, export button, and clear button (shown when local data is loaded)
const localInfoContainer = document.createElement("div");
localInfoContainer.className = "nav-local-info";
localInfoContainer.hidden = true;
localInfoContainer.innerHTML = `<span class="local-group-name"></span><button class="export-data">Export</button><button class="clear-data">Clear data</button>`;
authContainer.appendChild(localInfoContainer);

const groupNameSpan = localInfoContainer.querySelector(".local-group-name") as HTMLSpanElement;
const exportButton = localInfoContainer.querySelector(".export-data") as HTMLButtonElement;
const clearButton = localInfoContainer.querySelector(".clear-data") as HTMLButtonElement;

// Error display
const errorEl = document.createElement("p");
errorEl.className = "nav-error";
errorEl.hidden = true;
authContainer.appendChild(errorEl);

function showNavError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearNavError(): void {
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
    { path: "/accounts", render: () => renderAccounts(renderOptions()) },
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
  clearNavError();
  router.navigate();
}

// Hydrate interactive containers (tables, chart) whenever they appear in the DOM.
// Multiple code paths trigger renders (navigation, data source changes), so an
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

function promptPassword(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "password-dialog";

    const form = document.createElement("form");
    form.method = "dialog";

    const p = document.createElement("p");
    p.textContent = message;

    const input = document.createElement("input");
    input.type = "password";
    input.className = "password-input";
    input.autocomplete = "off";

    const actions = document.createElement("div");
    actions.className = "password-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "password-submit";
    submitBtn.textContent = "Submit";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "password-cancel";
    cancelBtn.textContent = "Cancel";

    actions.appendChild(submitBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(p);
    form.appendChild(input);
    form.appendChild(actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    cancelBtn.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    });
    dialog.addEventListener("cancel", () => {
      dialog.remove();
      resolve(null);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value;
      dialog.close();
      dialog.remove();
      resolve(value);
    });
    dialog.showModal();
    input.focus();
  });
}

async function handleFileUpload(file: File): Promise<void> {
  clearNavError();
  try {
    const buffer = await file.arrayBuffer();
    let text: string;
    let pw: string | null = null;
    if (isEncrypted(buffer)) {
      pw = await promptPassword("Enter password to decrypt");
      if (pw === null) return;
      text = await decrypt(buffer, pw);
    } else {
      text = new TextDecoder().decode(buffer);
    }
    const parsed = parseUploadedJson(text);
    const data = toParsedData(parsed);
    await storeParsedData(data);
    importPassword = pw;
    transition({ source: "local", groupName: parsed.groupName });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      showNavError(error.message);
      return;
    }
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    console.error("Upload failed:", error);
    showNavError("Upload failed. Please try again.");
  }
}

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (file) {
    handleFileUpload(file).catch((error) => {
      if (error instanceof TypeError || error instanceof ReferenceError) {
        setTimeout(() => { throw error; }, 0);
        return;
      }
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

exportButton.addEventListener("click", async () => {
  try {
    const json = await exportToJson();
    let blob: Blob;
    if (importPassword) {
      const encrypted = await encrypt(json, importPassword);
      blob = new Blob([encrypted], { type: "application/octet-stream" });
    } else {
      blob = new Blob([json], { type: "application/json" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    const groupName = state.source === "local" ? state.groupName : "budget";
    a.download = `budget-${groupName}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    console.error("Export failed:", error);
    showNavError(error instanceof Error ? error.message : "Export failed. Please try again.");
  }
});

clearButton.addEventListener("click", async () => {
  try {
    await clearAll();
    importPassword = null;
    transition({ source: "seed" });
  } catch (error) {
    if (error instanceof TypeError || error instanceof ReferenceError) throw error;
    console.error("Failed to clear data:", error);
    showNavError("Failed to clear data. Try closing other tabs or refreshing the page.");
  }
});

// Startup: check for existing local data
async function initialize(): Promise<void> {
  const meta = await getMeta();
  if (meta) {
    transition({ source: "local", groupName: meta.groupName });
    return;
  }
  transition({ source: "seed" });
}

initialize().catch((error) => {
  if (error instanceof TypeError || error instanceof ReferenceError) throw error;
  console.error("Initialization error:", error);
  showNavError("Could not load saved data. You may need to re-upload your file.");
  transition({ source: "seed" });
});
