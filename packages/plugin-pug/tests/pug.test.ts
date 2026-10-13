import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import pug from "../src/mod.ts";

describe("pug plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(pug());

    expect(await build(site)).toMatchSnapshot();
  });
});
