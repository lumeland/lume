import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import lume from "../src/mod.ts";

describe("lume", () => {
  it("keeps the built-in ignores in the source scan but not watcher.ignore", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lume-watcher-"));

    try {
      const site = lume({ cwd, watcher: { ignore: ["/ignored"] } }, {}, false);
      const ignore = site.fs.options.ignore?.map(String) ?? [];

      // Built-in defaults are documented as always ignored.
      expect(ignore).toContain("/node_modules");
      // `watcher.ignore` only filters watch events.
      expect(ignore).not.toContain("/ignored");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
