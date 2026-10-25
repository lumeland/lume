import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import postcss from "../src/mod.ts";
import nano from "cssnano";

describe("postcss plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".css"]);
    site.use(postcss());
    const { helpers } = site.renderer;

    expect(helpers.has("postcss")).toBeTruthy();
    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot without includes", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add(".");
    site.use(
      postcss({
        bundle: false,
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with hooks", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("/index.min.css");
    site.use(postcss());
    site.hooks.addPostcssPlugin(nano());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with copy()", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.copy([".css"]);
    site.copy("index.min.css", "new.css");
    site.use(postcss());

    expect(await build(site)).toMatchSnapshot();
  });
});
