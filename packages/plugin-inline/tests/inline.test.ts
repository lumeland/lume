import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import inline from "../src/mod.ts";
import basePath from "@lumeland/plugin-base-path";

describe("inline plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      inline({
        copyAttributes: ["custom", /^data-/, /^@/],
      }),
    );
    site.add([".svg", ".js", ".png", ".css"]);
    site.add("favicon.png", "favicon2.png");

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with sourceURL", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      inline({
        copyAttributes: ["custom", /^data-/, /^@/],
        sourceURL: true,
      }),
    );
    site.add([".svg", ".js", ".png", ".css"]);
    site.add("favicon.png", "favicon2.png");

    expect(await build(site)).toMatchSnapshot();
  });

  it("should inline combined with basePath", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(basePath());
    site.use(inline());

    site.add([".svg", ".js", ".png", ".css"]);
    site.add("favicon.png", "favicon2.png");

    expect(await build(site)).toMatchSnapshot();
  });
});
