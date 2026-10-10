import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";

describe("Vento plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    site.filter("upper", (value: string) => value.toUpperCase());
    site.filter("fromPage", function (key) {
      return this?.data?.[key];
    });
    site.filter(
      "fromPageAsync",
      function (key) {
        return Promise.resolve(this?.data?.[key]);
      },
      true,
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
