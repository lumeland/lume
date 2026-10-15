import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import svgo from "@lumeland/plugin-svgo";
import favicon from "../src/mod.ts";

describe("favicon plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(svgo());
    site.use(favicon());

    expect(await build(site)).toMatchSnapshot();
  });
});
