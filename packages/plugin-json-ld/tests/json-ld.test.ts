import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import jsonLd from "../src/mod.ts";

describe("json-ld plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(jsonLd());

    expect(await build(site)).toMatchSnapshot();
  });
});
