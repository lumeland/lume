import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import lightningCSS from "../src/mod.ts";

describe("lightningcss plugin", async () => {
  it("should match site snapshot with transform", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("index.css");
    site.add("text.css");
    site.use(
      lightningCSS({
        includes: false,
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with bundle", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".css"]);
    site.use(lightningCSS());

    expect(await build(site)).toMatchSnapshot();
  });
});
