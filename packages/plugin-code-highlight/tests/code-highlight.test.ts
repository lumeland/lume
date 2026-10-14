import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import codeHighlight from "../src/mod.ts";

describe("code-highlight plugin", async () => {
  it("should match site snapshot with a theme", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      codeHighlight({
        theme: {
          name: "a11y-dark",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with a theme and custom file", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      codeHighlight({
        theme: {
          name: "a11y-dark",
          cssFile: "theme.css",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
