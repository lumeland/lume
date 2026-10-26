import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import sourceMaps from "@lumeland/plugin-source-maps";
import tailwindCSS from "../src/mod.ts";

describe("tailwindcss plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(tailwindCSS());
    site.add([".css"]);

    expect(await build(site, { maxStringContentLength: 1000 })).toMatchSnapshot();
  });

  it("should minify the site", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      tailwindCSS({
        minify: true,
      }),
    );
    site.add([".css"]);

    expect(await build(site, { maxStringContentLength: 1000 })).toMatchSnapshot();
  });

  it("should generate source maps", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".css"]);
    site.use(tailwindCSS());
    site.use(sourceMaps());

    expect(await build(site, { maxStringContentLength: 1000 })).toMatchSnapshot();
  });
});
