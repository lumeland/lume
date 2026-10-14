import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import sri from "../src/mod.ts";

describe("sri plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(sri());

    expect(await build(site)).toMatchSnapshot();
  });
});
