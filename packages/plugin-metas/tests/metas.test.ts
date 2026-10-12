import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import metas from "../src/mod.ts";

describe("metas plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(metas());
    site.preprocess([".md"], (pages) => {
      pages.forEach((page) => {
        page.data.excerpt ??= (page.data.content as string).split("<!--more-->")[0];
      });
    });

    expect(await build(site)).toMatchSnapshot();
  });
});
