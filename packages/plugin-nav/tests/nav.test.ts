import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import nav from "../src/mod.ts";

describe("nav plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(nav({ order: "order basename" }));

    expect(await build(site)).toMatchSnapshot();
  });

  it("pretty urls disabled", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      prettyUrls: false,
    });

    site.use(nav({ order: "order basename" }));

    expect(await build(site)).toMatchSnapshot();
  });
});
