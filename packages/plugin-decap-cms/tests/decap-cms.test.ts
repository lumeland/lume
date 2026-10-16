import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import decapCMS from "../src/mod.ts";

describe("decap-cms plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      decapCMS({
        local: false,
        identity: "netlify",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
