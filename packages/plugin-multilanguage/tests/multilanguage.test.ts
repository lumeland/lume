import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import multilanguage from "../src/mod.ts";

describe("multilanguage plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      multilanguage({
        defaultLanguage: "gl",
        languages: ["en", "fr", "it", "gl"],
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
