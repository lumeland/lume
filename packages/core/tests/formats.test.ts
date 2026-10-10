import { describe, it, expect } from "vitest";
import Formats from "../src/formats.ts";

describe("Formats", async () => {
  const formats = new Formats();

  expect(formats.entries.size).toBe(0);
  expect(formats.size).toBe(0);

  it("Add extensions", () => {
    formats.set({ ext: ".foo" });
    expect(formats.entries.size).toBe(1);
    expect(formats.size).toBe(1);
    expect(formats.get(".foo")?.ext).toBe(".foo");
    expect(formats.has(".foo")).toBeTruthy();

    formats.set({ ext: ".foo" });
    expect(formats.entries.size).toBe(1);
    expect(formats.size).toBe(1);
    expect(formats.get(".foo")?.ext).toBe(".foo");
    expect(formats.has(".foo")).toBeTruthy();
  });

  it("Add subextensions", () => {
    formats.set({ ext: ".sub.foo" });
    expect(formats.entries.size).toBe(2);
    expect(formats.size).toBe(2);
    expect(formats.has(".sub.foo")).toBeTruthy();
  });

  it("Search extensions", () => {
    const format = formats.search("name.foo");
    expect(format).toBeTruthy();
    expect(format?.ext).toBe(".foo");
  });

  it("Search subextensions", () => {
    const format = formats.search("name.sub.foo");
    expect(format).toBeTruthy();
    expect(format?.ext).toBe(".sub.foo");
  });
});
