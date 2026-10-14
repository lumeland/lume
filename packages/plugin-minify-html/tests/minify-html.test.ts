import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import minifyHTML from "../src/mod.ts";

describe("minify-html plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(minifyHTML());

    expect(await build(site)).toMatchSnapshot();
  });
});
