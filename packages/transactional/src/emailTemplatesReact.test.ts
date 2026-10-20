import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// The cron Lambdas bundle these templates with esbuild, which compiles JSX to React.createElement. A template
// without `import * as React` only throws "React is not defined" in the deployed bundle, so catch it here.
const templatesDir = join(import.meta.dirname, "../emails/templates");

const listTsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return listTsxFiles(join(dir, entry.name));
    }

    return entry.name.endsWith(".tsx") ? [join(dir, entry.name)] : [];
  });

const usesJsx = (source: string): boolean =>
  /<[A-Za-z][\w.]*[\s/>]/.test(source.replaceAll(/^\s*(import|export type)\b.*$/gm, ""));

const importsReact = (source: string): boolean => /^import (\* as )?React\b.*from "react";?$/m.test(source);

describe("email templates", () => {
  const files = listTsxFiles(templatesDir);

  it("finds the templates to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => [file.slice(templatesDir.length + 1), file]))(
    "%s imports React when it uses JSX",
    (_name, file) => {
      const source = readFileSync(file, "utf8");

      if (usesJsx(source)) {
        expect(importsReact(source)).toBe(true);
      }
    },
  );
});
