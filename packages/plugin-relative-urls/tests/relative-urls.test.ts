import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import relativeUrls from "../src/mod.ts";

describe("relative-urls plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    site.use(relativeUrls());
    site.add([".css"]);

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with pretty urls disabled", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
      prettyUrls: false,
    });

    site.use(relativeUrls());

    expect(await build(site)).toMatchSnapshot();
  });
});
