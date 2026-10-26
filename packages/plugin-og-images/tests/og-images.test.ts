import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import ogImages from "../src/mod.ts";

describe("og-images plugin", async () => {
  it("should match site snapshot", { timeout: 10000 }, async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(ogImages());
    site.filter("tolower", (v) => v?.toLowerCase());

    expect(await build(site)).toMatchSnapshot();
  });
});
