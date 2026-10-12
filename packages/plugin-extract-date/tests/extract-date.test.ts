import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import extractDate from "../src/mod.ts";

describe("extract-date plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });
});
