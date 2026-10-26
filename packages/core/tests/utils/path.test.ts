import { describe, it, expect } from "vitest";
import { fromFileUrl } from "../../deps/path.ts";
import Path from "../../src/path.ts";

describe("Path class", async () => {
  it("Remove base", async () => {
    const removeBase = (root: string, path: string) =>
      Path.create(path).removeBase(root).toString();
    expect(removeBase("", "foo")).toBe("/foo");
    expect(removeBase("/foo/", "/foo")).toBe("/");
    expect(removeBase("/foo/", "/ola")).toBe("/ola");
    expect(removeBase("/foo/", "/../ola")).toBe("/ola");
    expect(removeBase(import.meta.dirname, fromFileUrl(import.meta.resolve("./foo")))).toBe("/foo");
  });

  it("Get/Set extension", async () => {
    const getExtension = (path: string) => Path.create(path).extension;
    const setExtension = (path: string, ext: string) => {
      const p = Path.create(path);
      p.extension = ext;
      return p.toString();
    };

    expect(getExtension("/foo.bar")).toBe(".bar");
    expect(getExtension("/foo.BAR")).toBe(".bar");
    expect(setExtension("/foo", ".bar")).toBe("/foo.bar");
    expect(setExtension("/foo.foo", ".bar")).toBe("/foo.bar");
  });

  it("Join", async () => {
    const join = (path: string, paths: string[]) =>
      Path.create(path)
        .join(...paths)
        .toString();

    expect(join("/foo", ["bar"])).toBe("/foo/bar");
  });

  it("Basename", async () => {
    const basename = (path: string) => Path.create(path).basename;

    expect(basename("/foo")).toBe("foo");
    expect(basename("/")).toBe("");
    expect(basename("/other/")).toBe("other");
    expect(basename("/other/more.txt")).toBe("more");
  });
});
