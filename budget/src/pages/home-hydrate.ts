import { updateTransaction } from "../firestore.js";

function parseJsonArray(raw: string | undefined): string[] {
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
  const active = document.querySelector("[aria-controls='autocomplete-listbox']") as HTMLElement | null;
  if (active) {
    active.removeAttribute("aria-activedescendant");
    active.removeAttribute("aria-controls");
    active.removeAttribute("aria-autocomplete");
  }
}

function handleOutsideClick(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest(".autocomplete-dropdown")) return;
  if (target.closest(".edit-budget") || target.closest(".edit-category")) return;
  removeDropdown();
}

let listenersRegistered = false;

function showInputError(input: HTMLInputElement): void {
  input.value = input.defaultValue;
  input.classList.add("save-error");
  input.title = "Save failed \u2014 value reverted";
  setTimeout(() => {
    input.classList.remove("save-error");
    input.title = "";
  }, 2000);
}

function selectItem(input: HTMLInputElement, value: string): void {
  input.value = value;
  removeDropdown();
  input.dispatchEvent(new Event("blur", { bubbles: true }));
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
  if (matches.length === 0) {
    input.removeAttribute("aria-activedescendant");
    input.removeAttribute("aria-controls");
    input.removeAttribute("aria-autocomplete");
    return;
  }

  let selectedIndex = -1;
  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  dropdown.setAttribute("role", "listbox");
  dropdown.id = "autocomplete-listbox";

  const items: HTMLElement[] = [];
  matches.forEach((opt, i) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.setAttribute("role", "option");
    item.id = `autocomplete-option-${i}`;
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur before value is set
      selectItem(input, opt);
    });
    items.push(item);
    dropdown.appendChild(item);
  });

  function updateSelection(index: number): void {
    items.forEach((el) => el.classList.remove("selected"));
    selectedIndex = index;
    if (index >= 0 && index < items.length) {
      items[index].classList.add("selected");
      input.setAttribute("aria-activedescendant", items[index].id);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "autocomplete-listbox");

  input.addEventListener("keydown", function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      updateSelection(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateSelection(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectItem(input, matches[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      removeDropdown();
    }
  });

  const rect = input.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
  document.body.appendChild(dropdown);
}

export function _resetForTest(): void {
  if (listenersRegistered) {
    window.removeEventListener("scroll", removeDropdown, true);
    document.removeEventListener("click", handleOutsideClick);
    listenersRegistered = false;
  }
  removeDropdown();
}

export function hydrateTransactionTable(container: HTMLElement): void {
  if (!listenersRegistered) {
    listenersRegistered = true;
    window.addEventListener("scroll", removeDropdown, true);
    document.addEventListener("click", handleOutsideClick);
  }

  const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
  const categoryOptions = parseJsonArray(container.dataset.categoryOptions);

  function getOptionsForInput(input: HTMLInputElement): string[] {
    if (input.classList.contains("edit-budget")) return budgetOptions;
    if (input.classList.contains("edit-category")) return categoryOptions;
    return [];
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
    const options = getOptionsForInput(input);
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
