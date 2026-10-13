import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import terser from "../src/mod.ts";

describe("terser plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".js"]);
    site.use(terser());

    expect(await build(site)).toMatchSnapshot();
  });
});
