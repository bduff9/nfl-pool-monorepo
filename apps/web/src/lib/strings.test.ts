import { describe, expect, it } from "vitest";

import { addCustomStyling, getAbbreviation, getBackgroundColor, getShortQuarter, parseDragData } from "./strings";

describe("getAbbreviation", () => {
  it("returns first letters of each word, uppercased", () => {
    expect(getAbbreviation("National Football League")).toBe("NFL");
  });

  it("handles single word", () => {
    expect(getAbbreviation("Championship")).toBe("C");
  });

  it("handles lowercase input", () => {
    expect(getAbbreviation("american football conference")).toBe("AFC");
  });

  it("handles empty string", () => {
    expect(getAbbreviation("")).toBe("");
  });
});

describe("getBackgroundColor", () => {
  it("returns the default color when value is 0", () => {
    expect(getBackgroundColor(0, 16)).toBe("#fff");
  });

  it("returns a custom default color when value is 0", () => {
    expect(getBackgroundColor(0, 16, "#000")).toBe("#000");
  });

  it("returns pure green (0, 255, 0) when value equals maxValue", () => {
    expect(getBackgroundColor(16, 16)).toBe("rgb(0, 255, 0)");
  });

  it("returns an RGB string for intermediate values", () => {
    const result = getBackgroundColor(8, 16);
    expect(result).toMatch(/^rgb\(\d+, \d+, 0\)$/);
  });

  it("returns yellow-ish at the midpoint", () => {
    const result = getBackgroundColor(8, 16);
    expect(result).toBe("rgb(255, 255, 0)");
  });

  it("returns red-ish for low values relative to max", () => {
    const result = getBackgroundColor(1, 16);
    const match = result.match(/^rgb\((\d+), (\d+), 0\)$/);
    expect(match).not.toBeNull();
    const red = parseInt(match?.[1] ?? "0", 10);
    const green = parseInt(match?.[2] ?? "0", 10);
    expect(red).toBeGreaterThan(green);
  });
});

describe("getShortQuarter", () => {
  it("returns 'OT' for 'Overtime'", () => {
    expect(getShortQuarter("Overtime")).toBe("OT");
  });

  it("returns 'Half' for 'Half Time'", () => {
    expect(getShortQuarter("Half Time")).toBe("Half");
  });

  it("abbreviates standard quarters", () => {
    expect(getShortQuarter("1st Quarter")).toBe("Q1");
    expect(getShortQuarter("2nd Quarter")).toBe("Q2");
    expect(getShortQuarter("3rd Quarter")).toBe("Q3");
    expect(getShortQuarter("4th Quarter")).toBe("Q4");
  });

  it("returns empty string for empty input", () => {
    expect(getShortQuarter("")).toBe("");
  });
});

describe("addCustomStyling", () => {
  it("injects style block before closing </head>", () => {
    const html = "<html><head><title>Test</title></head><body></body></html>";
    const result = addCustomStyling(html);
    expect(result).toContain(".hide-for-browser");
    expect(result).toContain("</head>");
    expect(result.indexOf(".hide-for-browser")).toBeLessThan(result.indexOf("</head>"));
  });

  it("returns HTML unchanged when no </head> tag exists", () => {
    const html = "<html><body>No head tag</body></html>";
    const result = addCustomStyling(html);
    expect(result).toBe(html);
  });
});

describe("parseDragData", () => {
  it("parses point-bank to home-pick drag correctly", () => {
    const [points, source, dest] = parseDragData("point-5", "pointBank", "home-pick-for-game-101");
    expect(points).toBe(5);
    expect(source).toEqual({ gameID: null, type: "pointBank" });
    expect(dest).toEqual({ gameID: 101, type: "home" });
  });

  it("parses game-to-game drag (visitor to home)", () => {
    const [points, source, dest] = parseDragData("point-3", "visitor-pick-for-game-200", "home-pick-for-game-300");
    expect(points).toBe(3);
    expect(source).toEqual({ gameID: 200, type: "visitor" });
    expect(dest).toEqual({ gameID: 300, type: "home" });
  });

  it("parses drag back to point bank", () => {
    const [points, source, dest] = parseDragData("point-12", "home-pick-for-game-150", "pointBank");
    expect(points).toBe(12);
    expect(source).toEqual({ gameID: 150, type: "home" });
    expect(dest).toEqual({ gameID: null, type: "pointBank" });
  });

  it("returns null destination when destinationID is omitted", () => {
    const [points, source, dest] = parseDragData("point-1", "pointBank");
    expect(points).toBe(1);
    expect(source).toEqual({ gameID: null, type: "pointBank" });
    expect(dest).toBeNull();
  });

  it("returns 0 points when id does not match point pattern", () => {
    const [points] = parseDragData("something-else", "pointBank", "home-pick-for-game-101");
    expect(points).toBe(0);
  });

  it("returns null source when sourceID does not match any pattern", () => {
    const [, source] = parseDragData("point-1", "unknown-format");
    expect(source).toBeNull();
  });
});
