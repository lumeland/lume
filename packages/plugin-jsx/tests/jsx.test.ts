import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import jsx from "../src/mod.ts";

describe("jsx plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(jsx());

    expect(await build(site)).toMatchSnapshot();
  });
});
