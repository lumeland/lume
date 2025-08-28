import { assertStrictEquals as equals } from "../../deps/assert.ts";
import Scopes from "../../core/scopes.ts";
import FS, { Entry } from "../../core/fs.ts";

Deno.test("Scripts", async (t) => {
  const scopes = new Scopes();

  equals(scopes.scopes.size, 0);

  const fs = new FS({
    root: "/",
  });

  fs.tree = new Entry("", "/", "directory", "/");
  fs.addEntry({ path: "/file1.foo", type: "file" });
  fs.addEntry({ path: "/file2.bar", type: "file" });
  fs.addEntry({ path: "/file3.css", type: "file" });
  fs.addEntry({ path: "/file4.html", type: "file" });

  const entries = Array.from(fs.entries.values()).filter((entry) =>
    entry.type === "file"
  );

  // Test cache
  await t.step("Test cache", () => {
    const entry = fs.entries.get("/file1.foo")!;
    equals(!!entry, true);
    equals(entry.flags.size, 0);
    entry.flags.add("foo");
    equals(entry.flags.size, 1);
  });

  await t.step("Add scopes", () => {
    scopes.scopes.add((path: string) => path.endsWith(".foo"));
    equals(scopes.scopes.size, 1);

    scopes.scopes.add((path: string) => path.endsWith(".bar"));
    equals(scopes.scopes.size, 2);
  });

  await t.step("Check scoped changes", () => {
    const filter = scopes.getFilter([
      "/file1.foo",
      "/file3.foo",
    ]);

    const filteredEntries = entries.filter(filter);
    equals(filteredEntries.length, 1);
    equals(filteredEntries[0].path, "/file1.foo");
  });

  await t.step("Check 2 scoped changes", () => {
    const filter = scopes.getFilter([
      "/file1.foo",
      "/file2.bar",
    ]);

    const filteredEntries = entries.filter(filter);
    equals(filteredEntries.length, 2);
    equals(filteredEntries[0].path, "/file1.foo");
    equals(filteredEntries[1].path, "/file2.bar");
  });

  await t.step("Check unscoped changes", () => {
    const filter = scopes.getFilter([
      "/file3.css",
    ]);

    const filteredEntries = entries.filter(filter);
    equals(filteredEntries.length, 2);
    equals(filteredEntries[0].path, "/file3.css");
    equals(filteredEntries[1].path, "/file4.html");
  });

  await t.step("Check scoped and unscoped changes", () => {
    const filter = scopes.getFilter([
      "/file3.css",
      "/file1.foo",
    ]);

    const filteredEntries = entries.filter(filter);
    equals(filteredEntries.length, 3);
    equals(filteredEntries[0].path, "/file1.foo");
    equals(filteredEntries[1].path, "/file3.css");
    equals(filteredEntries[2].path, "/file4.html");
  });
});
