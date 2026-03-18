import { describe, it, expect } from "vitest";
import {
  spreadsForPageCount,
  spreadIndexForPage,
  spreadPositionLabel,
} from "../../src/viewer/spread";

describe("spreadsForPageCount", () => {
  it("returns empty array for 0 pages", () => {
    expect(spreadsForPageCount(0)).toEqual([]);
  });

  it("returns solo cover for 1 page", () => {
    expect(spreadsForPageCount(1)).toEqual([{ left: 1, right: null }]);
  });

  it("returns cover + solo back for 2 pages", () => {
    expect(spreadsForPageCount(2)).toEqual([
      { left: 1, right: null },
      { left: 2, right: null },
    ]);
  });

  it("returns cover + one pair for 3 pages", () => {
    expect(spreadsForPageCount(3)).toEqual([
      { left: 1, right: null },
      { left: 2, right: 3 },
    ]);
  });

  it("returns cover + pair + solo back for 5 pages", () => {
    expect(spreadsForPageCount(5)).toEqual([
      { left: 1, right: null },
      { left: 2, right: 3 },
      { left: 4, right: 5 },
    ]);
  });

  it("returns cover + two pairs + solo back for 6 pages", () => {
    expect(spreadsForPageCount(6)).toEqual([
      { left: 1, right: null },
      { left: 2, right: 3 },
      { left: 4, right: 5 },
      { left: 6, right: null },
    ]);
  });

  it("returns cover + three pairs for 7 pages", () => {
    expect(spreadsForPageCount(7)).toEqual([
      { left: 1, right: null },
      { left: 2, right: 3 },
      { left: 4, right: 5 },
      { left: 6, right: 7 },
    ]);
  });

  it("returns correct spreads for 20 pages", () => {
    const spreads = spreadsForPageCount(20);
    expect(spreads).toHaveLength(11);
    expect(spreads[0]).toEqual({ left: 1, right: null });
    expect(spreads[1]).toEqual({ left: 2, right: 3 });
    expect(spreads[9]).toEqual({ left: 18, right: 19 });
    expect(spreads[10]).toEqual({ left: 20, right: null });
  });
});

describe("spreadIndexForPage", () => {
  describe("6-page document", () => {
    it("page 1 maps to spread 0", () => {
      expect(spreadIndexForPage(1, 6)).toBe(0);
    });

    it("page 2 maps to spread 1", () => {
      expect(spreadIndexForPage(2, 6)).toBe(1);
    });

    it("page 3 maps to spread 1", () => {
      expect(spreadIndexForPage(3, 6)).toBe(1);
    });

    it("page 4 maps to spread 2", () => {
      expect(spreadIndexForPage(4, 6)).toBe(2);
    });

    it("page 5 maps to spread 2", () => {
      expect(spreadIndexForPage(5, 6)).toBe(2);
    });

    it("page 6 maps to spread 3", () => {
      expect(spreadIndexForPage(6, 6)).toBe(3);
    });
  });

  describe("7-page document", () => {
    it("page 1 maps to spread 0", () => {
      expect(spreadIndexForPage(1, 7)).toBe(0);
    });

    it("page 2 maps to spread 1", () => {
      expect(spreadIndexForPage(2, 7)).toBe(1);
    });

    it("page 3 maps to spread 1", () => {
      expect(spreadIndexForPage(3, 7)).toBe(1);
    });

    it("page 4 maps to spread 2", () => {
      expect(spreadIndexForPage(4, 7)).toBe(2);
    });

    it("page 5 maps to spread 2", () => {
      expect(spreadIndexForPage(5, 7)).toBe(2);
    });

    it("page 6 maps to spread 3", () => {
      expect(spreadIndexForPage(6, 7)).toBe(3);
    });

    it("page 7 maps to spread 3", () => {
      expect(spreadIndexForPage(7, 7)).toBe(3);
    });
  });
});

describe("spreadPositionLabel", () => {
  it("returns solo label for spread with no right page", () => {
    expect(spreadPositionLabel({ left: 1, right: null }, 7)).toBe(
      "Page 1 / 7",
    );
  });

  it("returns solo label for back cover of even-page document", () => {
    expect(spreadPositionLabel({ left: 6, right: null }, 6)).toBe(
      "Page 6 / 6",
    );
  });

  it("returns paired label with en-dash for two-page spread", () => {
    expect(spreadPositionLabel({ left: 2, right: 3 }, 7)).toBe(
      "Pages 2\u20133 / 7",
    );
  });

  it("returns paired label for last spread of odd-page document", () => {
    expect(spreadPositionLabel({ left: 6, right: 7 }, 7)).toBe(
      "Pages 6\u20137 / 7",
    );
  });
});
