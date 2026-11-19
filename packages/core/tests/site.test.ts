import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Site from "../src/site.ts";

describe("Site", () => {
  it("does not apply watcher.ignore to the source scan", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lume-ignore-"));

    try {
      await mkdir(join(cwd, "ignored"));
      await writeFile(join(cwd, "ignored/hello.txt"), "hello");

      const site = new Site({
        cwd,
        dest: "./_site",
        watcher: { ignore: ["/ignored"] },
      });

      expect(site.fs.options.ignore).not.toContain("/ignored");

      site.add("ignored/hello.txt");
      await site.build();

      expect(await readFile(join(cwd, "_site/ignored/hello.txt"), "utf8")).toBe("hello");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
