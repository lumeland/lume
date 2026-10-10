import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";

describe("Modules plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    expect(await build(site)).toMatchSnapshot();
  });
});
