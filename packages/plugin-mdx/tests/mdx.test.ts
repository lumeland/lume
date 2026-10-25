import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import jsx from "@lumeland/plugin-jsx";
import mdx from "../src/mod.ts";

describe("mdx plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(jsx());
    site.use(mdx());

    expect(await build(site)).toMatchSnapshot();
  });
});
