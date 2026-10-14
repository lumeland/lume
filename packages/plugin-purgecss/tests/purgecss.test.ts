import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import { normalizePath } from "@lumeland/core/utils/path.ts";
import { fromFileUrl } from "../deps/path.ts";
import purgecss from "../src/mod.ts";

describe("purgecss plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(purgecss());
    site.add([".css", ".js"]);
    site.add("static", ".");

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with custom options", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      purgecss({
        options: {
          content: [
            normalizePath(fromFileUrl(import.meta.resolve("./assets/purgecss/static/**/*.html"))),
            {
              raw: '<img id="img-option" src="">',
              extension: "html",
            },
          ],
          safelist: ["unused"],
          blocklist: ["strong"],
          variables: true,
        },
      }),
    );
    site.add([".css", ".js"]);
    site.add("static", ".");

    expect(await build(site)).toMatchSnapshot();
  });
});
