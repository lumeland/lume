import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import extractOrder from "../src/mod.ts";

describe("extract-order plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(extractOrder());

    expect(await build(site)).toMatchSnapshot();
  });
});
