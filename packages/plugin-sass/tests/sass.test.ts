import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import sass from "../src/mod.ts";

describe("sass plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(sass());
    site.add([".scss", ".sass"]);

    expect(await build(site)).toMatchSnapshot();
  });
});
