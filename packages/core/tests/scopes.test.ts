import { describe, it, expect } from "vitest";
import Scopes from "../src/scopes.ts";
import FS, { Entry } from "../src/fs.ts";

describe("Scripts", async () => {
  const scopes = new Scopes();

  expect(scopes.scopes.size).toBe(0);

  const fs = new FS({
    root: "/",
  });

  fs.tree = new Entry("", "/", "directory", "/");
  fs.addEntry({ path: "/file1.foo", type: "file" });
  fs.addEntry({ path: "/file2.bar", type: "file" });
  fs.addEntry({ path: "/file3.css", type: "file" });
  fs.addEntry({ path: "/file4.html", type: "file" });

  const entries = Array.from(fs.entries.values()).filter((entry) => entry.type === "file");

  // Test cache
  it("Test cache", () => {
    const entry = fs.entries.get("/file1.foo")!;
    expect(!!entry).toBe(true);
    expect(entry.flags.size).toBe(0);
    entry.flags.add("foo");
    expect(entry.flags.size).toBe(1);
  });

  it("Add scopes", () => {
    scopes.scopes.add((path: string) => path.endsWith(".foo"));
    expect(scopes.scopes.size).toBe(1);

    scopes.scopes.add((path: string) => path.endsWith(".bar"));
    expect(scopes.scopes.size).toBe(2);
  });

  it("Check scoped changes", () => {
    const filter = scopes.getFilter(["/file1.foo", "/file3.foo"]);

    const filteredEntries = entries.filter(filter);
    expect(filteredEntries.length).toBe(1);
    expect(filteredEntries[0].path).toBe("/file1.foo");
  });

  it("Check 2 scoped changes", () => {
    const filter = scopes.getFilter(["/file1.foo", "/file2.bar"]);

    const filteredEntries = entries.filter(filter);
    expect(filteredEntries.length).toBe(2);
    expect(filteredEntries[0].path).toBe("/file1.foo");
    expect(filteredEntries[1].path).toBe("/file2.bar");
  });

  it("Check unscoped changes", () => {
    const filter = scopes.getFilter(["/file3.css"]);

    const filteredEntries = entries.filter(filter);
    expect(filteredEntries.length).toBe(2);
    expect(filteredEntries[0].path).toBe("/file3.css");
    expect(filteredEntries[1].path).toBe("/file4.html");
  });

  it("Check scoped and unscoped changes", () => {
    const filter = scopes.getFilter(["/file3.css", "/file1.foo"]);

    const filteredEntries = entries.filter(filter);
    expect(filteredEntries.length).toBe(3);
    expect(filteredEntries[0].path).toBe("/file1.foo");
    expect(filteredEntries[1].path).toBe("/file3.css");
    expect(filteredEntries[2].path).toBe("/file4.html");
  });
});
