import { describe, it, expect } from "vitest";
import { renderAgenda } from "../src/agenda.js";

describe("renderAgenda", () => {
  it("returns a section containing a ul#reminder-list", () => {
    const el = renderAgenda();
    const list = el.querySelector("#reminder-list");
    expect(list).not.toBeNull();
    expect(list?.tagName).toBe("UL");
  });

  it("includes the empty-state placeholder text", () => {
    const el = renderAgenda();
    expect(el.textContent).toContain("No reminders.");
  });
});
