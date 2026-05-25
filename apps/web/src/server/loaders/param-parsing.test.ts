import { type } from "arktype";
import { describe, expect, it } from "vitest";

import { coerceNumber, parseJsonParam } from "./param-parsing";

describe("parseJsonParam", () => {
  const numberArraySchema = type("number[]");

  it("parses a valid JSON string through the schema", () => {
    const result = parseJsonParam("[1, 2, 3]", numberArraySchema, []);
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns the default when value is null", () => {
    const result = parseJsonParam(null, numberArraySchema, [99]);
    expect(result).toEqual([99]);
  });

  it("returns the default when value is undefined", () => {
    const result = parseJsonParam(undefined, numberArraySchema, [42]);
    expect(result).toEqual([42]);
  });

  it("returns the default when value is an empty string", () => {
    const result = parseJsonParam("", numberArraySchema, [0]);
    expect(result).toEqual([0]);
  });

  it("returns the default when JSON is malformed", () => {
    const result = parseJsonParam("{not valid json", numberArraySchema, []);
    expect(result).toEqual([]);
  });

  it("returns the default when schema validation fails", () => {
    const result = parseJsonParam('["a", "b"]', numberArraySchema, []);
    expect(result).toEqual([]);
  });

  it("accepts already-parsed values (non-string)", () => {
    const result = parseJsonParam([1, 2, 3], numberArraySchema, []);
    expect(result).toEqual([1, 2, 3]);
  });

  it("works with object schemas", () => {
    const objSchema = type({ age: "number", name: "string" });
    const result = parseJsonParam('{"name":"Brian","age":30}', objSchema, { age: 0, name: "" });
    expect(result).toEqual({ age: 30, name: "Brian" });
  });

  it("returns the default when parsed object fails schema", () => {
    const objSchema = type({ age: "number", name: "string" });
    const defaultVal = { age: 0, name: "default" };
    const result = parseJsonParam('{"name":123}', objSchema, defaultVal);
    expect(result).toEqual(defaultVal);
  });
});

describe("coerceNumber", () => {
  it("returns the number when value is already a number", () => {
    expect(coerceNumber(42, 0)).toBe(42);
  });

  it("coerces a numeric string to a number", () => {
    expect(coerceNumber("123", 0)).toBe(123);
  });

  it("coerces a float string", () => {
    expect(coerceNumber("3.14", 0)).toBeCloseTo(3.14);
  });

  it("returns the default for null", () => {
    expect(coerceNumber(null, 99)).toBe(99);
  });

  it("returns the default for undefined", () => {
    expect(coerceNumber(undefined, 99)).toBe(99);
  });

  it("returns the default for NaN-producing strings", () => {
    expect(coerceNumber("abc", 0)).toBe(0);
  });

  it("returns the default for Infinity", () => {
    expect(coerceNumber("Infinity", 5)).toBe(5);
  });

  it("returns the default for -Infinity", () => {
    expect(coerceNumber("-Infinity", 5)).toBe(5);
  });

  it("handles 0 correctly (not treated as nullish)", () => {
    expect(coerceNumber(0, 99)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(coerceNumber(-10, 0)).toBe(-10);
    expect(coerceNumber("-10", 0)).toBe(-10);
  });

  it("coerces empty string to 0 (Number('') === 0, which is finite)", () => {
    expect(coerceNumber("", 7)).toBe(0);
  });
});
