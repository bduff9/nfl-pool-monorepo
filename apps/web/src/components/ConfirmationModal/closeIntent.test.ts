import { describe, expect, it } from "vitest";

import { createCloseIntent } from "./closeIntent";

describe("createCloseIntent", () => {
  it("never reports a cancel when the focus scope unmounts without the user closing (StrictMode remount)", () => {
    const intent = createCloseIntent();

    expect(intent.takeCancel()).toBe(false);
    expect(intent.takeCancel()).toBe(false);
  });

  it("reports a cancel (the Cancel button, Escape or a tap outside) exactly once", () => {
    const intent = createCloseIntent();

    intent.cancel();

    expect(intent.takeCancel()).toBe(true);
    expect(intent.takeCancel()).toBe(false);
  });

  it("never reports a cancel after the user confirmed, even if they also dismissed while it ran", () => {
    const intent = createCloseIntent();

    intent.accept();

    expect(intent.takeCancel()).toBe(false);

    intent.cancel();

    expect(intent.takeCancel()).toBe(false);
  });

  it("starts over when the dialog opens again", () => {
    const intent = createCloseIntent();

    intent.accept();
    intent.open();
    intent.cancel();

    expect(intent.takeCancel()).toBe(true);

    intent.cancel();
    intent.open();

    expect(intent.takeCancel()).toBe(false);
  });
});
