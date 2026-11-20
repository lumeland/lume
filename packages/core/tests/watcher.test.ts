import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import FSWatcher from "../src/watcher.ts";

describe("FSWatcher", () => {
  it("marks a dependent file when an ignored dependency changes", { timeout: 10000 }, async () => {
    const root = await mkdtemp(join(tmpdir(), "lume-watcher-"));

    try {
      await mkdir(join(root, "ignored"));
      await writeFile(join(root, "ignored/dep.zig"), "");
      await writeFile(join(root, "target.ts"), "");

      const watcher = new FSWatcher({
        root,
        ignore: ["/ignored"],
        debounce: 10,
        dependencies: { "target.ts": ["ignored/dep.zig"] },
      });

      const started = new Promise<void>((resolve) => {
        watcher.addEventListener("start", () => resolve(), { once: true });
      });

      const changed = new Promise<string[]>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("the watcher did not report the dependent file")),
          5000,
        );
        watcher.addEventListener("change", (event) => {
          clearTimeout(timer);
          if (!event.files) {
            reject(new Error("the change event carried no files"));
          } else {
            resolve([...event.files]);
          }
          return false; // stop the watcher
        });
      });

      void watcher.start().catch(() => {});
      await started;
      // `start` is dispatched before the watch iterator is consumed.
      await new Promise((resolve) => setTimeout(resolve, 200));
      await writeFile(join(root, "ignored/dep.zig"), "changed");

      expect(await changed).toContain("/target.ts");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
