import { describe, expect, it } from "vitest";

import { getAdminNewUserEmailProps, getNewUserEmailProps } from "./adminNewUserEmailProps";

const links = { browserLink: "https://example.com/b", unsubscribeLink: "https://example.com/u" };

describe("getAdminNewUserEmailProps", () => {
  it("passes populated values through", () => {
    expect(
      getAdminNewUserEmailProps(
        { UserEmail: "admin@example.com", UserFirstName: "Ada" },
        { UserEmail: "new@example.com", UserName: "New User", UserReferredByRaw: "Bob" },
        links,
      ),
    ).toEqual({
      adminUserFirstName: "Ada",
      browserLink: "https://example.com/b",
      newUserUserEmail: "new@example.com",
      newUserUserName: "New User",
      newUserUserReferredByRaw: "Bob",
      unsubscribeLink: "https://example.com/u",
    });
  });

  it("falls back to empty strings for null values", () => {
    expect(
      getAdminNewUserEmailProps(
        { UserEmail: "admin@example.com", UserFirstName: null },
        { UserEmail: "new@example.com", UserName: null, UserReferredByRaw: null },
        links,
      ),
    ).toEqual({
      adminUserFirstName: "",
      browserLink: "https://example.com/b",
      newUserUserEmail: "new@example.com",
      newUserUserName: "",
      newUserUserReferredByRaw: "",
      unsubscribeLink: "https://example.com/u",
    });
  });
});

describe("getNewUserEmailProps", () => {
  const baseProps = {
    adminUserFirstName: "Ada",
    browserLink: "b",
    newUserUserEmail: "new@example.com",
    newUserUserName: "N",
    newUserUserReferredByRaw: "R",
    unsubscribeLink: "u",
  };

  it("adds the history and team name", () => {
    expect(
      getNewUserEmailProps(baseProps, { UserTeamName: "Team" }, { isReturning: true, yearsPlayed: "2023, 2024" }),
    ).toEqual({ ...baseProps, isReturning: true, newUserUserTeamName: "Team", yearsPlayed: "2023, 2024" });
  });

  it("falls back to an empty team name", () => {
    expect(getNewUserEmailProps(baseProps, { UserTeamName: null }, { isReturning: false, yearsPlayed: "" })).toEqual({
      ...baseProps,
      isReturning: false,
      newUserUserTeamName: "",
      yearsPlayed: "",
    });
  });
});
