import { updateTransaction } from "../firestore.js";

function getOptions(input: HTMLInputElement, container: HTMLElement): string[] {
  let raw: string | undefined;
  if (input.classList.contains("edit-budget")) {
    raw = container.dataset.budgetOptions;
  } else if (input.classList.contains("edit-category")) {
    raw = container.dataset.categoryOptions;
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error("Autocomplete options is not an array:", typeof parsed);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse autocomplete options:", raw, error);
    return [];
  }
}

function removeDropdown(): void {
  document.querySelector(".autocomplete-dropdown")?.remove();
}

function handleOutsideClick(e: Event): void {
  if (!(e.target as HTMLElement).closest(".autocomplete-dropdown")) {
    removeDropdown();
  }
}

let listenersRegistered = false;

function showInputError(input: HTMLInputElement): void {
  input.value = input.defaultValue;
  input.classList.add("save-error");
  setTimeout(() => input.classList.remove("save-error"), 2000);
}

function showDropdown(input: HTMLInputElement, options: string[]): void {
  removeDropdown();
  const value = input.value;
  const filter = value.toLowerCase();
  const matches = options.filter(o => {
    const lower = o.toLowerCase();
    if (lower === filter) return false;
    return !filter || lower.includes(filter);
  });
  if (matches.length === 0) return;

  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  for (const opt of matches) {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur before value is set
      input.value = opt;
      removeDropdown();
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    });
    dropdown.appendChild(item);
  }

  const rect = input.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
  document.body.appendChild(dropdown);
}

export function hydrateTransactionTable(container: HTMLElement): void {
  if (!listenersRegistered) {
    listenersRegistered = true;
    window.addEventListener("scroll", removeDropdown, true);
    document.addEventListener("click", handleOutsideClick);
  }

  // Prevent accordion toggle when clicking inputs inside summary
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("summary") && target.closest("input")) {
      e.preventDefault();
    }
  });

  function handleAutocomplete(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.tagName !== "INPUT") return;
    const options = getOptions(input, container);
    if (options.length > 0) showDropdown(input, options);
  }

  // Show autocomplete dropdown on focus and filter as user types
  container.addEventListener("focus", handleAutocomplete, true);
  container.addEventListener("input", handleAutocomplete);

  container.addEventListener("blur", async (e) => {
    const target = e.target as HTMLElement;
    removeDropdown();

    const row = target.closest(".txn-row");
    const txnId = (row as HTMLElement)?.dataset.txnId;
    if (!txnId) return;

    const input = target as HTMLInputElement;
    // Skip save if value hasn't changed (also prevents double-save from synthetic + real blur)
    if (input.value === input.defaultValue) return;

    try {
      if (input.classList.contains("edit-note")) {
        await updateTransaction(txnId, { note: input.value });
      } else if (input.classList.contains("edit-category")) {
        await updateTransaction(txnId, { category: input.value });
      } else if (input.classList.contains("edit-reimbursement")) {
        const reimbursement = Number(input.value);
        if (!Number.isFinite(reimbursement)) {
          showInputError(input);
          return;
        }
        await updateTransaction(txnId, { reimbursement });
      } else if (input.classList.contains("edit-budget")) {
        await updateTransaction(txnId, { budget: input.value || null });
      } else {
        return;
      }
      input.defaultValue = input.value;
    } catch (error) {
      console.error("Failed to save transaction:", error);
      showInputError(input);
    }
  }, true);
}
