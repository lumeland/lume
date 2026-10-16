import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import pwa from "../src/mod.ts";

describe("pwa plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(pwa());

    expect(await build(site)).toMatchSnapshot();
  });
});
