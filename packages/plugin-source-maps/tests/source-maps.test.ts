import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import sass from "@lumeland/plugin-sass";
import postcss from "@lumeland/plugin-postcss";
import lightningCSS from "@lumeland/plugin-lightningcss";
import esbuild from "@lumeland/plugin-esbuild";
import terser from "@lumeland/plugin-terser";
import sourceMaps from "../src/mod.ts";

describe("source-maps plugin", async () => {
  it("should match CSS source maps", async () => {
    expect(true).toBe(true);
    const site = getSite({
      cwd: import.meta.resolve("./assets-css"),
    });
    site.add([".css", ".sass", ".css"]);

    site.use(sass());
    site.use(postcss());
    site.use(
      lightningCSS({
        bundle: false,
      }),
    );
    site.use(sourceMaps());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match JS source maps", async () => {
    expect(true).toBe(true);
    const site = getSite({
      cwd: import.meta.resolve("./assets-js"),
    });
    site.add([".ts"]);

    site.use(esbuild());
    site.use(terser());
    site.use(sourceMaps());

    expect(await build(site)).toMatchSnapshot();
  });
});
