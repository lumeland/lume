import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import transformImages from "../src/mod.ts";

describe("transform-images plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("/");
    site.use(transformImages());

    expect(await build(site)).toMatchSnapshot();
  });
});
