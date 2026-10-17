import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import slugifyUrls from "@lumeland/plugin-slugify-urls";
import resolveUrls from "../src/mod.ts";

describe("resolve-urls plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("statics", "");
    site.use(resolveUrls());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should support slugify urls", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("statics", "");
    site.use(resolveUrls());
    site.use(slugifyUrls());

    expect(await build(site)).toMatchSnapshot();
  });
});
