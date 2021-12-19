import { assertStrictEquals as equals } from "../../deps/assert.ts";
import Scopes from "../../core/scopes.ts";
import { Page } from "../../core/filesystem.ts";

Deno.test("Scripts", async (t) => {
  const scopes = new Scopes();

  equals(scopes.scopes.size, 0);

  const pages: Page[] = [
    new Page({ path: "file1", ext: ".foo" }),
    new Page({ path: "file2", ext: ".bar" }),
    new Page({ path: "file3", ext: ".css" }),
    new Page({ path: "file4", ext: ".html" }),
  ];

  await t.step("Add scopes", () => {
    scopes.scopes.add((path: string) => path.endsWith(".foo"));
    equals(scopes.scopes.size, 1);

    scopes.scopes.add((path: string) => path.endsWith(".bar"));
    equals(scopes.scopes.size, 2);
  });

  await t.step("Check scoped changes", () => {
    const filter = scopes.getFilter([
      "file1.foo",
      "file3.foo",
    ]);

    const filteredPages = pages.filter(filter);
    equals(filteredPages.length, 1);
    equals(filteredPages[0].src.path, "file1");
  });

  await t.step("Check 2 scoped changes", () => {
    const filter = scopes.getFilter([
      "file1.foo",
      "file2.bar",
    ]);

    const filteredPages = pages.filter(filter);
    equals(filteredPages.length, 2);
    equals(filteredPages[0].src.path, "file1");
    equals(filteredPages[1].src.path, "file2");
  });

  await t.step("Check unscoped changes", () => {
    const filter = scopes.getFilter([
      "file3.css",
    ]);

    const filteredPages = pages.filter(filter);
    equals(filteredPages.length, 2);
    equals(filteredPages[0].src.path, "file3");
    equals(filteredPages[1].src.path, "file4");
  });

  await t.step("Check scoped and unscoped changes", () => {
    const filter = scopes.getFilter([
      "file3.css",
      "file1.foo",
    ]);

    const filteredPages = pages.filter(filter);
    equals(filteredPages.length, 3);
    equals(filteredPages[0].src.path, "file1");
    equals(filteredPages[1].src.path, "file3");
    equals(filteredPages[2].src.path, "file4");
  });
});
