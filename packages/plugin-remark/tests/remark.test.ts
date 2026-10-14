import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import remark from "../src/mod.ts";

describe("remark plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(remark());

    expect(await build(site)).toMatchSnapshot();
  });
});
