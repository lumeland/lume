import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyDir } from "../../src/utils/fs.ts";

describe("emptyDir", () => {
  it("removes every entry, not only the first", () => {
    const dir = mkdtempSync(join(tmpdir(), "lume-empty-dir-"));
    writeFileSync(join(dir, "a.txt"), "");
    writeFileSync(join(dir, "b.txt"), "");
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "c.txt"), "");

    emptyDir(dir);

    expect(readdirSync(dir)).toEqual([]);
  });

  it("creates the directory when it does not exist", () => {
    const dir = join(mkdtempSync(join(tmpdir(), "lume-empty-dir-")), "missing");

    emptyDir(dir);

    expect(readdirSync(dir)).toEqual([]);
  });
});
