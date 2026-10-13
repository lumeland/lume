import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import toc, { linkInsideHeader } from "../src/mod.ts";

describe("toc plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(toc());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with linkInsideHeader", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(toc({
    minLevel: 1,
    tabIndex: false,
    anchor: linkInsideHeader({
      content: "¶",
    }),
  }));

    expect(await build(site)).toMatchSnapshot();
  });
});
