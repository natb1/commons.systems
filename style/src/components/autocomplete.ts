let dropdownController: AbortController | null = null;
let activeInput: HTMLInputElement | null = null;
let listenersRegistered = false;

function clearAriaAutocomplete(el: HTMLInputElement): void {
  el.removeAttribute("aria-activedescendant");
  el.removeAttribute("aria-controls");
  el.removeAttribute("aria-autocomplete");
}

export function removeDropdown(): void {
  dropdownController?.abort();
  dropdownController = null;
  document.querySelector(".autocomplete-dropdown")?.remove();
  if (activeInput) {
    clearAriaAutocomplete(activeInput);
    activeInput = null;
  }
}

function handleOutsideClick(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest(".autocomplete-dropdown, .edit-budget, .edit-category, .edit-institution, .edit-account, .edit-target")) return;
  removeDropdown();
}

function selectItem(input: HTMLInputElement, value: string): void {
  input.value = value;
  removeDropdown();
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

export function showDropdown(input: HTMLInputElement, options: string[], filterOverride?: string): void {
  removeDropdown();
  const filter = filterOverride !== undefined ? filterOverride : input.value.toLowerCase();
  const matches = options.filter(o => {
    const lower = o.toLowerCase();
    if (lower === filter) return false;
    if (filter === "") return true;
    return lower.includes(filter);
  });
  if (matches.length === 0) {
    clearAriaAutocomplete(input);
    return;
  }

  let selectedIndex = -1;
  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  dropdown.setAttribute("role", "listbox");
  dropdown.id = "autocomplete-listbox";

  const items = matches.map((opt, i) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.setAttribute("role", "option");
    item.id = `autocomplete-option-${i}`;
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur before value is set
      selectItem(input, opt);
    });
    dropdown.appendChild(item);
    return item;
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

  activeInput = input;
  dropdownController = new AbortController();
  input.addEventListener("keydown", (e: KeyboardEvent) => {
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
  }, { signal: dropdownController.signal });

  const rect = input.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
  document.body.appendChild(dropdown);
}

/** Idempotent global listener registration for autocomplete dismiss behavior. */
export function registerAutocompleteListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;
  // Capture phase: dismiss dropdown before child scroll handlers run
  window.addEventListener("scroll", removeDropdown, true);
  window.addEventListener("resize", removeDropdown);
  document.addEventListener("click", handleOutsideClick);
}

export function _resetForTest(): void {
  if (listenersRegistered) {
    window.removeEventListener("scroll", removeDropdown, true);
    window.removeEventListener("resize", removeDropdown);
    document.removeEventListener("click", handleOutsideClick);
    listenersRegistered = false;
  }
  removeDropdown();
  activeInput = null;
}
