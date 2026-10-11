import { describe, expect, it } from "vitest";

import { getPreviewAvailability } from "./previewAvailability";

// Characterization of the original rule: canPreview = html || subject || text
const legacy = (body: string, preview: string, subject: string): boolean =>
  Boolean(body && subject && preview) || Boolean(subject) || Boolean(body);

describe("getPreviewAvailability", () => {
  it("matches the original rule for every combination of filled fields", () => {
    for (const body of ["", "b"]) {
      for (const preview of ["", "p"]) {
        for (const subject of ["", "s"]) {
          const result = getPreviewAvailability({ body, preview, subject });

          expect(result.canPreview).toBe(legacy(body, preview, subject));
          expect(result.canPreviewHtml).toBe(Boolean(body && subject && preview));
          expect(result.canPreviewSubject).toBe(Boolean(subject));
          expect(result.canPreviewText).toBe(Boolean(body));
        }
      }
    }
  });

  it("cannot preview when everything is empty or only the preview text is set", () => {
    expect(getPreviewAvailability({ body: "", preview: "", subject: "" }).canPreview).toBe(false);
    expect(getPreviewAvailability({ body: "", preview: "p", subject: "" }).canPreview).toBe(false);
  });
});
