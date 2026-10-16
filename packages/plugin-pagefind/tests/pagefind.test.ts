import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import pagefind from "../src/mod.ts";

describe("pagefind plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(pagefind());

    expect(await build(site, { avoidBinaryFilesLength: true })).toMatchSnapshot();
  });
});
