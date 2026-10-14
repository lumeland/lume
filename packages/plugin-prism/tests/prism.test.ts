import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import prism from "../src/mod.ts";

describe("prism plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      prism({
        theme: {
          name: "dark",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should save the css theme in a specific file", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      prism({
        theme: {
          name: "dark",
          cssFile: "theme.css",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
