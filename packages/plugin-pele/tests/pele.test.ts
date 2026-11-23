import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import pele from "../src/mod.ts";

describe("pele plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(pele())

    expect(await build(site)).toMatchSnapshot();
  });
});
