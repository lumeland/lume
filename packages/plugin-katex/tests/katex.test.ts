import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import katex from "../src/mod.ts";

describe("katex plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      katex({
        options: {
          macros: {
            "\\f": "#1f(#2)",
          },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should not output assets", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      katex({
        cssFile: false,
        options: {
          macros: {
            "\\f": "#1f(#2)",
          },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
