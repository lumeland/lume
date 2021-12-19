import { assertStrictEquals as equals } from "../../deps/assert.ts";
import StaticFiles from "../../core/static_files.ts";

Deno.test("Static files", async (t) => {
  const files = new StaticFiles();

  equals(files.paths.size, 0);
  equals(files.entries().length, 0);

  await t.step("Add a file", () => {
    files.add("/a/b", "/c/d");
    equals(files.paths.size, 1);
    equals(files.paths.get("/a/b"), "/c/d");
  });

  await t.step("Add the same file without slash", () => {
    files.add("a/b", "/c/d");
    equals(files.paths.size, 1);
    equals(files.paths.get("/a/b"), "/c/d");
  });

  await t.step("Add a file without slash", () => {
    files.add("e/f", "g/h");
    equals(files.paths.size, 2);
    equals(files.paths.get("/e/f"), "/g/h");
  });

  await t.step("Search", () => {
    const result = files.search("/a/b")!;
    equals(result[0], "/a/b");
    equals(result[1], "/c/d");
  });

  await t.step("Search without slash and with subpaths", () => {
    const result = files.search("a/b/e")!;
    equals(result[0], "/a/b/e");
    equals(result[1], "/c/d/e");
  });

  await t.step("Search not found", () => {
    const result = files.search("not-found");
    equals(result, undefined);
  });

  await t.step("Search reverse", () => {
    const result = files.searchReverse("/c/d")!;
    equals(result[0], "/a/b");
    equals(result[1], "/c/d");
  });

  await t.step("Search reverse without slash and with subpaths", () => {
    const result = files.searchReverse("c/d/e/f")!;
    equals(result[0], "/a/b/e/f");
    equals(result[1], "/c/d/e/f");
  });
});
