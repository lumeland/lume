import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import unoCSS from "../src/mod.ts";

describe("unocss plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      unoCSS({
        cssFile: false,
        options: {
          transformers: [],
        },
        reset: "tailwind",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with css file", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      unoCSS({
        cssFile: "styles.css",
        options: {
          transformers: [],
        },
        reset: "tailwind",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with transformers", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("styles.css");
    site.use(
      unoCSS({
        cssFile: "styles.css",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with placeholder", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".css"]);
    site.use(
      unoCSS({
        cssFile: "styles.css",
        placeholder: "/* unocss-placeholder */",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
