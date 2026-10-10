import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import modifyUrls from "../src/mod.ts";

describe("modify-urls plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      modifyUrls({
        fn(url) {
          return url.toUpperCase() + "#foo";
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
