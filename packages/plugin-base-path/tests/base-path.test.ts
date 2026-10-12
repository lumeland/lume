import { describe, it, expect } from "vitest";
import basePath from "../src/mod.ts";
import { build, getSite } from "@lumeland/testing/site.ts";

describe("base-path plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    site.use(basePath());
    site.add([".css"]);

    expect(await build(site)).toMatchSnapshot();
  });
  it("No path", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/"),
    });

    site.use(basePath());
    site.add([".css"]);

    expect(await build(site)).toMatchSnapshot();
  });
});
