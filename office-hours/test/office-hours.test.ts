import { describe, it, expect } from "vitest";
import { renderOfficeHours } from "../src/office-hours.js";

describe("renderOfficeHours", () => {
  it("returns a section containing a ul#reminder-list", () => {
    const el = renderOfficeHours();
    const list = el.querySelector("#reminder-list");
    expect(list).not.toBeNull();
    expect(list?.tagName).toBe("UL");
  });

  it("includes the empty-state placeholder text", () => {
    const el = renderOfficeHours();
    expect(el.textContent).toContain("No reminders.");
  });
});
