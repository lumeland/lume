import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import replace from "../src/mod.ts";

describe("replace plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      replace({
        replacements: {
          Lume: (text: string) => text.toLowerCase(),
          "static site generator": "awesome static site generator",
        },
      }),
    );

    site.addEventListener("beforeBuild", () => {
      site.hooks.replace({
        Lume: (text: string) => text.toUpperCase(),
      });
    });

    expect(await build(site)).toMatchSnapshot();
  });
});
