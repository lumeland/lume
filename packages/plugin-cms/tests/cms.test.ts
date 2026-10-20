import { describe, it, expect } from "vitest";
import { getSite } from "@lumeland/testing/site.ts";
import createCms from "@lumeland/cms";
import lumeCms from "../src/mod.ts";

describe("cms plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      location: new URL("https://example.com/"),
    });
    const cms = createCms();

    site.use(lumeCms({ cms }));

    expect(cms.options.basePath).toBe("/admin");
    expect(cms.options.site.url).toBe("https://example.com/");
    expect(cms.options.data.site).toBe(site);
  });
});
