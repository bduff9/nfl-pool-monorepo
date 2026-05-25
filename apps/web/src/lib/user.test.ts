import { describe, expect, it } from "vitest";

import { getFirstName, getFullName, getLastName } from "./user";

describe("getFullName", () => {
  it("returns UserName when set", () => {
    expect(getFullName({ UserFirstName: "Brian", UserLastName: "Duffey", UserName: "bduffey" })).toBe("bduffey");
  });

  it("combines first and last name when UserName is null", () => {
    expect(getFullName({ UserFirstName: "Brian", UserLastName: "Duffey", UserName: null })).toBe("Brian Duffey");
  });

  it("returns just the first name when last name is null", () => {
    expect(getFullName({ UserFirstName: "Brian", UserLastName: null, UserName: null })).toBe("Brian");
  });

  it("returns just the last name when first name is null", () => {
    expect(getFullName({ UserFirstName: null, UserLastName: "Duffey", UserName: null })).toBe("Duffey");
  });

  it("returns empty string when all fields are null", () => {
    expect(getFullName({ UserFirstName: null, UserLastName: null, UserName: null })).toBe("");
  });

  it("trims whitespace from first and last names", () => {
    expect(getFullName({ UserFirstName: "  Brian  ", UserLastName: "  Duffey  ", UserName: null })).toBe(
      "Brian Duffey",
    );
  });

  it("falls back to first+last name when UserName is empty", () => {
    expect(getFullName({ UserFirstName: "Brian", UserLastName: "Duffey", UserName: "" })).toBe("Brian Duffey");
  });
});

describe("getFirstName", () => {
  it("returns UserFirstName when set", () => {
    expect(getFirstName({ UserFirstName: "Brian", UserLastName: "Duffey", UserName: "Brian Duffey" })).toBe("Brian");
  });

  it("extracts first name from UserName when UserFirstName is null", () => {
    expect(getFirstName({ UserFirstName: null, UserLastName: null, UserName: "Brian Duffey" })).toBe("Brian");
  });

  it("returns UserName as first name when it's a single word", () => {
    expect(getFirstName({ UserFirstName: null, UserLastName: null, UserName: "Brian" })).toBe("Brian");
  });

  it("returns empty string when both UserFirstName and UserName are null", () => {
    expect(getFirstName({ UserFirstName: null, UserLastName: null, UserName: null })).toBe("");
  });

  it("handles multi-part names (first word is first name)", () => {
    expect(getFirstName({ UserFirstName: null, UserLastName: null, UserName: "Mary Jane Watson" })).toBe("Mary");
  });
});

describe("getLastName", () => {
  it("returns UserLastName when set", () => {
    expect(getLastName({ UserFirstName: "Brian", UserLastName: "Duffey", UserName: "Brian Duffey" })).toBe("Duffey");
  });

  it("extracts last name from UserName when UserLastName is null", () => {
    expect(getLastName({ UserFirstName: null, UserLastName: null, UserName: "Brian Duffey" })).toBe("Duffey");
  });

  it("returns empty string for single-word UserName", () => {
    expect(getLastName({ UserFirstName: null, UserLastName: null, UserName: "Brian" })).toBe("");
  });

  it("returns empty string when both UserLastName and UserName are null", () => {
    expect(getLastName({ UserFirstName: null, UserLastName: null, UserName: null })).toBe("");
  });

  it("joins remaining words as last name for multi-part names", () => {
    expect(getLastName({ UserFirstName: null, UserLastName: null, UserName: "Mary Jane Watson" })).toBe("Jane Watson");
  });
});
