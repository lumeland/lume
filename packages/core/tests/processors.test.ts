import { describe, it, expect } from "vitest";
import Processors from "../src/processors.ts";
import { Page } from "../src/file.ts";

describe("Processors", async () => {
  const processors = new Processors();

  expect(processors.processors.size).toBe(0);

  it("Add processors", () => {
    const ext = [".foo"];
    const fn = (pages: Page[]) => {
      pages.forEach((page) => {
        const content = page.content as string;
        page.content = content.toUpperCase();
      });
    };

    processors.set(ext, fn);

    expect(processors.processors.size).toBe(1);
    const entry = Array.from(processors.processors)[0];
    expect(entry[0]).toBe(fn);
    expect(entry[1]).toBe(ext);

    const asterisk = (pages: Page[]) => {
      pages.forEach((page) => {
        const content = page.content as string;
        page.content = content + "*";
      });
    };

    processors.set("*", asterisk);

    expect(processors.processors.size).toBe(2);
  });
});
