import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import eta from "../src/mod.ts";

describe("eta plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(eta());

    expect(await build(site)).toMatchSnapshot();
  });
});
