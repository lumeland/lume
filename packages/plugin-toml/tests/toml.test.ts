import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";

describe("TOML plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    expect(await build(site)).toMatchSnapshot();
  });
});
