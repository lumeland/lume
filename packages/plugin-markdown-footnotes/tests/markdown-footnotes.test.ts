import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import markdownFootnotes from "../src/mod.ts";

describe("markdown-footnotes plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(markdownFootnotes());

    expect(await build(site)).toMatchSnapshot();
  });
});
