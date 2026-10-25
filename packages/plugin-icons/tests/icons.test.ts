import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import icons from "../src/mod.ts";

describe("icons plugin", async () => {
  it("should match site snapshot", { timeout: 10_000 }, async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(icons());

    expect(await build(site)).toMatchSnapshot();
  });
});
