import { describe, it, expect } from "vitest";
import { removeRoot } from "../../src/utils/path.ts";
import { fromFileUrl } from "../../deps/path.ts";

describe("Path utils", async () => {
  it("Remove root", async () => {
    expect(removeRoot("", "foo")).toBe("/foo");
    expect(removeRoot("/foo/", "/foo")).toBe("/");
    expect(removeRoot("/foo/", "/ola")).toBe("/ola");
    expect(removeRoot("/foo/", "/../ola")).toBe("/ola");
    expect(removeRoot("file:///foo", "/foo")).toBe("/");
    expect(removeRoot("file:///foo", "file:///foo")).toBe("/");
    expect(removeRoot("bar", "file:///foo")).toBe("/foo");
    expect(removeRoot("../bar", "file:///foo")).toBe("/foo");
    expect(removeRoot("C:\\bar", "file:///bar")).toBe("/");
    expect(removeRoot("C:\\bar/boo", "file:///bar/boo/baz")).toBe("/baz");
    expect(removeRoot(import.meta.dirname, fromFileUrl(import.meta.resolve("./foo")))).toBe("/foo");
  });
});
