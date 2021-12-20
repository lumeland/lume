import { assertStrictEquals as equals } from "../../deps/assert.ts";
import { assertEqualsPaths } from "../utils.ts";
import { platformPath } from "../../core/utils.ts";
import StaticFiles from "../../core/static_files.ts";

Deno.test("Static files", async (t) => {
  const files = new StaticFiles();

  equals(files.paths.size, 0);
  equals(files.entries().length, 0);

  await t.step("Add a file", () => {
    files.add("/a/b", "/c/d");
    equals(files.paths.size, 1);
    assertEqualsPaths(files.paths.get(platformPath("/a/b")), "/c/d");
  });

  await t.step("Add the same file without slash", () => {
    files.add("a/b", "/c/d");
    equals(files.paths.size, 1);
    assertEqualsPaths(files.paths.get(platformPath("/a/b")), "/c/d");
  });

  await t.step("Add a file without slash", () => {
    files.add("e/f", "g/h");
    equals(files.paths.size, 2);
    assertEqualsPaths(files.paths.get(platformPath("/e/f")), "/g/h");
  });

  await t.step("Search", () => {
    const result = files.search("/a/b")!;
    assertEqualsPaths(result[0], "/a/b");
    assertEqualsPaths(result[1], "/c/d");
  });

  await t.step("Search without slash and with subpaths", () => {
    const result = files.search("a/b/e")!;
    assertEqualsPaths(result[0], "/a/b/e");
    assertEqualsPaths(result[1], "/c/d/e");
  });

  await t.step("Search not found", () => {
    const result = files.search("not-found");
    equals(result, undefined);
  });

  await t.step("Search reverse", () => {
    const result = files.searchReverse("/c/d")!;
    assertEqualsPaths(result[0], "/a/b");
    assertEqualsPaths(result[1], "/c/d");
  });

  await t.step("Search reverse without slash and with subpaths", () => {
    const result = files.searchReverse("c/d/e/f")!;
    assertEqualsPaths(result[0], "/a/b/e/f");
    assertEqualsPaths(result[1], "/c/d/e/f");
  });
});
