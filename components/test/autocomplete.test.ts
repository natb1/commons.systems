/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  showDropdown,
  removeDropdown,
  registerAutocompleteListeners,
  _resetForTest,
} from "../src/autocomplete";

function createInput(): HTMLInputElement {
  const input = document.createElement("input");
  input.setAttribute("data-autocomplete", "");
  document.body.appendChild(input);
  return input;
}

function getDropdown(): HTMLDivElement | null {
  return document.querySelector(".autocomplete-dropdown");
}

function getItems(): NodeListOf<HTMLDivElement> {
  return document.querySelectorAll(".autocomplete-item");
}

function pressKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

function expectAriaCleared(input: HTMLInputElement): void {
  expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  expect(input.hasAttribute("aria-controls")).toBe(false);
  expect(input.hasAttribute("aria-autocomplete")).toBe(false);
}

describe("showDropdown", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTest();
  });

  it("renders dropdown with filtered options; exact match is excluded", () => {
    const input = createInput();
    input.value = "foo";
    showDropdown(input, ["Food", "Foo", "Bar"]);
    const items = getItems();
    // "Food" contains "foo" → included; "Foo" is exact match → excluded; "Bar" → excluded
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe("Food");
  });

  it("shows all options when input is empty", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Alpha", "Beta", "Gamma"]);
    expect(getItems()).toHaveLength(3);
  });

  it("uses filterOverride instead of input value", () => {
    const input = createInput();
    input.value = "ignored";
    // filterOverride is used as-is (not lowercased), unlike input.value
    showDropdown(input, ["Alpha", "Beta"], "al");
    const items = getItems();
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe("Alpha");
  });

  it("does not render dropdown when no matches", () => {
    const input = createInput();
    input.value = "zzz";
    showDropdown(input, ["Alpha", "Beta"]);
    expect(getDropdown()).toBeNull();
  });

  it("clears ARIA attributes when no matches", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Alpha"]);
    expect(input.getAttribute("aria-autocomplete")).toBe("list");

    input.value = "zzz";
    showDropdown(input, ["Alpha"]);
    expectAriaCleared(input);
  });

  it("sets ARIA attributes on the input", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Alpha"]);
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-controls")).toBe("autocomplete-listbox");
  });

  it("sets role=listbox on dropdown and role=option on items", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A", "B"]);
    expect(getDropdown()!.getAttribute("role")).toBe("listbox");
    const items = getItems();
    expect(items[0].getAttribute("role")).toBe("option");
    expect(items[1].getAttribute("role")).toBe("option");
  });

  it("mousedown on item selects it and removes dropdown", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Apple", "Banana"]);

    let blurred = false;
    input.addEventListener("blur", () => { blurred = true; });

    const items = getItems();
    items[0].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(input.value).toBe("Apple");
    expect(getDropdown()).toBeNull();
    expect(blurred).toBe(true);
  });
});

describe("keyboard navigation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTest();
  });

  it("ArrowDown cycles through items and wraps", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A", "B", "C"]);
    const items = getItems();

    pressKey(input, "ArrowDown");
    expect(items[0].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-0");

    pressKey(input, "ArrowDown");
    expect(items[1].classList.contains("selected")).toBe(true);
    expect(items[0].classList.contains("selected")).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-1");

    pressKey(input, "ArrowDown");
    expect(items[2].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-2");

    // Wrap to first
    pressKey(input, "ArrowDown");
    expect(items[0].classList.contains("selected")).toBe(true);
    expect(items[2].classList.contains("selected")).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-0");
  });

  it("ArrowUp cycles through items and wraps", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A", "B", "C"]);
    const items = getItems();

    // First ArrowUp wraps to last item
    pressKey(input, "ArrowUp");
    expect(items[2].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-2");

    pressKey(input, "ArrowUp");
    expect(items[1].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-1");

    pressKey(input, "ArrowUp");
    expect(items[0].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-0");

    // Wrap to last
    pressKey(input, "ArrowUp");
    expect(items[2].classList.contains("selected")).toBe(true);
    expect(input.getAttribute("aria-activedescendant")).toBe("autocomplete-option-2");
  });

  it("Enter selects highlighted item, sets value, removes dropdown, and dispatches blur", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Apple", "Banana"]);

    let blurred = false;
    input.addEventListener("blur", () => { blurred = true; });

    pressKey(input, "ArrowDown");
    pressKey(input, "Enter");

    expect(input.value).toBe("Apple");
    expect(getDropdown()).toBeNull();
    expect(blurred).toBe(true);
    expectAriaCleared(input);
  });

  it("Enter does nothing when no item is selected", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Apple"]);

    pressKey(input, "Enter");
    expect(getDropdown()).not.toBeNull();
    expect(input.value).toBe("");
  });

  it("Escape dismisses dropdown and clears ARIA attributes", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["Alpha"]);
    expect(getDropdown()).not.toBeNull();

    pressKey(input, "Escape");
    expect(getDropdown()).toBeNull();
    expectAriaCleared(input);
  });
});

describe("removeDropdown", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTest();
  });

  it("removes DOM element and clears ARIA attributes", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);
    expect(getDropdown()).not.toBeNull();

    removeDropdown();
    expect(getDropdown()).toBeNull();
    expectAriaCleared(input);
  });

  it("aborts keydown listener", () => {
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A", "B"]);

    removeDropdown();

    // Re-create dropdown to verify old listener is gone
    showDropdown(input, ["X", "Y"]);
    // ArrowDown should start fresh at index 0
    pressKey(input, "ArrowDown");
    const items = getItems();
    expect(items[0].classList.contains("selected")).toBe(true);
  });

  it("is safe to call when no dropdown exists", () => {
    expect(() => removeDropdown()).not.toThrow();
  });
});

describe("registerAutocompleteListeners", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTest();
  });

  it("outside click dismisses dropdown", () => {
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);
    expect(getDropdown()).not.toBeNull();

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    outside.click();

    expect(getDropdown()).toBeNull();
  });

  it("click inside dropdown does not dismiss it", () => {
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);

    getDropdown()!.click();
    expect(getDropdown()).not.toBeNull();
  });

  it("click on autocomplete input does not dismiss dropdown", () => {
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);

    input.click();
    expect(getDropdown()).not.toBeNull();
  });

  it("scroll within grace period does not dismiss dropdown", () => {
    vi.useFakeTimers();
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);
    expect(getDropdown()).not.toBeNull();

    window.dispatchEvent(new Event("scroll"));
    expect(getDropdown()).not.toBeNull();
    vi.useRealTimers();
  });

  it("scroll after grace period dismisses dropdown", () => {
    vi.useFakeTimers();
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);
    expect(getDropdown()).not.toBeNull();

    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event("scroll"));
    expect(getDropdown()).toBeNull();
    vi.useRealTimers();
  });

  it("resize dismisses dropdown", () => {
    registerAutocompleteListeners();
    const input = createInput();
    input.value = "";
    showDropdown(input, ["A"]);
    expect(getDropdown()).not.toBeNull();

    window.dispatchEvent(new Event("resize"));

    expect(getDropdown()).toBeNull();
  });
});
